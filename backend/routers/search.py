"""
Search endpoint with autocomplete support.
Supports optional genre filtering to work in sync with the genre dropdown.
"""

from fastapi import APIRouter, Query, HTTPException
from anilist import anilist_query, QUERY_SEARCH, QUERY_SEARCH_WITH_GENRE
from jikan import jikan_search

router = APIRouter(tags=["search"])


@router.get("/search")
async def search_anime(
    q: str = Query(..., min_length=1),
    genre: str = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
):
    """Search anime by title, optionally filtered by genre. AniList primary, Jikan fallback."""
    try:
        if genre:
            # Combined search + genre
            data = await anilist_query(
                QUERY_SEARCH_WITH_GENRE,
                {"search": q, "genre": genre, "page": page, "perPage": per_page},
            )
        else:
            data = await anilist_query(
                QUERY_SEARCH,
                {"search": q, "page": page, "perPage": per_page},
            )
        page_data = data.get("data", {}).get("Page", {})
        return {"source": "anilist", **page_data}
    except Exception:
        pass

    try:
        jdata = await jikan_search(q, page, per_page)
        return {"source": "jikan", "media": jdata.get("data", []), "pageInfo": jdata.get("pagination", {})}
    except Exception:
        raise HTTPException(status_code=502, detail="Search failed")
