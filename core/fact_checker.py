import json
import re
from utils.extractors import ContentExtractor
from services.agents.agent_factory import AgentFactory
from core.teams.fact_check_team import fact_check_team
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
    
    async def process_query_async(self, query: str):
        """
        Process a query asynchronously, extract claims and fact-check them
        
        Since AwsBedrock doesn't support async operations, this method uses
        a thread pool executor to run the synchronous method in the background.
        
        Args:
            query: The user query containing text and possibly URLs
            
        Returns:
            Dict containing the response and citations
        """
        import asyncio
        import concurrent.futures
        
        # Use a thread pool executor to run the synchronous method
        loop = asyncio.get_running_loop()
        with concurrent.futures.ThreadPoolExecutor() as pool:
            # Run the synchronous method in a thread
            result = await loop.run_in_executor(
                pool, 
                self.process_query,  # Use the synchronous method
                query
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
