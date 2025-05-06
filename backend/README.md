# Fact Check API

API for fact-checking claims using AI agents.

## Architecture

The fact-checking process is separated into two distinct steps:

1. **Claim Extraction**: Extract factual claims from various inputs (text, links, images, videos)
2. **Fact Checking**: Verify the extracted claims

This separation allows for:
- Getting immediate feedback on what claims were extracted
- Manually reviewing and editing claims before fact-checking
- Potentially better performance and clearer responsibility separation

## Endpoints

### 1. Extract Claims

```
POST /fact-check/extract-claims
```

This endpoint extracts claims from various inputs:
- Text query
- Social media links (Twitter/X, Facebook, Instagram)
- YouTube videos
- Generic URLs
- Images
- Videos

**Request Format**: Multipart form data with the following fields:
- `query`: (required) Text query
- `x_link`: (optional) Twitter/X link
- `facebook_link`: (optional) Facebook link
- `instagram_link`: (optional) Instagram link
- `youtube_link`: (optional) YouTube link
- `generic_link`: (optional) Generic URL
- `image_file`: (optional) Image file upload
- `video_file`: (optional) Video file upload

**Response Format**: JSON with the extracted claims:
```json
{
  "event": "ClaimsExtracted",
  "claims": [
    "Claim 1 text",
    "Claim 2 text",
    "..."
  ]
}
```

### 2. Fact Check Claims

```
POST /fact-check/ask
```

This endpoint fact-checks a list of claims.

**Request Format**: JSON with the list of claims:
```json
{
  "claims": [
    "Claim 1 text",
    "Claim 2 text",
    "..."
  ]
}
```

**Response Format**: Streaming NDJSON with chunks of the fact-checking process.

## Running the API

To run the API:

```bash
cd backend
python main.py
```

## Testing

### Extract Claims Example

```bash
curl -X 'POST' \
  'http://localhost:8000/fact-check/extract-claims' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'query=The earth is flat and vaccines cause autism.'
```

### Fact Check Claims Example

```bash
curl -X 'POST' \
  'http://localhost:8000/fact-check/ask' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "claims": [
    "The earth is flat",
    "Vaccines cause autism"
  ]
}'
```

## API Documentation

The API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
