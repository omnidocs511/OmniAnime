"""
Streaming source provider using anipy-api.

Uses anipy-api (a Python library that scrapes anime providers like
AllAnime, GoGoAnime, AnimeKai) to get real streaming URLs directly.
No external API service needed — everything runs locally.

Configure via .env:
  STREAM_PROVIDERS — Comma-separated provider names (default: allanime,gogoanime,animekai)
"""

import os
import hashlib
import json
import logging
from typing import Any
from concurrent.futures import ThreadPoolExecutor

from cache_manager import cache_manager

logger = logging.getLogger(__name__)

# ── Provider setup ──────────────────────────────────────────────────────────

PROVIDER_NAMES = os.getenv("STREAM_PROVIDERS", "allanime,gogoanime,animekai").split(",")

_provider = None
_search_cache: dict = {}  # identifier → search result (persists for session)

# Thread pool for running sync anipy-api calls from async context
_executor = ThreadPoolExecutor(max_workers=3)


def _ckey(*args: Any) -> str:
    raw = json.dumps(args, sort_keys=True, default=str)
    return hashlib.md5(raw.encode()).hexdigest()


def _get_provider():
    """Lazily initialise the first working provider."""
    global _provider
    if _provider is not None:
        return _provider

    from anipy_api.provider import get_provider

    for name in PROVIDER_NAMES:
        name = name.strip()
        try:
            _provider = get_provider(name)
            logger.info("Stream provider initialised: %s", name)
            return _provider
        except Exception as e:
            logger.warning("Provider '%s' failed to init: %s", name, e)
            continue

    logger.error("No streaming providers available!")
    return None


def _lang_enum(lang: str):
    """Convert 'sub'/'dub' string to anipy LanguageTypeEnum."""
    from anipy_api.provider import LanguageTypeEnum
    return LanguageTypeEnum.DUB if lang.lower() == "dub" else LanguageTypeEnum.SUB


def _anime_from_cache(identifier: str, name: str):
    """Create an Anime object, reusing search cache when possible."""
    from anipy_api.anime import Anime
    from anipy_api.provider import LanguageTypeEnum

    prov = _get_provider()
    if not prov:
        return None

    if identifier in _search_cache:
        return Anime.from_search_result(prov, _search_cache[identifier])

    return Anime(prov, name, identifier, {LanguageTypeEnum.SUB, LanguageTypeEnum.DUB})


def _extract_stream(stream) -> dict | None:
    """Extract a stream dict from an anipy-api stream object."""
    if not stream:
        logger.debug("_extract_stream: stream object is None/falsy")
        return None

    url = getattr(stream, "url", None)
    if not url:
        logger.debug("_extract_stream: stream.url is None/empty: %s", stream)
        return None

    if isinstance(url, list):
        url = url[0] if url else None
    if not url:
        return None

    url = str(url)

    # Build headers — include referrer if present (anipy-api stores it separately)
    headers = dict(getattr(stream, "headers", {}) or {})
    referrer = getattr(stream, "referrer", None) or getattr(stream, "referer", None)
    if referrer:
        headers["Referer"] = str(referrer)

    logger.info("Extracted stream: quality=%s, m3u8=%s, url=%s...",
                getattr(stream, "resolution", "?"), "m3u8" in url.lower(), url[:80])

    return {
        "url": url,
        "quality": str(getattr(stream, "resolution", "default")),
        "isM3U8": "m3u8" in url.lower(),
        "headers": headers,
    }

async def _best_match(results: list[dict], query: str, target_episodes: int | None = None, sub_or_dub: str = "sub") -> dict:
    """Pick the search result whose name best matches the query title, or use episode count as tie-breaker."""
    if not results:
        return results[0]  # shouldn't happen, caller checks

    try:
        from rapidfuzz import fuzz
        query_lower = query.lower()
        
        # DMCA Evaded Names Aliases mapping (AllAnime specifics)
        aliases_map = {
            "one piece": ["1p"],
            "bleach": ["burichi -"],
            "naruto shippuden": ["nato: shippuuden"],
        }
        
        valid_names = [query_lower]
        for k, v in aliases_map.items():
            if k in query_lower:
                valid_names.extend(v)

        def get_score(r_name):
            r_name_lower = r_name.lower()
            return max(fuzz.ratio(vn, r_name_lower) for vn in valid_names)

        scored = [(r, get_score(r["name"])) for r in results]
        scored.sort(key=lambda x: x[1], reverse=True)
        
        if target_episodes and target_episodes > 0:
            top_results = [x[0] for x in scored[:5]]
            import asyncio
            loop = asyncio.get_event_loop()
            
            async def get_count(r):
                key = _ckey("episodes", r["identifier"], sub_or_dub)
                eps = await cache_manager.get(key)
                if eps is not None:
                    return r, len(eps)
                eps = await loop.run_in_executor(
                    _executor, _sync_get_episodes, r["identifier"], r["name"], sub_or_dub
                )
                if eps:
                    await cache_manager.set(key, eps)
                return r, len(eps) if eps else 0

            counts = await asyncio.gather(*(get_count(r) for r in top_results))
            
            best_r = top_results[0]
            best_diff = 99999
            for r, count in counts:
                if count == 0:
                    continue
                diff = abs(count - target_episodes)
                if diff == 0:
                    logger.info("Matched %s by exact episode count %d", r['name'], count)
                    return r
                if diff < best_diff:
                    best_diff = diff
                    best_r = r
            
            logger.info("No exact episode match found. Picked closest: %s (diff %d)", best_r['name'], best_diff)
            return best_r

        best = scored[0]
        logger.info("Best match for '%s': '%s' (score: %d)", query, best[0]["name"], best[1])
        return best[0]
    except Exception as e:
        logger.warning("Error in _best_match: %s", e)
        return results[0]


# ── Sync operations (run in thread pool) ────────────────────────────────────

def _sync_search(title: str) -> list[dict]:
    """Search for anime on the provider (sync)."""
    prov = _get_provider()
    if not prov:
        return []

    try:
        results = list(prov.get_search(title))
        out = []
        for r in results[:100]:
            _search_cache[r.identifier] = r
            langs = [l.value for l in r.languages] if hasattr(r, "languages") else ["sub"]
            out.append({
                "name": r.name,
                "identifier": r.identifier,
                "languages": langs,
            })
        return out
    except Exception as e:
        logger.warning("Stream search failed for '%s': %s", title, e)
        return []


def _sync_get_episodes(identifier: str, name: str, lang: str) -> list[str]:
    """Get episode list from provider (sync)."""
    anime = _anime_from_cache(identifier, name)
    if not anime:
        return []

    try:
        eps = anime.get_episodes(lang=_lang_enum(lang))
        eps_str = [str(e) for e in eps]
        valid_eps = []
        for e in eps_str:
            try:
                val = float(e)
                if val.is_integer() and val > 0:
                    valid_eps.append(e)
            except ValueError:
                pass
        return valid_eps
    except Exception as e:
        logger.warning("Failed to get episodes for '%s': %s", name, e)
        return []


def _sync_get_stream(identifier: str, name: str, episode, lang: str) -> dict | None:
    """
    Get stream URL with robust fallback strategies (sync).
    Mirrors the Demo's get_stream_robust logic.
    """
    anime = _anime_from_cache(identifier, name)
    if not anime:
        return None

    l_type = _lang_enum(lang)
    logger.info("Getting stream: id=%s, name=%s, ep=%s, lang=%s", identifier, name, episode, lang)

    # Strategy 1: Try multiple quality levels
    for quality in ("best", 1080, 720, "worst"):
        try:
            stream = anime.get_video(episode=episode, lang=l_type, preferred_quality=quality)
            result = _extract_stream(stream)
            if result:
                logger.info("Strategy 1 success with quality=%s", quality)
                return result
        except Exception as e:
            logger.debug("Strategy 1 failed (quality=%s): %s", quality, e)
            continue

    # Strategy 2: Direct provider access
    try:
        prov = _get_provider()
        if prov:
            streams = list(prov.get_video(identifier, episode, l_type))
            if streams:
                return _extract_stream(streams[0])
    except Exception:
        pass

    return None


# ── Async public API (called from FastAPI routes) ───────────────────────────

import asyncio


async def search_anime(title: str) -> list[dict]:
    """Search for anime by title."""
    key = _ckey("search", title)
    cached = await cache_manager.get(key)
    if cached:
        return cached

    loop = asyncio.get_event_loop()
    results = await loop.run_in_executor(_executor, _sync_search, title)
    if results:
        await cache_manager.set(key, results)
    return results


async def get_stream_episodes(anime_title: str, sub_or_dub: str = "sub", target_episodes: int | None = None) -> dict:
    """
    Search for anime by title, return provider info + episode list.
    """
    results = await search_anime(anime_title)
    if not results:
        return {"providerId": None, "totalEpisodes": 0, "episodes": []}

    # Pick the best match using fuzzy title matching and episode count
    match = await _best_match(results, anime_title, target_episodes, sub_or_dub)

    # Get episodes
    key = _ckey("episodes", match["identifier"], sub_or_dub)
    eps = await cache_manager.get(key)
    if eps is None:
        loop = asyncio.get_event_loop()
        eps = await loop.run_in_executor(
            _executor, _sync_get_episodes, match["identifier"], match["name"], sub_or_dub
        )
        if eps:
            await cache_manager.set(key, eps)
    
    if eps is None:
        eps = []

    return {
        "providerId": match["identifier"],
        "providerName": match["name"],
        "providerTitle": match["name"],
        "subOrDub": sub_or_dub,
        "totalEpisodes": len(eps),
        "episodes": [
            {"id": f"{match['identifier']}-ep-{ep}", "number": i + 1, "title": None}
            for i, ep in enumerate(eps)
        ],
        "_raw_episodes": eps,  # Keep raw ep values for stream lookup
    }


async def get_stream_sources(
    anime_title: str,
    episode_number: int,
    sub_or_dub: str = "sub",
    server: str | None = None,
    target_episodes: int | None = None,
) -> dict:
    """
    Full pipeline: search → episodes → get stream URL.
    Returns normalised source data.
    """
    ep_data = await get_stream_episodes(anime_title, sub_or_dub, target_episodes)

    if not ep_data["episodes"]:
        return {
            "error": "No streaming sources found for this anime.",
            "sources": [],
            "subtitles": [],
            "episodes": [],
        }

    raw_eps = ep_data.get("_raw_episodes", [])
    episodes_out = ep_data["episodes"]

    # Find the target raw episode value
    if 0 < episode_number <= len(raw_eps):
        raw_ep_str = raw_eps[episode_number - 1]
        # Preserve int type — anipy-api requires it
        raw_ep = int(raw_ep_str) if raw_ep_str.replace('.', '', 1).isdigit() and '.' not in raw_ep_str else float(raw_ep_str)
    else:
        return {
            "error": f"Episode {episode_number} not found (available: 1-{len(raw_eps)}).",
            "sources": [],
            "subtitles": [],
            "episodes": episodes_out,
            "totalEpisodes": ep_data["totalEpisodes"],
        }

    # Check cache
    cache_key = _ckey("stream", ep_data["providerId"], raw_ep, sub_or_dub)
    stream = await cache_manager.get(cache_key)
    if not stream:
        loop = asyncio.get_event_loop()
        stream = await loop.run_in_executor(
            _executor,
            _sync_get_stream,
            ep_data["providerId"],
            ep_data["providerName"],
            raw_ep,
            sub_or_dub,
        )
        if stream:
            await cache_manager.set(cache_key, stream)

    if not stream:
        return {
            "error": f"Could not extract stream for episode {episode_number}. Try switching SUB/DUB.",
            "sources": [],
            "subtitles": [],
            "episodes": episodes_out,
            "totalEpisodes": ep_data["totalEpisodes"],
        }

    return {
        "sources": [stream],
        "subtitles": [],
        "headers": stream.get("headers", {}),
        "provider": ep_data["providerName"],
        "providerId": ep_data["providerId"],
        "episodeId": f"{ep_data['providerId']}-ep-{raw_ep}",
        "episodeNumber": episode_number,
        "episodeTitle": None,
        "totalEpisodes": ep_data["totalEpisodes"],
        "episodes": episodes_out,
    }
