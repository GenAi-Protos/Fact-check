import api.routes
import json
import re
import os
import uuid
import shutil
import tempfile
import logging
import time
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from utils.extractors import ContentExtractor
from services.agents.agent_factory import AgentFactory
from core.teams.fact_check_team import create_fact_check_team
from models.schemas import IntermediateResponse, FinalResponse, FinalSteps


class FactChecker:
    """
    Core fact checking service that processes queries and returns fact-checked responses.
    """
    
    def __init__(self):
        """Initialize the fact checker with required components"""
        self.content_extractor = ContentExtractor()
    
    def _parse_model_response(self, response):
        """
        Parse the model's response, extracting any JSON and formatting it correctly.
        
        Args:
            response: The raw response from the model
            
        Returns:
            A properly structured FinalResponse object
        """
        try:
            # First attempt: check if the response is already a valid FinalResponse
            if isinstance(response, FinalResponse):
                return response
                
            # If it's a string, try to find and parse any JSON within it
            if isinstance(response, str):
                # Look for multiple JSON objects in the response
                json_matches = re.findall(r'(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})', response, re.DOTALL)
                
                if json_matches:
                    claim_objects = []
                    
                    for json_str in json_matches:
                        try:
                            # Try to parse each JSON object
                            parsed = json.loads(json_str)
                            
                            # Check if it's a claim object
                            if isinstance(parsed, dict) and "claim" in parsed and "verdict" in parsed:
                                # Convert case of confidence if needed
                                if "Confidence" in parsed and "confidence" not in parsed:
                                    parsed["confidence"] = parsed.pop("Confidence")
                                    
                                # Add to our list of claims
                                claim_objects.append(FinalSteps(**parsed))
                        except (json.JSONDecodeError, TypeError) as e:
                            print(f"Failed to parse JSON object: {str(e)}")
                    
                    # If we found any valid claims, return them
                    if claim_objects:
                        return FinalResponse(claims=claim_objects)
                    
                # Single JSON object fallback
                json_match = re.search(r'(\{.*\})', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                    try:
                        # Try to parse the extracted JSON
                        parsed = json.loads(json_str)
                        
                        # Handle case where we have a single claim
                        if isinstance(parsed, dict) and "claim" in parsed and "verdict" in parsed:
                            # Convert case of confidence if needed
                            if "Confidence" in parsed and "confidence" not in parsed:
                                parsed["confidence"] = parsed.pop("Confidence")
                                
                            # Create a list with just the one claim
                            return FinalResponse(claims=[FinalSteps(**parsed)])
                    except json.JSONDecodeError:
                        pass
            
            # Attempt to extract multiple claims when it's not in valid JSON format
            # Look for patterns like "Claim 1:", "Claim 2:", etc.
            if isinstance(response, str):
                claims_section = re.split(r'Claim\s*\d+\s*:', response)
                if len(claims_section) > 1:
                    claim_objects = []
                    for i, section in enumerate(claims_section[1:], 1):  # Skip the first element as it's before "Claim 1:"
                        try:
                            # Extract important elements
                            claim_text = re.search(r'(.*?)Verdict\s*:', section, re.DOTALL)
                            verdict = re.search(r'Verdict\s*:\s*(\w+)', section)
                            explanation = re.search(r'Explanation\s*:\s*(.*?)(?:Citations|Confidence|$)', section, re.DOTALL)
                            confidence = re.search(r'Confidence\s*:\s*(0\.\d+)', section)
                            
                            if claim_text and verdict and explanation:
                                claim_obj = FinalSteps(
                                    claim=claim_text.group(1).strip(),
                                    verdict=verdict.group(1).strip(),
                                    explanation=explanation.group(1).strip(),
                                    citations=[],  # Will need to be filled separately
                                    confidence=float(confidence.group(1)) if confidence else 0.5
                                )
                                claim_objects.append(claim_obj)
                        except Exception as e:
                            print(f"Error parsing claim section {i}: {str(e)}")
                    
                    if claim_objects:
                        return FinalResponse(claims=claim_objects)
            
            # If we couldn't parse the response at all, create a default response
            return FinalResponse(claims=[
                FinalSteps(
                    claim="Unable to process the claim",
                    verdict="Uncertain",
                    explanation="The system was unable to properly analyze this claim due to a processing error.",
                    citations=[],
                    confidence=0.0
                )
            ])
        except Exception as e:
            print(f"Error parsing model response: {str(e)}")
            # Return a fallback response in case of any error
            return FinalResponse(claims=[
                FinalSteps(
                    claim="Error in fact-checking process",
                    verdict="Uncertain",
                    explanation=f"An error occurred while processing: {str(e)}",
                    citations=[],
                    confidence=0.0
                )
            ])
    
    def process_query(self, query: str):
        """
        Process a query synchronously, extract claims and fact-check them
        
        Args:
            query: The user query containing text and possibly URLs
            
        Returns:
            Dict containing the response and citations
        """
        # Process the query text and any embedded URLs
        processed_query, urls = self.content_extractor.extract_links_and_text(query)
        
        if urls:
            extracted_texts = []
            
            for url in urls:
                extracted_content = self.content_extractor.get_link_content(url)
                extracted_texts.append(extracted_content)
            
            # Combine the processed query with extracted content
            processed_query = f"{processed_query}\n" + "\n".join([item.get('text', '') for item in extracted_texts])
        
        # Extract claims from the processed query
        structured_response = AgentFactory.structured_output_agent.run(processed_query)
        
        # Extract the actual claims list from the agent's response
        # Assuming the agent returns an object with a 'claims' attribute which is a List[str]
        # based on the ClaimsToBeVerified schema. Adjust if the actual return structure differs.
        extracted_claims = []
        if hasattr(structured_response.content, 'claims') and isinstance(structured_response.content.claims, list):
             extracted_claims = structured_response.content.claims
        elif isinstance(structured_response.content, list): # Fallback if content itself is the list
             extracted_claims = structured_response.content
        
        if not extracted_claims:
             # Handle case where no claims were extracted - maybe return an error or default response
             # For now, let's pass an informative message to the team
             team_input = "No specific claims were extracted from the input for fact-checking."
        else:
             # Format the claims for the fact_check_team. Joining them might be suitable.
             team_input = "\n".join([f"Claim: {claim}" for claim in extracted_claims])

        # Run the fact-checking team on the extracted claims
        fact_check_team = create_fact_check_team()
        output = fact_check_team.run(team_input, stream=True, stream_intermediate_steps=True)
        
        # Extract the citations from the member responses
        # citations = self._extract_citations(output.member_responses)
        
        # Parse and validate the response
        # parsed_response = self._parse_model_response(output.content)
        return output
        
        # return {
        #     "response": output,
        #     # "citations": citations
        # }
    
    def _save_upload_file(self, upload_file, prefix="file"):
        """
        Save an uploaded file to a temporary directory
        
        Args:
            upload_file: The uploaded file from FastAPI
            prefix: Prefix to add to the filename
            
        Returns:
            Path to the saved temporary file
        """
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(tempfile.gettempdir(), "fact_check_uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate a unique filename
        file_extension = Path(upload_file.filename).suffix
        temp_filename = os.path.join(upload_dir, f"{prefix}_{uuid.uuid4()}{file_extension}")
        
        # Save the file
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        
        return temp_filename
    
    def _process_youtube_link(self, youtube_url):
        """
        Process YouTube link using YouTube agent
        
        Args:
            youtube_url: URL to the YouTube video
            
        Returns:
            String containing the video summary/transcription
        """
        try:
            from services.agents.helper_agent import youtube_agent
            print(f"Using YouTube agent to analyze content from: {youtube_url}")
            response = youtube_agent.run(youtube_url)
            content = response.content if hasattr(response, 'content') else ''
            content_snippet = content[:100] + "..." if len(content) > 100 else content
            print(f"YouTube analysis complete. Content extract: {content_snippet}")
            return f"YouTube Video Content: {content}"
        except Exception as e:
            print(f"Error processing YouTube video: {str(e)}")
            return f"Error processing YouTube video: {str(e)}"
    
    def _process_image_file(self, image_path):
        """
        Process image file using image analysis agent
        
        Args:
            image_path: Path to the image file
            
        Returns:
            String containing the image description
        """
        try:
            from services.agents.helper_agent import image_analysis_agent
            from agno.media import Image
            print(f"Using image analysis agent on file: {Path(image_path).name}")
            response = image_analysis_agent.run(
                "Describe this image in detail and extract any text or information present in it.", 
                images=[Image(filepath=image_path)]
            )
            content = response.content if hasattr(response, 'content') else ''
            content_snippet = content[:100] + "..." if len(content) > 100 else content
            print(f"Image analysis complete. Content extract: {content_snippet}")
            return f"Image Content: {content}"
        except Exception as e:
            print(f"Error processing image: {str(e)}")
            return f"Error processing image: {str(e)}"
    
    def _process_video_file(self, video_path):
        """
        Process video file using video transcription agent
        
        Args:
            video_path: Path to the video file
            
        Returns:
            String containing the video transcription
        """
        try:
            from services.agents.helper_agent import video_transcription_agent
            from agno.media import Video
            
            # Get the file format from the extension
            video_format = Path(video_path).suffix.strip('.')
            print(f"Using video transcription agent on file: {Path(video_path).name} (format: {video_format})")
            
            file_size_mb = os.path.getsize(video_path) / (1024 * 1024)
            print(f"Video file size: {file_size_mb:.2f} MB")
            
            print("Reading video data and sending to transcription agent...")
            with open(video_path, "rb") as video_file:
                video_data = video_file.read()
                print(f"Starting video transcription (this may take some time)...")
                response = video_transcription_agent.run(
                    "Transcribe this video content word by word in English", 
                    videos=[Video(content=video_data, format=video_format)]
                )
            
            content = response.content if hasattr(response, 'content') else ''
            content_snippet = content[:100] + "..." if len(content) > 100 else content
            print(f"Video transcription complete. Content extract: {content_snippet}")
            
            return f"Video Content: {content}"
        except Exception as e:
            print(f"Error processing video: {str(e)}")
            return f"Error processing video: {str(e)}"
    
    def _cleanup_temp_files(self, *file_paths):
        """
        Remove temporary files after processing
        
        Args:
            file_paths: List of file paths to remove
        """
        for file_path in file_paths:
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    print(f"Removed temporary file: {file_path}")
                except Exception as e:
                    print(f"Error removing temporary file {file_path}: {str(e)}")
    
    def process_query(self, query: str, x_link=None, facebook_link=None, instagram_link=None,
                     youtube_link=None, image_file=None, video_file=None,generic_link=None):
        """
        Process a query synchronously with multiple input types, extract claims and fact-check them
        
        Args:
            query: The user query text
            x_link: Optional Twitter/X post link
            facebook_link: Optional Facebook post link
            instagram_link: Optional Instagram post link
            youtube_link: Optional YouTube video link
            image_file: Optional uploaded image file
            video_file: Optional uploaded video file
            
        Returns:
            Dict containing the response and citations
        """
        # Track temporary files for cleanup
        temp_files = []
        start_time = time.time()
        
        # Print start of process with input types
        print("\n" + "="*80)
        print(f"FACT CHECK PROCESS STARTED AT: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)
        
        # Log all input sources
        input_sources = []
        if query.strip(): input_sources.append("Text query")
        if x_link: input_sources.append(f"Twitter/X link: {x_link}")
        if facebook_link: input_sources.append(f"Facebook link: {facebook_link}")
        if instagram_link: input_sources.append(f"Instagram link: {instagram_link}")
        if youtube_link: input_sources.append(f"YouTube link: {youtube_link}")
        if image_file: input_sources.append(f"Image file: {image_file.filename}")
        if video_file: input_sources.append(f"Video file: {video_file.filename}")
        if generic_link: input_sources.append(f"Generic link: {generic_link}")
        
        print(f"Processing {len(input_sources)} input source(s):")
        for src in input_sources:
            print(f"  - {src}")
        
        try:
            # Process image file if provided
            image_path = None
            if image_file:
                print(f"\nProcessing image: {image_file.filename}")
                image_path = self._save_upload_file(image_file, "image")
                print(f"Image saved to temporary location: {image_path}")
                temp_files.append(image_path)
            
            # Process video file if provided
            video_path = None
            if video_file:
                print(f"\nProcessing video: {video_file.filename}")
                video_path = self._save_upload_file(video_file, "video")
                print(f"Video saved to temporary location: {video_path}")
                temp_files.append(video_path)
            
            # Process the query text and any embedded URLs
            print("\nExtracting links from query text...")
            processed_query, urls = self.content_extractor.extract_links_and_text(query)
            if urls:
                print(f"Found {len(urls)} URL(s) in query text:")
                for url in urls:
                    print(f"  - {url}")
                
                # Process existing embedded URLs in the query
                extracted_texts = []
                for url in urls:
                    print(f"\nExtracting content from URL: {url}")
                    extracted_content = self.content_extractor.get_link_content(url)
                    text_snippet = extracted_content.get('text', '')[:100] + "..." if len(extracted_content.get('text', '')) > 100 else extracted_content.get('text', '')
                    print(f"Extracted {len(extracted_content.get('text', ''))} chars of content: {text_snippet}")
                    extracted_texts.append(extracted_content)
                
                processed_query = f"{processed_query}\n" + "\n".join([item.get('text', '') for item in extracted_texts])
            
            # Process social media links
            social_links = []
            if x_link:
                social_links.append(x_link)
            if facebook_link:
                social_links.append(facebook_link)
            if instagram_link:
                social_links.append(instagram_link)
            if generic_link:
                social_links.append(generic_link)
            if youtube_link:
                social_links.append(youtube_link)

            
            if social_links:
                print(f"\nProcessing {len(social_links)} social media link(s):")
                for link in social_links:
                    print(f"  - Extracting content from: {link}")
                    content = self.content_extractor.get_link_content(link)
                    text_snippet = content.get('text', '')[:100] + "..." if len(content.get('text', '')) > 100 else content.get('text', '')
                    print(f"    Extracted {len(content.get('text', ''))} chars of content: {text_snippet}")
                    processed_query += f"\n{content.get('text', '')}"
            
            # Process YouTube link
            if youtube_link:
                print(f"\nProcessing YouTube link: {youtube_link}")
                youtube_content = self._process_youtube_link(youtube_link)
                print(f"YouTube content extracted: {len(youtube_content)} chars")
                processed_query += f"\n{youtube_content}"
            
            # Process image file
            if image_path:
                print(f"\nAnalyzing image with AI: {image_path}")
                image_content = self._process_image_file(image_path)
                print(f"Image description extracted: {len(image_content)} chars")
                processed_query += f"\n{image_content}"
            
            # Process video file
            if video_path:
                print(f"\nTranscribing video: {video_path}")
                video_content = self._process_video_file(video_path)
                print(f"Video content extracted: {len(video_content)} chars")
                processed_query += f"\n{video_content}"
            
            # Extract claims from the processed query
            print("\n" + "="*80)
            print("STRUCTURED AGENT CLAIM EXTRACTION")
            print("="*80)
            
            print(f"Sending {len(processed_query)} chars to structured_output_agent...")
            structured_response = AgentFactory.structured_output_agent.run(processed_query)
            
            # Log the raw response structure
            print("\nStructured Agent Response:")
            print(f"Response type: {type(structured_response)}")
            if hasattr(structured_response, 'content'):
                print(f"Content type: {type(structured_response.content)}")
                
                # Check if it's a Pydantic model with a model_dump method
                if hasattr(structured_response.content, 'model_dump'):
                    try:
                        print(f"Raw content: {json.dumps(structured_response.content.model_dump(), indent=2)}")
                    except Exception as e:
                        print(f"Could not serialize model with model_dump: {e}")
                # If it has a dict method (older Pydantic)
                elif hasattr(structured_response.content, 'dict'):
                    try:
                        print(f"Raw content: {json.dumps(structured_response.content.dict(), indent=2)}")
                    except Exception as e:
                        print(f"Could not serialize model with dict: {e}")
                # For lists or other serializable types
                else:
                    try:
                        print(f"Raw content: {json.dumps(structured_response.content, indent=2)}")
                    except:
                        print(f"Raw content (not JSON serializable): {str(structured_response.content)}")
            
            # Extract and log the claims
            extracted_claims = []
            if hasattr(structured_response.content, 'claims') and isinstance(structured_response.content.claims, list):
                extracted_claims = structured_response.content.claims
            elif isinstance(structured_response.content, list): # Fallback if content itself is the list
                extracted_claims = structured_response.content
            
            print("\n" + "-"*80)
            print(f"EXTRACTED CLAIMS: {len(extracted_claims)}")
            print("-"*80)
            
            if extracted_claims:
                for i, claim in enumerate(extracted_claims, 1):
                    print(f"\nClaim #{i}:")
                    print(f"Text: {claim}")
                    print("-"*40)
            else:
                print("\nNo claims were extracted from the input.")
                
            if not extracted_claims:
                team_input = "No specific claims were extracted from the input for fact-checking."
            else:
                team_input = "\n".join([f"Claim: {claim}" for claim in extracted_claims])
            
            # Run the fact-checking team on the extracted claims
            print("\nStarting fact-checking process with extracted claims...")
            print("-"*80)
            print(f"INPUT TO FACT-CHECK TEAM:")
            print("-"*40)
            print(team_input)
            print("-"*80)
            fact_check_team=create_fact_check_team(additional_context=f"These are the references from the user\n\n {input_sources}")
            print("Social Links",input_sources)
            
            # Updated to handle OpenRouter model (previously AWS Bedrock)
            output = fact_check_team.run(team_input, stream=True, stream_intermediate_steps=True)
            
            elapsed_time = time.time() - start_time
            print("\n" + "="*80)
            print(f"FACT CHECK PROCESS COMPLETED IN {elapsed_time:.2f} SECONDS")
            print("="*80 + "\n")
            
            return output
        finally:
            # Clean up temporary files
            self._cleanup_temp_files(*temp_files)
    
    async def process_query_async(self, query: str, x_link=None, facebook_link=None, instagram_link=None,
                                youtube_link=None, image_file=None, video_file=None,generic_link=None):
        """
        Process a query asynchronously with multiple input types, extract claims and fact-check them
        
        Since AwsBedrock doesn't support async operations, this method uses
        a thread pool executor to run the synchronous method in the background.
        
        Args:
            query: The user query text
            x_link: Optional Twitter/X post link
            facebook_link: Optional Facebook post link
            instagram_link: Optional Instagram post link
            youtube_link: Optional YouTube video link
            image_file: Optional uploaded image file
            video_file: Optional uploaded video file
            
        Returns:
            Dict containing the response and citations
        """
        import asyncio
        import concurrent.futures
        
        # Use a thread pool executor to run the synchronous method
        loop = asyncio.get_running_loop()
        with concurrent.futures.ThreadPoolExecutor() as pool:
            # Run the synchronous method in a thread with all parameters
            result = await loop.run_in_executor(
                pool, 
                lambda: self.process_query(
                    query, x_link, facebook_link, instagram_link,
                    youtube_link, image_file, video_file,generic_link
                )
            )
            
        return result
    
    def _extract_citations(self, member_responses):
        """
        Extract citation URLs from member agent responses
        
        Args:
            member_responses: List of responses from team members
            
        Returns:
            List of unique citation URLs
        """
        links = []
        for response in member_responses:
            if hasattr(response, 'content') and isinstance(response.content, IntermediateResponse) and response.content.evidence:
                for evidence in response.content.evidence:
                    links.append(str(evidence.source_url))
        
        # Return unique links
        return list(set(links))
