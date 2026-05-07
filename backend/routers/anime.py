"""
Anime data endpoints — detail, trending, seasonal, top-airing, popular.
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from anilist import (
    anilist_query,
    QUERY_MEDIA_BY_ID,
    QUERY_TRENDING,
    QUERY_TOP_AIRING,
    QUERY_SEASONAL,
    QUERY_POPULAR,
    QUERY_BY_GENRE,
)
from jikan import jikan_anime_by_id, jikan_top_airing, jikan_seasonal, jikan_anime_episodes

router = APIRouter(tags=["anime"])


def _current_season() -> tuple[str, int]:
    month = datetime.now().month
    year = datetime.now().year
    if month in (1, 2, 3):
        return "WINTER", year
    elif month in (4, 5, 6):
        return "SPRING", year
    elif month in (7, 8, 9):
        return "SUMMER", year
    else:
        return "FALL", year


# ── GET /api/anime/:id ─────────────────────────────────────────────────────

@router.get("/anime/{anime_id}")
async def get_anime(anime_id: int):
    """Full anime details by AniList ID, with Jikan fallback via idMal."""
    try:
        data = await anilist_query(QUERY_MEDIA_BY_ID, {"id": anime_id})
        media = data.get("data", {}).get("Media")
        if media:
            return {"source": "anilist", "data": media}
    except Exception:
        pass

    # Jikan fallback (assumes anime_id == MAL id; works for many cases)
    try:
        jikan_data = await jikan_anime_by_id(anime_id)
        return {"source": "jikan", "data": jikan_data.get("data")}
    except Exception:
        raise HTTPException(status_code=404, detail="Anime not found")


# ── GET /api/episodes/:id ──────────────────────────────────────────────────

@router.get("/episodes/{anime_id}")
async def get_episodes(anime_id: int, page: int = Query(1, ge=1)):
    """Fetch episode list. Uses AniList nextAiringEpisode + Jikan episodes."""
    try:
        # First get the MAL id from AniList
        data = await anilist_query(QUERY_MEDIA_BY_ID, {"id": anime_id})
        media = data.get("data", {}).get("Media", {})
        mal_id = media.get("idMal")
        if mal_id:
            eps = await jikan_anime_episodes(mal_id, page)
            return {
                "source": "jikan",
                "data": eps.get("data", []),
                "pagination": eps.get("pagination", {}),
                "nextAiring": media.get("nextAiringEpisode"),
            }
    except Exception:
        pass

    return {"source": "none", "data": [], "pagination": {}, "nextAiring": None}


# ── GET /api/trending ──────────────────────────────────────────────────────

@router.get("/trending")
async def get_trending(page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=50)):
    try:
        data = await anilist_query(QUERY_TRENDING, {"page": page, "perPage": per_page})
        return {"source": "anilist", **data.get("data", {}).get("Page", {})}
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to fetch trending anime")


# ── GET /api/top-airing ────────────────────────────────────────────────────

@router.get("/top-airing")
async def get_top_airing(page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=50)):
    try:
        data = await anilist_query(QUERY_TOP_AIRING, {"page": page, "perPage": per_page})
        return {"source": "anilist", **data.get("data", {}).get("Page", {})}
    except Exception as e:
        # Jikan fallback
        try:
            jdata = await jikan_top_airing(page, per_page)
            return {"source": "jikan", "media": jdata.get("data", []), "pageInfo": jdata.get("pagination", {})}
        except Exception:
            raise HTTPException(status_code=502, detail="Failed to fetch top airing")


# ── GET /api/season ────────────────────────────────────────────────────────

@router.get("/season")
async def get_seasonal(
    season: str | None = None,
    year: int | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
):
    if not season or not year:
        s, y = _current_season()
        season = season or s
        year = year or y

    try:
        data = await anilist_query(
            QUERY_SEASONAL,
            {"season": season.upper(), "seasonYear": year, "page": page, "perPage": per_page},
        )
        return {"source": "anilist", **data.get("data", {}).get("Page", {})}
    except Exception:
        # Jikan fallback
        try:
            jdata = await jikan_seasonal(year, season.lower(), page, per_page)
            return {"source": "jikan", "media": jdata.get("data", []), "pageInfo": jdata.get("pagination", {})}
        except Exception:
            raise HTTPException(status_code=502, detail="Failed to fetch seasonal anime")


# ── GET /api/popular ───────────────────────────────────────────────────────

@router.get("/popular")
async def get_popular(page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=50)):
    try:
        data = await anilist_query(QUERY_POPULAR, {"page": page, "perPage": per_page})
        return {"source": "anilist", **data.get("data", {}).get("Page", {})}
    except Exception:
        raise HTTPException(status_code=502, detail="Failed to fetch popular anime")


# ── GET /api/genre ─────────────────────────────────────────────────────────

@router.get("/genre")
async def get_by_genre(
    genre: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
):
    """Fetch anime filtered by a specific genre."""
    try:
        data = await anilist_query(
            QUERY_BY_GENRE,
            {"genre": genre, "page": page, "perPage": per_page},
        )
        return {"source": "anilist", **data.get("data", {}).get("Page", {})}
    except Exception:
        raise HTTPException(status_code=502, detail=f"Failed to fetch anime for genre: {genre}")
