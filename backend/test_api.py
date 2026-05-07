import httpx, asyncio
async def main():
    async with httpx.AsyncClient() as client:
        r = await client.get('http://127.0.0.1:8000/api/anime/269')
        print('Bleach eps:', r.json().get('data', {}).get('episodes'))
        r = await client.get('http://127.0.0.1:8000/api/anime/20')
        print('Naruto eps:', r.json().get('data', {}).get('episodes'))
        r = await client.get('http://127.0.0.1:8000/api/anime/16498')
        print('AOT eps:', r.json().get('data', {}).get('episodes'))

asyncio.run(main())
