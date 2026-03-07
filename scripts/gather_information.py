import json

# Remplace ces chemins par tes fichiers
json1_path = "quests_clean2.json"  # Le premier JSON avec id, name, levelMin, achievements
json2_path = "dofus_dataset(22).json"  # Le deuxième JSON avec type, id, name, etc.
output_path = "guideopti_bonta.json"  # Le résultat final
# Charger les deux JSON
with open(json1_path, "r", encoding="utf-8") as f:
    data1 = json.load(f)

with open(json2_path, "r", encoding="utf-8") as f:
    data2 = json.load(f)

# Créer un dictionnaire pour lookup rapide par name
lookup = {entry["name"]: entry for entry in data1}

# Parcourir le deuxième JSON et compléter si le name correspond
for quest in data2:
    quest_name = quest.get("name")
    if quest_name and quest_name in lookup:
        matching_entry = lookup[quest_name]
        quest["dofusdbid"] = matching_entry["id"]
        quest["levelMin"] = matching_entry["levelMin"]
        # Ajouter achievements uniquement s'il y en a
        if matching_entry.get("achievements"):
            quest["achievements"] = matching_entry["achievements"]

# Écrire le résultat dans un troisième fichier
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(data2, f, ensure_ascii=False, indent=2)

print(f"Fichier généré : {output_path}")