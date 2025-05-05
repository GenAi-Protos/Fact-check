import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EXA_API_KEY = os.getenv("EXA_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
BEARER_TOKEN = os.getenv("BEARER_TOKEN")  # For Twitter API
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# API Settings
API_HOST = os.getenv("API_HOST", "localhost")
API_PORT = int(os.getenv("API_PORT", 8000))
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

# Set up environment variables required by the agents
def setup_env_variables():
    """Set up environment variables to be used by agents"""
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY or ""
    os.environ["EXA_API_KEY"] = EXA_API_KEY or ""
    os.environ["OPENROUTER_API_KEY"] = OPENROUTER_API_KEY or ""
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY or ""
    os.environ["TAVILY_API_KEY"] = TAVILY_API_KEY or ""
    os.environ["AWS_ACCESS_KEY_ID"] = AWS_ACCESS_KEY_ID or ""
    os.environ["AWS_SECRET_ACCESS_KEY"] = AWS_SECRET_ACCESS_KEY or ""
    os.environ["AWS_REGION"] = AWS_REGION or "us-east-1"
