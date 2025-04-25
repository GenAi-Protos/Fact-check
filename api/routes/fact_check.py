from fastapi import APIRouter, HTTPException, Depends

from models.schemas import Query, FactCheckResponse
from core.fact_checker import FactChecker

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
    try:
        result = await fact_checker.process_query_async(query.query)
        return result
    except Exception as e:
        # Log the exception
        print(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
