import requests
import time
import json

BASE_URL = "https://api.beta.dofusdb.fr/quests"
LIMIT = 50
MAX_RESULTS = 1975
DELAY = 0.4  # 400 ms entre les requêtes

all_quests = []

for skip in range(0, MAX_RESULTS, LIMIT):
    params = {
        "$limit": LIMIT,
        "$skip": skip,
        "lang": "fr"
    }

    print(f"Fetching page skip={skip}")

    r = requests.get(BASE_URL, params=params)
    r.raise_for_status()

    data = r.json()
    all_quests.extend(data["data"])

    time.sleep(DELAY)

with open("quests.json", "w", encoding="utf-8") as f:
    json.dump(all_quests, f, ensure_ascii=False, indent=2)

print(f"Saved {len(all_quests)} quests to quests.json")