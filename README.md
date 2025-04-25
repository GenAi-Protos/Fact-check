# Fact Check API

A modular FastAPI backend for fact-checking claims using AI agents.

## Project Structure

```
fact_check_api/
├── api/                  # API endpoints
│   └── routes/
│       └── fact_check.py # Fact checking endpoints
├── config/               # Configuration
│   └── settings.py       # Environment and app settings
├── core/                 # Business logic
│   ├── fact_checker.py   # Main fact checking service
│   └── teams/            # Team coordination
│       └── fact_check_team.py
├── models/               # Data models
│   └── schemas.py        # Pydantic models
├── services/             # Services and integrations
│   └── agents/           # AI agent definitions
│       └── agent_factory.py
└── utils/                # Utility functions
    ├── extractors.py     # Content extraction utilities
    └── proxies.py        # User agent strings
```

## Features

- Asynchronous fact-checking API
- Modular design with clear separation of concerns
- Support for processing URLs and extracting content
- Multiple AI agents specialized for different research tasks
- Team-based approach to fact verification
- Comprehensive error handling and request logging

## API Endpoints

- `POST /fact-check/ask`: Asynchronously fact-check a claim or query
- `POST /fact-check/ask-sync`: Synchronously fact-check a claim or query
- `GET /health`: Health check endpoint
- `GET /`: Welcome page with link to documentation

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file with required API keys:
   ```
   OPENAI_API_KEY=your_openai_key
   EXA_API_KEY=your_exa_key
   OPENROUTER_API_KEY=your_openrouter_key
   GOOGLE_API_KEY=your_google_key
   TAVILY_API_KEY=your_tavily_key
   BEARER_TOKEN=your_twitter_bearer_token
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   ```
4. Run the API:
   ```bash
   python -m fact_check_api.main
   ```
   
## Environment Variables

- `API_HOST`: Host to run the API on (default: "localhost")
- `API_PORT`: Port to run the API on (default: 8000)
- `DEBUG`: Enable debug mode with auto-reload (default: False)

Plus all API keys mentioned in the setup section.

## Usage Example

```python
import requests
import json

url = "http://localhost:8000/fact-check/ask"
payload = {
    "query": "Did NASA find evidence of life on Mars?"
}
headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, headers=headers, data=json.dumps(payload))
result = response.json()
print(json.dumps(result, indent=2))
```

## Development

To run the API in development mode with auto-reload:

```bash
export DEBUG=True
python -m fact_check_api.main
```

## Documentation

When the API is running, you can access the interactive documentation:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
