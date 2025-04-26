from fastapi import APIRouter, HTTPException, Depends
import json
from models.schemas import Query, FactCheckResponse
from core.fact_checker import FactChecker
from fastapi.responses import StreamingResponse
# Create the router
router = APIRouter(prefix="/fact-check", tags=["Fact Check"])

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
                     # Fallback or handle non-Pydantic objects if necessary
                     chunk_dict = {"event": "UnknownChunk", "content": str(chunk)}

                json_string = json.dumps(chunk_dict)
                yield f"{json_string}\n".encode('utf-8') # Yield JSON string + newline, encoded
            except Exception as e:
                # Log error or yield an error message if conversion fails
                error_message = json.dumps({"error": f"Failed to serialize chunk: {e}", "chunk_type": str(type(chunk))})
                yield f"{error_message}\n".encode('utf-8')
    return StreamingResponse(stream_agent_response_json(query.query), media_type="application/x-ndjson")
