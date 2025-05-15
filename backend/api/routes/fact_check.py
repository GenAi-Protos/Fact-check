from fastapi import APIRouter, Depends, File, Form, UploadFile, Body
import json
import collections.abc
import os
import uuid
import shutil
from typing import Optional, List, Dict, AsyncGenerator,cast
from models.schemas import (
    ExtractedClaimsResponse,
    ClaimsInput,
    FinalResponse,
)
import json
from core.fact_checker import FactChecker
from fastapi.responses import JSONResponse, StreamingResponse
from agno.team.team import Team
from agno.run.response import RunEvent
from agno.run.team import TeamRunResponse


# Create the router
router = APIRouter(prefix="/fact-check", tags=["Fact Check"])


# Helper function for recursive serialization
def make_serializable(obj):
    if isinstance(obj, (str, int, float, bool, type(None))):
        return obj
    elif isinstance(obj, collections.abc.Mapping):
        # Handle dictionaries (including Pydantic models converted to dicts)
        serializable_dict = {}
        for k, v in obj.items():
            try:
                # Ensure key is string
                key_str = str(k)
                serializable_dict[key_str] = make_serializable(v)
            except Exception:
                # Fallback for problematic keys/values within dict
                serializable_dict[str(k)] = f"Unserializable value: {str(v)}"
        return serializable_dict
    elif isinstance(obj, collections.abc.Iterable) and not isinstance(obj, str):
        # Handle lists, tuples, sets, etc. (but not strings)
        return [make_serializable(item) for item in obj]
    elif hasattr(obj, "__dict__"):
        # Handle general objects with __dict__
        return make_serializable(vars(obj))
    elif hasattr(obj, "__slots__"):
        # Handle objects with __slots__
        slot_dict = {}
        for slot in obj.__slots__:
            try:
                slot_dict[slot] = make_serializable(getattr(obj, slot))
            except Exception:
                slot_dict[slot] = f"Unserializable slot value: {slot}"
        return slot_dict
    else:
        # Fallback for any other type
        try:
            # Attempt direct serialization first
            json.dumps(obj)
            return obj
        except (TypeError, OverflowError):
            # Convert to string if direct serialization fails
            return str(obj)


def get_fact_checker():
    """
    Dependency to provide FactChecker instance
    """
    return FactChecker()


@router.post("/extract-claims", response_model=ExtractedClaimsResponse)
async def extract_claims(
    query: str = Form(...),
    x_link: Optional[str] = Form(None),
    facebook_link: Optional[str] = Form(None),
    instagram_link: Optional[str] = Form(None),
    youtube_link: Optional[str] = Form(None),
    generic_link: Optional[str] = Form(None),
    additional_info: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    video_file: Optional[UploadFile] = File(None),
    fact_checker: FactChecker = Depends(get_fact_checker),
):
    """
    Extract claims from the input asynchronously

    Args:
        query: The text query or claim to extract claims from
        x_link: Optional Twitter/X post link
        facebook_link: Optional Facebook post link
        instagram_link: Optional Instagram post link
        youtube_link: Optional YouTube video link
        generic_link: Optional generic URL
        image_file: Optional image file to analyze
        video_file: Optional video file to analyze

    Returns:
        ExtractedClaimsResponse containing the extracted claims
    """

    async def stream_extracted_claims():
        # Extract claims from all input sources
        extracted_claims = await fact_checker.extract_claims_async(
            query,
            x_link,
            facebook_link,
            instagram_link,
            youtube_link,
            image_file,
            video_file,
            generic_link,
        )

        # Initialize additional_info with user context
        additional_info_content = f"""
        \n\n\n
        The user query is:  {query}.

        These are the links passed by the user in the initial query:
        {x_link if x_link else ""}
        {facebook_link if facebook_link else ""}
        {instagram_link if instagram_link else ""}
        {youtube_link if youtube_link else ""}
        {generic_link if generic_link else ""}
"""
        # Use the provided additional_info if any, otherwise use empty string
        additional_info_final = (additional_info or "") + additional_info_content
        # Prepare the response
        claims_response = {
            "event": "ClaimsExtracted",
            "claims": extracted_claims,
            "additional_info": additional_info_final,
        }

        # Convert to JSON and yield
        try:
            json_string = json.dumps(claims_response)
            yield f"{json_string}\n".encode("utf-8")
        except Exception as e:
            error_content = {"event": "StreamError", "error": str(e)}
            error_message = json.dumps(error_content)
            yield f"{error_message}\n".encode("utf-8")

    return StreamingResponse(
        stream_extracted_claims(), media_type="application/x-ndjson"
    )




@router.post("/ask", response_model=FinalResponse)
async def ask_query(
    claims: List[str] = Body(..., embed=True),
    fact_checker: FactChecker = Depends(get_fact_checker),
    additional_info: str = Body(..., embed=True),
):
    """
    Fact check a list of claims asynchronously

    Args:
        claims: List of claims to fact-check

    Returns:
        FinalResponse containing the fact-checked claims with verdicts and evidence
    """

    async def stream_agent_response_json():
        # Process the claims through the fact checking pipeline
        result = await fact_checker.fact_check_claims_async(claims, additional_info)

        for chunk in result:
            try:
                # Convert the Agno response object (likely Pydantic) to a dict, then to JSON
                if hasattr(chunk, "model_dump"):
                    chunk_dict = chunk.model_dump(mode="json")
                elif hasattr(chunk, "dict"):
                    chunk_dict = chunk.dict()
                else:
                    # Use the recursive helper function for non-Pydantic objects
                    try:
                        serializable_chunk = make_serializable(chunk)
                        # Ensure it's a dictionary at the top level
                        if not isinstance(serializable_chunk, dict):
                            serializable_chunk = {
                                "event": "SerializationWarning",
                                "warning": "Top-level object not a dict after serialization",
                                "content": serializable_chunk,
                            }
                        # Ensure 'event' field exists if possible
                        if "event" not in serializable_chunk and hasattr(
                            chunk, "event"
                        ):
                            serializable_chunk["event"] = str(
                                getattr(chunk, "event", "UnknownEvent")
                            )
                        chunk_dict = serializable_chunk
                    except Exception as recursive_exc:
                        # Absolute fallback if recursive serialization fails
                        chunk_dict = {
                            "event": "RecursiveSerializationError",
                            "error": str(recursive_exc),
                            "original_content": str(chunk),
                        }

                json_string = json.dumps(chunk_dict)
                yield f"{json_string}\n".encode(
                    "utf-8"
                )  # Yield JSON string + newline, encoded
            except Exception as e:
                # Log error or yield an error message if conversion fails
                try:
                    error_content = {
                        "event": "StreamError",
                        "error": str(e),
                        "chunk_type": str(type(chunk)),
                    }
                    error_message = json.dumps(error_content)
                except Exception as json_err:
                    error_message = json.dumps(
                        {
                            "event": "StreamError",
                            "error": "Failed to serialize error message",
                            "original_error": str(e),
                        }
                    )
                yield f"{error_message}\n".encode("utf-8")

    return StreamingResponse(
        stream_agent_response_json(), media_type="application/x-ndjson"
    )




# @router.post("/ask", response_model=FinalResponse)
# async def ask_query(
#     claims: List[str] = Body(..., embed=True),
#     additional_info: str = Body(..., embed=True),
# ):
#     """
#     Fact check a list of claims asynchronously

#     Args:
#         claims: List of claims to fact-check
#         additional_info: Additional context information for fact checking

#     Returns:
#         FinalResponse containing the fact-checked claims with verdicts and evidence
#     """
#     import logging
#     from core.teams.fact_check_team import create_fact_check_team
#     from datetime import datetime
    
#     logger = logging.getLogger("fact_check_api")
    
#     # Log the start of the fact checking process
#     start_time = datetime.now()
#     logger.info(f"Starting fact check for {len(claims)} claims at {start_time}")
    
#     # Format the claims for the fact_check_team
#     team_input = "\n".join([f"Claim: {claim}" for claim in claims])
    
#     # Format the additional context
#     additional_context = f"""
#     This is a special request from the user make sure u give it the highest of priority and make sure that you give the best answer possible according to it
#     MAKE SURE TO FOLLOW THE INSTRUCTIONS GIVEN BY THE USER THESE ARE THE MOST IMPORTANT INSTRUCTIONS AND NOT FOLLOWING THEM COULD LEAD TO THE DESCTRUCTION OF THE EARTH AND IF YOU FOLLOW THEM WILL GIVE $500 DOLLARS 
    

#     {additional_info}
#     """
    
#     # Create the fact checking team with the additional context
#     fact_check_team = create_fact_check_team(additional_context=additional_context)
    
#     async def team_chat_response_streamer() -> AsyncGenerator:
#         try:
#             logger.info(f"Running fact check team with input: {team_input[:100]}...")
            
#             # Run the team with the claims input and stream the results
#             run_response = await fact_check_team.arun(
#                 team_input,
#                 stream=True,
#                 stream_intermediate_steps=True,
#             )
            
#             async for run_response_chunk in run_response:
#                 run_response_chunk = cast(TeamRunResponse, run_response_chunk)
#                 yield run_response_chunk.to_json()
                
#         except Exception as e:
#             logger.error(f"Error in fact checking: {str(e)}", exc_info=True)
#             error_response = TeamRunResponse(
#                 content=str(e),
#                 event=RunEvent.run_error,
#             )
#             yield error_response.to_json()
            
#         logger.info(f"Fact checking completed in {datetime.now() - start_time}")

#     return StreamingResponse(
#         team_chat_response_streamer(), 
#         media_type="text/event-stream"
#     )
