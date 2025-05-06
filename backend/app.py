import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging
from api.routes import fact_check
from config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("fact_check_api")

# Initialize the FastAPI app
app = FastAPI(
    title="Fact Check API",
    description="API for fact-checking claims using AI agents",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Add request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """
    Middleware to measure and log request processing time
    """
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"Request processed in {process_time:.2f} seconds: {request.url.path}")
    return response

# Add global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to catch and format all unhandled exceptions
    """
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "detail": str(exc)}
    )

# Include API routers
app.include_router(fact_check.router)

# Add health check route
@app.get("/health", tags=["Health"])
def health_check():
    """
    Simple health check endpoint
    """
    return {"status": "ok", "message": "Service is running"}

# Add root route
@app.get("/", tags=["Root"])
def read_root():
    """
    Root endpoint that redirects to the documentation
    """
    return {
        "message": "Welcome to Fact Check API", 
        "docs": "/docs",
        "endpoints": {
            "extract-claims": "/fact-check/extract-claims - Extracts claims from various inputs",
            "ask": "/fact-check/ask - Performs fact-checking on provided claims"
        }
    }

# Run the API if executed as a script
if __name__ == "__main__":
    # Set up environment variables
    settings.setup_env_variables()
    
    # Run the API
    uvicorn.run(
        "app:app", 
        host=settings.API_HOST, 
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
