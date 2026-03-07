import json
import requests
import time

INPUT_FILE = "quests.json"
OUTPUT_FILE = "quests_clean.json"
LANG = "fr"

API_ACHIEVEMENTS = "https://api.dofusdb.fr/achievements"

def keep_fr(obj):
    """Garde seulement la version française si c'est un champ multilangue"""
    if isinstance(obj, dict) and "fr" in obj:
        return obj["fr"]
    return obj

def clean_map(map_data):
    if not map_data:
        return None
    return {
        "id": map_data.get("id"),
        "x": map_data.get("posX"),
        "y": map_data.get("posY"),
        "img": map_data.get("img", {}).get("1")
    }

def clean_objective(obj):
    return {
        "id": obj.get("id"),
        "typeId": obj.get("typeId"),
        "text": keep_fr(obj.get("text")),
        "coords": obj.get("coords"),
        "parameters": obj.get("parameters"),
        "map": clean_map(obj.get("map"))
    }

def clean_step(step):
    return {
        "id": step.get("id"),
        "name": keep_fr(step.get("name")),
        "description": keep_fr(step.get("description")),
        "objectives": [clean_objective(o) for o in step.get("objectives", [])]
    }

def clean_quest(q):
    return {
        "id": q.get("id"),
        "name": keep_fr(q.get("name")),
        "levelMin": q.get("levelMin"),
        "steps": [clean_step(s) for s in q.get("steps", [])]
    }
def get_achievements_for_quest(quest_id: int):
    """Retourne la liste des achievements FR liés à une quête"""
    skip = 0
    achievements_list = []

    while True:
        print(f"Fetching achievements for quest {quest_id} (skip={skip})...")
        params = {
            "$skip": skip,
            "need.quests": quest_id,
            "lang": LANG
        }

        response = requests.get(API_ACHIEVEMENTS, params=params)
        if response.status_code == 429:  # rate limit
            print("Rate limit hit, sleeping 2s...")
            time.sleep(2)
            continue

        response.raise_for_status()
        result = response.json()

        # 'result' est un dict avec 'data' qui contient la liste réelle
        data = result.get("data", [])

        print(f"Received {len(data)} achievements")

        if not data:
            break

        for a in data:
            if isinstance(a, dict):
                achievements_list.append({
                    "id": a.get("id"),
                    "name": keep_fr(a.get("name")),
                    "description": keep_fr(a.get("description"))
                })
            else:
                print(f"Skipping unexpected achievement format: {a}")

        skip += len(data)

        if len(data) == 0 or skip >= result.get("total", 0):
            break

    return achievements_list
# ----------------- MAIN -----------------

print("Loading quests...")
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    quests = json.load(f)

print("Cleaning quests...")
cleaned_quests = [clean_quest(q) for q in quests]

print("Fetching achievements for each quest...")
for q in cleaned_quests:
    try:
        q["achievements"] = get_achievements_for_quest(q["id"])
    except Exception as e:
        print(f"Error fetching achievements for quest {q['id']}: {e}")
        q["achievements"] = []

print(f"Saving cleaned quests to {OUTPUT_FILE}...")
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(cleaned_quests, f, ensure_ascii=False, indent=2)

print("Done.")