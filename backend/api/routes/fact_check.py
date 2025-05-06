from fastapi import APIRouter, Depends, File, Form, UploadFile, Body
import json
import collections.abc
import os
import uuid
import shutil
from typing import Optional, List
from models.schemas import ExtractedClaimsResponse, ClaimsInput, FinalResponse
from core.fact_checker import FactChecker
from fastapi.responses import StreamingResponse

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

        # Prepare the response
        claims_response = {"event": "ClaimsExtracted", "claims": extracted_claims}

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
        result = await fact_checker.fact_check_claims_async(claims)

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
