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


class FactChecker:
    """
    Core fact checking service that processes queries and returns fact-checked responses.
    This version separates claim extraction from verification.
    """

    def __init__(self):
        """Initialize the fact checker with required components"""
        self.content_extractor = ContentExtractor()

    async def extract_claims_async(
        self,
        query: str,
        x_link=None,
        facebook_link=None,
        instagram_link=None,
        youtube_link=None,
        image_file=None,
        video_file=None,
        generic_link=None,
    ):
        """
        Process a query asynchronously and extract claims from it.

        Args:
            query: The user query text
            x_link: Optional Twitter/X post link
            facebook_link: Optional Facebook post link
            instagram_link: Optional Instagram post link
            youtube_link: Optional YouTube video link
            image_file: Optional uploaded image file
            video_file: Optional uploaded video file
            generic_link: Optional generic link

        Returns:
            List of extracted claims
        """
        import asyncio
        import concurrent.futures

        # Use a thread pool executor to run the synchronous method
        loop = asyncio.get_running_loop()
        with concurrent.futures.ThreadPoolExecutor() as pool:
            # Run the synchronous method in a thread with all parameters
            result = await loop.run_in_executor(
                pool,
                lambda: self._extract_claims(
                    query,
                    x_link,
                    facebook_link,
                    instagram_link,
                    youtube_link,
                    image_file,
                    video_file,
                    generic_link,
                ),
            )

        return result

    def _extract_claims(
        self,
        query: str,
        x_link=None,
        facebook_link=None,
        instagram_link=None,
        youtube_link=None,
        image_file=None,
        video_file=None,
        generic_link=None,
    ):
        """
        Extract claims from various input sources.

        Args:
            query: The user query text
            x_link: Optional Twitter/X post link
            facebook_link: Optional Facebook post link
            instagram_link: Optional Instagram post link
            youtube_link: Optional YouTube video link
            image_file: Optional uploaded image file
            video_file: Optional uploaded video file
            generic_link: Optional generic link

        Returns:
            List of extracted claims
        """
        # Track temporary files for cleanup
        temp_files = []
        start_time = time.time()

        # Print start of process with input types
        print("\n" + "=" * 80)
        print(
            f"CLAIM EXTRACTION PROCESS STARTED AT: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        print("=" * 80)

        # Log all input sources
        input_sources = []
        if query.strip():
            input_sources.append("Text query")
        if x_link:
            input_sources.append(f"Twitter/X link: {x_link}")
        if facebook_link:
            input_sources.append(f"Facebook link: {facebook_link}")
        if instagram_link:
            input_sources.append(f"Instagram link: {instagram_link}")
        if youtube_link:
            input_sources.append(f"YouTube link: {youtube_link}")
        if image_file:
            input_sources.append(f"Image file: {image_file.filename}")
        if video_file:
            input_sources.append(f"Video file: {video_file.filename}")
        if generic_link:
            input_sources.append(f"Generic link: {generic_link}")

        print(f"Processing {len(input_sources)} input source(s):")
        for src in input_sources:
            print(f"  - {src}")

        try:
            # Process image file if provided
            image_path = None
            if image_file:
                print(f"\nProcessing image: {image_file.filename}")
                image_path = self.content_extractor._save_upload_file(
                    image_file, "image"
                )
                print(f"Image saved to temporary location: {image_path}")
                temp_files.append(image_path)

            # Process video file if provided
            video_path = None
            if video_file:
                print(f"\nProcessing video: {video_file.filename}")
                video_path = self.content_extractor._save_upload_file(
                    video_file, "video"
                )
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
                    text_snippet = (
                        extracted_content.get("text", "")[:100] + "..."
                        if len(extracted_content.get("text", "")) > 100
                        else extracted_content.get("text", "")
                    )
                    print(
                        f"Extracted {len(extracted_content.get('text', ''))} chars of content: {text_snippet}"
                    )
                    extracted_texts.append(extracted_content)

                processed_query = f"{processed_query}\n" + "\n".join(
                    [item.get("text", "") for item in extracted_texts]
                )

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
                    text_snippet = (
                        content.get("text", "")[:100] + "..."
                        if len(content.get("text", "")) > 100
                        else content.get("text", "")
                    )
                    print(
                        f"    Extracted {len(content.get('text', ''))} chars of content: {text_snippet}"
                    )
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
                image_content = f"Image Content: {self.content_extractor._process_image_file(image_path)}"
                print(f"Image description extracted: {len(image_content)} chars")
                processed_query += f"\n{image_content}"

            # Process video file
            if video_path:
                print(f"\nTranscribing video: {video_path}")
                video_content = f"Video Content: {self.content_extractor._process_video_file(video_path)}"
                print(f"Video content extracted: {len(video_content)} chars")
                processed_query += f"\n{video_content}"

            # Extract claims from the processed query
            print("\n" + "=" * 80)
            print("STRUCTURED AGENT CLAIM EXTRACTION")
            print("=" * 80)

            print(f"Sending {len(processed_query)} chars to structured_output_agent...")
            structured_response = AgentFactory.structured_output_agent.run(
                processed_query
            )

            # Log the raw response structure
            print("\nStructured Agent Response:")
            print(f"Response type: {type(structured_response)}")
            if hasattr(structured_response, "content"):
                print(f"Content type: {type(structured_response.content)}")

                # Check if it's a Pydantic model with a model_dump method
                if hasattr(structured_response.content, "model_dump"):
                    try:
                        print(
                            f"Raw content: {json.dumps(structured_response.content.model_dump(), indent=2)}"
                        )
                    except Exception as e:
                        print(f"Could not serialize model with model_dump: {e}")
                # If it has a dict method (older Pydantic)
                elif hasattr(structured_response.content, "dict"):
                    try:
                        print(
                            f"Raw content: {json.dumps(structured_response.content.dict(), indent=2)}"
                        )
                    except Exception as e:
                        print(f"Could not serialize model with dict: {e}")
                # For lists or other serializable types
                else:
                    try:
                        print(
                            f"Raw content: {json.dumps(structured_response.content, indent=2)}"
                        )
                    except:
                        print(
                            f"Raw content (not JSON serializable): {str(structured_response.content)}"
                        )

            # Extract and log the claims
            extracted_claims = []
            if hasattr(structured_response.content, "claims") and isinstance(
                structured_response.content.claims, list
            ):
                extracted_claims = structured_response.content.claims
            elif isinstance(
                structured_response.content, list
            ):  # Fallback if content itself is the list
                extracted_claims = structured_response.content

            print("\n" + "-" * 80)
            print(f"EXTRACTED CLAIMS: {len(extracted_claims)}")
            print("-" * 80)

            if extracted_claims:
                for i, claim in enumerate(extracted_claims, 1):
                    print(f"\nClaim #{i}:")
                    print(f"Text: {claim}")
                    print("-" * 40)
            else:
                print("\nNo claims were extracted from the input.")

            elapsed_time = time.time() - start_time
            print("\n" + "=" * 80)
            print(f"CLAIM EXTRACTION PROCESS COMPLETED IN {elapsed_time:.2f} SECONDS")
            print("=" * 80 + "\n")

            return extracted_claims

        finally:
            # Clean up temporary files
            self.content_extractor._cleanup_temp_files(*temp_files)

    async def fact_check_claims_async(self, claims: List[str],additional_info):
        """
        Process claims asynchronously and perform fact-checking on them

        Args:
            claims: List of claims to be fact-checked

        Returns:
            Fact-checking results
        """
        import asyncio
        import concurrent.futures

        # Use a thread pool executor to run the synchronous method
        loop = asyncio.get_running_loop()
        with concurrent.futures.ThreadPoolExecutor() as pool:
            # Run the synchronous method in a thread with all parameters
            result = await loop.run_in_executor(
                pool, lambda: self._fact_check_claims(claims, additional_info)
            )

        return result

    def _fact_check_claims(self, claims: List[str],additional_info):
        """
        Process claims synchronously and perform fact-checking on them

        Args:
            claims: List of claims to be fact-checked

        Returns:
            Fact-checking results
        """
        start_time = time.time()

        print("\n" + "=" * 80)
        print(
            f"FACT CHECK PROCESS STARTED AT: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        print("=" * 80)

        if not claims:
            print("\nNo claims provided for fact-checking.")
            return None

        print(f"Processing {len(claims)} claim(s) for fact-checking:")
        for i, claim in enumerate(claims, 1):
            print(f"  {i}. {claim}")

        # Format the claims for the fact_check_team
        team_input = "\n".join([f"Claim: {claim}" for claim in claims])

        # Run the fact-checking team on the claims
        print("\nStarting fact-checking process with claims...")
        print("-" * 80)
        print(f"INPUT TO FACT-CHECK TEAM:")
        print("-" * 40)
        print(team_input)
        print("-" * 80)
        # Format the additional context properly
        additional_context = f"""
        This is a special request from the user make sure u give it the highest of priority and make sure that you give the best answer possible according to it
        MAKE SURE TO FOLLOW THE INSTRUCTIONS GIVEN BY THE USER THESE ARE THE MOST IMPORTANT INSTRUCTIONS AND NOT FOLLOWING THEM COULD LEAD TO THE DESCTRUCTION OF THE EARTH AND IF YOU FOLLOW THEM WILL GIVE $500 DOLLARS 
        

        {additional_info}
        """

        fact_check_team = create_fact_check_team(additional_context=additional_context)
        output = fact_check_team.run(
            team_input, stream=True, stream_intermediate_steps=True
        )

        elapsed_time = time.time() - start_time
        print("\n" + "=" * 80)
        print(f"FACT CHECK PROCESS COMPLETED IN {elapsed_time:.2f} SECONDS")
        print("=" * 80 + "\n")

        return output

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
            content = response.content if hasattr(response, "content") else ""
            content_snippet = content[:100] + "..." if len(content) > 100 else content
            print(f"YouTube analysis complete. Content extract: {content_snippet}")
            return f"YouTube Video Content: {content}"
        except Exception as e:
            print(f"Error processing YouTube video: {str(e)}")
            return f"Error processing YouTube video: {str(e)}"

    # Maintain compatibility with old code that expects process_query_async
    async def process_query_async(
        self,
        query: str,
        x_link=None,
        facebook_link=None,
        instagram_link=None,
        youtube_link=None,
        image_file=None,
        video_file=None,
        generic_link=None,
    ):
        """
        Backward compatibility method that extracts claims and then checks them
        """
        # First extract claims
        extracted_claims = await self.extract_claims_async(
            query,
            x_link,
            facebook_link,
            instagram_link,
            youtube_link,
            image_file,
            video_file,
            generic_link,
        )

        # Then fact check them
        return await self.fact_check_claims_async(extracted_claims)
