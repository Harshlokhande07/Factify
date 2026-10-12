# Factify Search Backend

FastAPI search service for Factify.

Given a claim, it builds multiple search queries, queries a search provider (mock, Brave, or Serper), merges and de-duplicates the results, classifies them with domain heuristics into news, social, or official sources, and returns machine-suggested source records.

## Quickstart (Offline / Mock Mode)

No API key needed for mock mode:

```bash
pip install -r requirements.txt
uvicorn factify_search:app --reload --port 8000
```

Test endpoint:
```bash
curl -X POST http://localhost:8000/search -H 'Content-Type: application/json' -d '{"claim":"Councillor Mara Quillon was arrested in Port Halvren"}'
```

## Running Tests

```bash
python -m pytest -q
```

## Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Environment variables:
- `SEARCH_PROVIDER`: `mock` (default), `brave`, or `serper`
- `BRAVE_API_KEY`: API key for Brave Search API
- `SERPER_API_KEY`: API key for Serper (Google search results)
- `ALLOWED_ORIGINS`: Comma-separated CORS allowed origins (default `http://localhost:3000`)
