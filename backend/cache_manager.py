import os
import json
import logging
from typing import Any, Optional
import redis.asyncio as redis

logger = logging.getLogger(__name__)

# Fallback in-memory dict if Redis is not configured
_fallback_cache = {}

class CacheManager:
    def __init__(self):
        self.redis_url = os.environ.get("REDIS_URL")
        self.client = None
        if self.redis_url:
            try:
                self.client = redis.from_url(self.redis_url, decode_responses=True)
                logger.info("Connected to Redis cache.")
            except Exception as e:
                logger.warning(f"Failed to connect to Redis: {e}. Using in-memory fallback.")
                self.client = None
        else:
            logger.info("REDIS_URL not set. Using in-memory fallback cache.")

    async def get(self, key: str) -> Optional[Any]:
        if self.client:
            try:
                val = await self.client.get(key)
                if val:
                    return json.loads(val)
            except Exception as e:
                logger.warning(f"Redis get error for {key}: {e}")
        else:
            return _fallback_cache.get(key)
        return None

    async def set(self, key: str, value: Any, ttl: int = 604800) -> None:
        """Set a value in the cache. Default TTL is 7 days (604800 seconds)."""
        if self.client:
            try:
                await self.client.set(key, json.dumps(value), ex=ttl)
            except Exception as e:
                logger.warning(f"Redis set error for {key}: {e}")
        else:
            _fallback_cache[key] = value
            # Note: In-memory fallback does not enforce TTL

cache_manager = CacheManager()
