import json

INPUT_FILE = "quests_clean.json"
OUTPUT_FILE = "quests_clean2.json"

def keep_fr(obj):
    """Garde seulement la version française si c'est un champ multilangue"""
    if isinstance(obj, dict) and "fr" in obj:
        return obj["fr"]
    return obj

def clean_quest(q):
    """Nettoie une quête en enlevant les steps, slug et levelMax, mais garde achievements existants"""
    return {
        "id": q.get("id"),
        "name": keep_fr(q.get("name")),
        "levelMin": q.get("levelMin"),
        "achievements": q.get("achievements", [])  # on garde ce qui existe
    }

def main():
    print("Loading quests...")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    print("Cleaning quests...")
    cleaned = [clean_quest(q) for q in data]

    print(f"Saving cleaned quests to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)

    print("Done.")

if __name__ == "__main__":
    main()