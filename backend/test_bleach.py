import sys
sys.path.insert(0, '.')
from anipy_api.provider import get_provider
from rapidfuzz import fuzz

p = get_provider('allanime')
results = list(p.get_search('Bleach'))
for r in results[:10]:
    score = fuzz.ratio('Bleach'.lower(), r.name.lower())
    print(f'{r.name} (score: {score})')
