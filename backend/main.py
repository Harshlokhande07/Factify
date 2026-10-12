"""
Vercel entrypoint for the Factify FastAPI backend service.
Re-exports FastAPI app from factify_search.
"""
from factify_search import app

__all__ = ["app"]
