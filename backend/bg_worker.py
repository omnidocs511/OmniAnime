import os
import asyncio
import logging
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("bg_worker")

# Set up proxies for anipy-api (anipy uses httpx internally, which respects these env vars)
proxy_url = os.environ.get("PROXY_URL")
if proxy_url:
    logger.info("Configuring residential proxies for scraping...")
    os.environ["HTTP_PROXY"] = proxy_url
    os.environ["HTTPS_PROXY"] = proxy_url

# Import backend modules after setting env vars
from stream import search_anime, get_stream_episodes, get_stream_sources

# AniList GraphQL to get top trending anime
ANILIST_URL = "https://graphql.anilist.co"
TRENDING_QUERY = """
query {
  Page(page: 1, perPage: 20) {
    media(sort: TRENDING_DESC, type: ANIME) {
      id
      title {
        romaji
        english
      }
      episodes
    }
  }
}
"""

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def fetch_trending_anime():
    """Fetch top trending anime directly from AniList."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(ANILIST_URL, json={"query": TRENDING_QUERY})
        resp.raise_for_status()
        return resp.json()["data"]["Page"]["media"]

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def process_anime(anime):
    title = anime["title"]["english"] or anime["title"]["romaji"]
    target_eps = anime.get("episodes") or 0
    logger.info(f"Pre-scraping: {title} (Eps: {target_eps})")

    try:
        # Step 1: Search & Cache (This saves ~5s on cold starts)
        results = await search_anime(title)
        if not results:
            logger.warning(f"No results found for {title}")
            return
            
        # Step 2: Episodes List & Cache (Saves ~5s)
        # We fetch SUB by default for trending
        ep_data = await get_stream_episodes(title, "sub", target_eps)
        if not ep_data.get("episodes"):
            logger.warning(f"No episodes extracted for {title}")
            return

        # Step 3: Stream Links (Optional: Pre-cache the first episode and latest episode)
        eps = ep_data["episodes"]
        if eps:
            first_ep = eps[0]["number"]
            logger.info(f"Fetching stream for {title} Episode {first_ep}...")
            await get_stream_sources(title, first_ep, "sub", target_episodes=target_eps)
            
            if len(eps) > 1:
                latest_ep = eps[-1]["number"]
                logger.info(f"Fetching stream for {title} Episode {latest_ep}...")
                await get_stream_sources(title, latest_ep, "sub", target_episodes=target_eps)

        logger.info(f"Successfully pre-cached {title}")
    except Exception as e:
        logger.error(f"Failed to process {title}: {e}")
        raise e  # Trigger tenacity retry

async def main():
    logger.info("Starting background pre-scraping worker...")
    trending = await fetch_trending_anime()
    
    # Process sequentially to avoid blowing up the provider / IP banning
    for anime in trending:
        try:
            await process_anime(anime)
            # Sleep between requests to behave nicely
            await asyncio.sleep(5)
        except Exception as e:
            logger.error(f"Gave up on {anime['title']['romaji']} after retries.")

    logger.info("Background pre-scraping completed successfully.")

if __name__ == "__main__":
    asyncio.run(main())
