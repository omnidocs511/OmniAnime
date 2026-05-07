"""
OmniAnime Backend — FastAPI proxy for AniList GraphQL + Jikan v4 fallback.
Provides caching, rate-limit protection, and unified REST endpoints.
"""

import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import anime, search, stream  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    print("[*] OmniAnime API starting...")
    yield
    print("[*] OmniAnime API shutting down...")


app = FastAPI(
    title="OmniAnime API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Vite dev-server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(anime.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(stream.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "OmniAnime API v1.0"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
