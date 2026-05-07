"""
Jikan v4 (MyAnimeList) fallback client.
Used when AniList is down or missing data.
"""

import os
import httpx
from cachetools import TTLCache

JIKAN_URL = os.getenv("JIKAN_API_URL", "https://api.jikan.moe/v4")
CACHE_TTL = int(os.getenv("CACHE_TTL", 300))

_cache: TTLCache = TTLCache(maxsize=200, ttl=CACHE_TTL)


async def jikan_get(path: str, params: dict | None = None) -> dict:
    """GET request to Jikan v4 with caching."""
    import hashlib, json
    raw = path + json.dumps(params or {}, sort_keys=True)
    key = hashlib.md5(raw.encode()).hexdigest()

    if key in _cache:
        return _cache[key]

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"{JIKAN_URL}{path}", params=params)
        resp.raise_for_status()
        data = resp.json()

    _cache[key] = data
    return data


async def jikan_search(query: str, page: int = 1, limit: int = 20):
    return await jikan_get("/anime", {"q": query, "page": page, "limit": limit, "sfw": True})


async def jikan_anime_by_id(mal_id: int):
    return await jikan_get(f"/anime/{mal_id}/full")


async def jikan_top_airing(page: int = 1, limit: int = 20):
    return await jikan_get("/top/anime", {"filter": "airing", "page": page, "limit": limit, "sfw": True})


async def jikan_seasonal(year: int, season: str, page: int = 1, limit: int = 20):
    return await jikan_get(f"/seasons/{year}/{season}", {"page": page, "limit": limit, "sfw": True})


async def jikan_anime_episodes(mal_id: int, page: int = 1):
    return await jikan_get(f"/anime/{mal_id}/episodes", {"page": page})
