from fastapi import APIRouter, Depends
import json
import collections.abc
from models.schemas import Query, FactCheckResponse
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
    elif hasattr(obj, '__dict__'):
        # Handle general objects with __dict__
        return make_serializable(vars(obj))
    elif hasattr(obj, '__slots__'):
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

@router.post("/ask", response_model=FactCheckResponse)
async def ask_query(query: Query, fact_checker: FactChecker = Depends(get_fact_checker)):
    """
    Fact check a query asynchronously
    
    Args:
        query: The query model containing the text to fact-check
        
    Returns:
        FactCheckResponse containing the fact-checked claims and citations
    """
    async def stream_agent_response_json(query: str):
    
        result = await fact_checker.process_query_async(query)
        for chunk in result:
            try:
                # Convert the Agno response object (likely Pydantic) to a dict, then to JSON
                # Use model_dump() for Pydantic v2+ or dict() for older versions if needed
                if hasattr(chunk, 'model_dump'):
                    chunk_dict = chunk.model_dump(mode='json')
                elif hasattr(chunk, 'dict'):
                    chunk_dict = chunk.dict()
                else:
                    # Use the recursive helper function for non-Pydantic objects
                    try:
                        serializable_chunk = make_serializable(chunk)
                        # Ensure it's a dictionary at the top level
                        if not isinstance(serializable_chunk, dict):
                             serializable_chunk = {"event": "SerializationWarning", "warning": "Top-level object not a dict after serialization", "content": serializable_chunk}
                        # Ensure 'event' field exists if possible
                        if 'event' not in serializable_chunk and hasattr(chunk, 'event'):
                             serializable_chunk['event'] = str(getattr(chunk, 'event', 'UnknownEvent'))
                        chunk_dict = serializable_chunk
                    except Exception as recursive_exc:
                         # Absolute fallback if recursive serialization fails
                         chunk_dict = {"event": "RecursiveSerializationError", "error": str(recursive_exc), "original_content": str(chunk)}

                json_string = json.dumps(chunk_dict)
                yield f"{json_string}\n".encode('utf-8') # Yield JSON string + newline, encoded
            except Exception as e:
                # Log error or yield an error message if conversion fails
                # Ensure the error message itself is valid JSON
                try:
                    error_content = {"event": "StreamError", "error": str(e), "chunk_type": str(type(chunk))}
                    error_message = json.dumps(error_content)
                except Exception as json_err:
                    error_message = json.dumps({"event": "StreamError", "error": "Failed to serialize error message", "original_error": str(e)})
                yield f"{error_message}\n".encode('utf-8')
    return StreamingResponse(stream_agent_response_json(query.query), media_type="application/x-ndjson")
