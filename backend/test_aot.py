import sys, asyncio, logging
sys.path.insert(0, '.')
logging.basicConfig(level=logging.DEBUG)
from stream import search_anime, _best_match, _sync_get_stream

async def main():
    r1 = await search_anime('Attack on Titan')
    b1 = await _best_match(r1, 'Attack on Titan', 25)
    import concurrent.futures
    executor = concurrent.futures.ThreadPoolExecutor()
    loop = asyncio.get_event_loop()
    s = await loop.run_in_executor(executor, _sync_get_stream, b1['identifier'], b1['name'], 1, 'sub')
    print('Stream source:', s)

asyncio.run(main())
