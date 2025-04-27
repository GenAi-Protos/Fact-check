#!/usr/bin/env python3
"""
Main entry point for the Fact Check API
"""

import uvicorn
from config import settings

def main():
    """
    Main function that starts the FastAPI application
    """
    # Set up environment variables
    settings.setup_env_variables()
    
    # Run the API
    uvicorn.run(
        "app:app", 
        host=settings.API_HOST, 
        port=settings.API_PORT,
        reload=settings.DEBUG
    )

if __name__ == "__main__":
    main()
