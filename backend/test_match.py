import sys, asyncio, logging
sys.path.insert(0, '.')
from stream import search_anime, _best_match

async def main():
    r1 = await search_anime('Bleach')
    b1 = await _best_match(r1, 'Bleach', 100)
    print('Bleach Best:', b1['name'])

asyncio.run(main())
