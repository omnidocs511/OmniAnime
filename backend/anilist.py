"""
AniList GraphQL client with in-memory TTL cache.
"""

import os, time, hashlib, json
from typing import Any
import httpx
from cachetools import TTLCache

ANILIST_URL = os.getenv("ANILIST_API_URL", "https://graphql.anilist.co")
CACHE_TTL = int(os.getenv("CACHE_TTL", 300))

# In-memory cache (max 500 entries, 5 min TTL by default)
_cache: TTLCache = TTLCache(maxsize=500, ttl=CACHE_TTL)


def _cache_key(query: str, variables: dict) -> str:
    raw = query + json.dumps(variables, sort_keys=True)
    return hashlib.md5(raw.encode()).hexdigest()


async def anilist_query(query: str, variables: dict | None = None) -> dict[str, Any]:
    """Execute a GraphQL query against AniList with caching."""
    variables = variables or {}
    key = _cache_key(query, variables)

    if key in _cache:
        return _cache[key]

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            ANILIST_URL,
            json={"query": query, "variables": variables},
            headers={"Content-Type": "application/json", "Accept": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()

    _cache[key] = data
    return data


# ── Reusable GraphQL fragments ──────────────────────────────────────────────

MEDIA_FIELDS = """
    id
    idMal
    title { romaji english native userPreferred }
    description(asHtml: false)
    coverImage { extraLarge large medium color }
    bannerImage
    format
    status
    episodes
    duration
    season
    seasonYear
    startDate { year month day }
    endDate { year month day }
    averageScore
    meanScore
    popularity
    favourites
    genres
    tags { id name rank isMediaSpoiler }
    studios(isMain: true) { nodes { id name } }
    nextAiringEpisode { airingAt timeUntilAiring episode }
    trailer { id site thumbnail }
    relations { edges { relationType(version: 2) node { id title { userPreferred } coverImage { large } format type } } }
    recommendations(perPage: 6, sort: RATING_DESC) { nodes { mediaRecommendation { id title { english romaji userPreferred } coverImage { large } format averageScore } } }
"""


# ── Pre-built queries ───────────────────────────────────────────────────────

QUERY_MEDIA_BY_ID = f"""
query ($id: Int) {{
  Media(id: $id, type: ANIME) {{
    {MEDIA_FIELDS}
  }}
}}
"""

QUERY_TRENDING = f"""
query ($page: Int, $perPage: Int) {{
  Page(page: $page, perPage: $perPage) {{
    pageInfo {{ total currentPage lastPage hasNextPage }}
    media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {{
      {MEDIA_FIELDS}
    }}
  }}
}}
"""

QUERY_TOP_AIRING = f"""
query ($page: Int, $perPage: Int) {{
  Page(page: $page, perPage: $perPage) {{
    pageInfo {{ total currentPage lastPage hasNextPage }}
    media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {{
      {MEDIA_FIELDS}
    }}
  }}
}}
"""

QUERY_SEASONAL = f"""
query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {{
  Page(page: $page, perPage: $perPage) {{
    pageInfo {{ total currentPage lastPage hasNextPage }}
    media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, isAdult: false) {{
      {MEDIA_FIELDS}
    }}
  }}
}}
"""

QUERY_SEARCH = f"""
query ($search: String, $page: Int, $perPage: Int) {{
  Page(page: $page, perPage: $perPage) {{
    pageInfo {{ total currentPage lastPage hasNextPage }}
    media(type: ANIME, search: $search, isAdult: false) {{
      {MEDIA_FIELDS}
    }}
  }}
}}
"""

QUERY_POPULAR = f"""
query ($page: Int, $perPage: Int) {{
  Page(page: $page, perPage: $perPage) {{
    pageInfo {{ total currentPage lastPage hasNextPage }}
    media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {{
      {MEDIA_FIELDS}
    }}
  }}
}}
"""

QUERY_BY_GENRE = f"""
query ($genre: String, $page: Int, $perPage: Int) {{
  Page(page: $page, perPage: $perPage) {{
    pageInfo {{ total currentPage lastPage hasNextPage }}
    media(type: ANIME, genre: $genre, sort: POPULARITY_DESC, isAdult: false) {{
      {MEDIA_FIELDS}
    }}
  }}
}}
"""

QUERY_SEARCH_WITH_GENRE = f"""
query ($search: String, $genre: String, $page: Int, $perPage: Int) {{
  Page(page: $page, perPage: $perPage) {{
    pageInfo {{ total currentPage lastPage hasNextPage }}
    media(type: ANIME, search: $search, genre: $genre, isAdult: false) {{
      {MEDIA_FIELDS}
    }}
  }}
}}
"""
