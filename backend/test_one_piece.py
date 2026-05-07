import sys
sys.path.insert(0, '.')
from anipy_api.provider import get_provider, LanguageTypeEnum
from anipy_api.anime import Anime

p = get_provider('allanime')
results = list(p.get_search('One Piece'))
for r in results:
    try:
        a = Anime.from_search_result(p, r)
        eps = a.get_episodes(LanguageTypeEnum.SUB)
        if len(eps) > 1000:
            print(f'FOUND MAIN: {r.name} with {len(eps)} episodes at index {results.index(r)}')
    except Exception as e:
        pass
