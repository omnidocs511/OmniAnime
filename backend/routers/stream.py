"""
Streaming endpoints — episode list + video sources + proxy.
"""

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
import httpx
from stream import get_stream_episodes, get_stream_sources

router = APIRouter(tags=["stream"])


@router.get("/stream/episodes")
async def stream_episodes(
    title: str = Query(..., min_length=1, description="Anime title to search"),
    type: str = Query("sub", description="sub or dub"),
    target_episodes: int = Query(None, description="Expected total episodes to help match"),
):
    """Get available episodes from the streaming provider."""
    try:
        data = await get_stream_episodes(title, type, target_episodes)
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch stream episodes: {e}")


@router.get("/stream/watch")
async def stream_watch(
    title: str = Query(..., min_length=1, description="Anime title"),
    ep: int = Query(1, ge=1, description="Episode number"),
    type: str = Query("sub", description="sub or dub"),
    server: str = Query(None, description="Preferred server"),
    target_episodes: int = Query(None, description="Expected total episodes to help match"),
):
    """Get video sources for a specific episode."""
    try:
        data = await get_stream_sources(title, ep, type, server, target_episodes)
        if data.get("error") and not data.get("sources"):
            return data
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch stream sources: {e}")


@router.get("/stream/proxy")
async def stream_proxy(
    request: Request,
    url: str = Query(..., description="Video/HLS URL to proxy"),
    referer: str = Query("", description="Referer header to send"),
    download: bool = Query(False, description="Force file download"),
    filename: str = Query("video.mp4", description="Filename for download"),
):
    """
    Proxy video requests to bypass CORS restrictions.
    Forwards Range headers from the browser so seeking works.
    """
    proxy_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }
    if referer:
        proxy_headers["Referer"] = referer

    # Forward the Range header from the browser (required for seeking)
    range_header = request.headers.get("range")
    if range_header:
        proxy_headers["Range"] = range_header

    try:
        client = httpx.AsyncClient(timeout=30, follow_redirects=True)
        req = client.build_request("GET", url, headers=proxy_headers)
        resp = await client.send(req, stream=True)

        response_headers = {}
        # Forward content headers for proper seeking support
        for h in ("content-type", "content-length", "content-range", "accept-ranges"):
            if h in resp.headers:
                response_headers[h.title()] = resp.headers[h]

        # Ensure Accept-Ranges is present so browsers know seeking is supported
        if "Accept-Ranges" not in response_headers:
            response_headers["Accept-Ranges"] = "bytes"
            
        if download:
            import urllib.parse
            # ASCII-safe filename for old browsers
            safe_ascii = filename.encode('ascii', 'ignore').decode('ascii')
            # RFC 5987 encoded filename for modern browsers to support unicode (like em-dash)
            encoded_name = urllib.parse.quote(filename)
            response_headers["Content-Disposition"] = f"attachment; filename=\"{safe_ascii}\"; filename*=utf-8''{encoded_name}"

        return StreamingResponse(
            resp.aiter_bytes(),
            status_code=resp.status_code,
            headers=response_headers,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Proxy error: {e}")
