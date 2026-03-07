import os
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

URLS = [
    "https://dofusyelle.com/donjons/grotte-hesque",
"https://dofusyelle.com/donjons/crypte-de-kardorim", 
"https://dofusyelle.com/donjons/grange-du-tournesol-affame",
"https://dofusyelle.com/donjons/chateau-ensable",
"https://dofusyelle.com/donjons/cour-du-bouftou-royal",
"https://dofusyelle.com/donjons/donjon-des-scarafeuilles",
"https://dofusyelle.com/donjons/donjon-des-tofus",
"https://dofusyelle.com/donjons/maison-fantome",
"https://dofusyelle.com/donjons/donjon-des-squelettes",
"https://dofusyelle.com/donjons/cache-de-kankreblath",
"https://dofusyelle.com/donjons/academie-des-gobs",
"https://dofusyelle.com/donjons/donjon-des-bworks",
"https://dofusyelle.com/donjons/donjon-des-forgerons",
"https://dofusyelle.com/donjons/donjon-des-larves",
"https://dofusyelle.com/donjons/grotte-hesque",
"https://dofusyelle.com/donjons/nid-du-kwakwa",
"https://dofusyelle.com/donjons/refuge-sylvestre",
"https://dofusyelle.com/donjons/chateau-du-wa-wabbit",
"https://dofusyelle.com/donjons/village-kanniboul",
"https://dofusyelle.com/donjons/clos-des-blops",
"https://dofusyelle.com/donjons/galaxieme-dimension",
"https://dofusyelle.com/donjons/laboratoire-de-brumen",
"https://dofusyelle.com/donjons/cale-de-l-arche-d-otomai",
"https://dofusyelle.com/donjons/pitons-rocheux-des-craqueleurs",
"https://dofusyelle.com/donjons/epreuve-de-draegnerys",
"https://dofusyelle.com/donjons/terrier-du-wa-wabbit",
"https://dofusyelle.com/donjons/cimetiere-des-mastodontes",
"https://dofusyelle.com/donjons/antre-de-la-reine-nyee",
"https://dofusyelle.com/donjons/domaine-ancestral",
"https://dofusyelle.com/donjons/bateau-du-chouque",
"https://dofusyelle.com/donjons/chapiteau-des-magik-riktus",
"https://dofusyelle.com/donjons/antre-du-dragon-cochon",
"https://dofusyelle.com/donjons/caverne-du-koulosse",
"https://dofusyelle.com/donjons/taniere-du-meulou",
"https://dofusyelle.com/donjons/arbre-de-moon",
"https://dofusyelle.com/donjons/theatre-de-dramak",
"https://dofusyelle.com/donjons/fabrique-de-mallefisk",
"https://dofusyelle.com/donjons/repaire-du-kharnozor",
"https://dofusyelle.com/donjons/goulet-du-rasboul",
"https://dofusyelle.com/donjons/bibliotheque-du-maitre-corbac",
"https://dofusyelle.com/donjons/garde-manger-du-rat-blanc",
"https://dofusyelle.com/donjons/souriciere-du-rat-noir",
"https://dofusyelle.com/donjons/miausolee-du-pounicheur",
"https://dofusyelle.com/donjons/bambusaie-de-damadrya",
"https://dofusyelle.com/donjons/antre-du-blop-multicolore-royal",
"https://dofusyelle.com/donjons/centre-du-labyrinthe-du-minotoror",
"https://dofusyelle.com/donjons/serre-du-royalmouth",
"https://dofusyelle.com/donjons/tofulaillier-royal",
"https://dofusyelle.com/donjons/antre-du-crocabulia",
"https://dofusyelle.com/donjons/repaire-du-skeunk",
"https://dofusyelle.com/donjons/megalithe-de-fraktale",
"https://dofusyelle.com/donjons/voliere-de-la-haute-truche",
"https://dofusyelle.com/donjons/caverne-d-el-piko",
"https://dofusyelle.com/donjons/ring-du-capitaine-ekarlatte",
"https://dofusyelle.com/donjons/vallee-de-la-dame-des-eaux",
"https://dofusyelle.com/donjons/atelier-du-tanukoui-san",
"https://dofusyelle.com/donjons/clairiere-du-chene-mou",
"https://dofusyelle.com/donjons/laboratoire-du-tynril",
"https://dofusyelle.com/donjons/excavation-du-mansot-royal",
"https://dofusyelle.com/donjons/dojo-du-vent",
"https://dofusyelle.com/donjons/fabrique-de-foux-d-artifice",
"https://dofusyelle.com/donjons/epave-du-grolandais-violent",
"https://dofusyelle.com/donjons/repaire-de-sphincter-cell",
"https://dofusyelle.com/donjons/galerie-du-phossile",
"https://dofusyelle.com/donjons/tertre-du-long-sommeil",
"https://dofusyelle.com/donjons/canopee-du-kimbo",
"https://dofusyelle.com/donjons/salle-du-minotot",
"https://dofusyelle.com/donjons/hypogee-de-l-obsidiantre",
"https://dofusyelle.com/donjons/grotte-de-kanigroula",
"https://dofusyelle.com/donjons/plateau-de-ush",
"https://dofusyelle.com/donjons/tombe-du-shogun-tofugawa",
"https://dofusyelle.com/donjons/cavernes-givrefoux",
"https://dofusyelle.com/donjons/boyau-du-pere-ver",
"https://dofusyelle.com/donjons/horologium-de-xlii",
"https://dofusyelle.com/donjons/demeure-des-esprits",
"https://dofusyelle.com/donjons/poste-de-controle-du-supervizoeuf",
"https://dofusyelle.com/donjons/antre-du-korriandre",
"https://dofusyelle.com/donjons/antre-du-kralamoure-geant",
"https://dofusyelle.com/donjons/grotte-du-bworker",
"https://dofusyelle.com/donjons/temple-du-grand-ougah",
"https://dofusyelle.com/donjons/cave-du-toxoliath",
"https://dofusyelle.com/donjons/caverne-du-kolosso",
"https://dofusyelle.com/donjons/cavernes-nourricieres",
"https://dofusyelle.com/donjons/mine-de-sakai",
"https://dofusyelle.com/donjons/antichambre-du-glourseleste",
"https://dofusyelle.com/donjons/pyramide-d-ombre",
"https://dofusyelle.com/donjons/camp-du-comte-razof",
"https://dofusyelle.com/donjons/bastion-des-marteaux-aigris",
"https://dofusyelle.com/donjons/forgefroide-de-missiz-frizz",
"https://dofusyelle.com/donjons/transporteur-de-sylargh",
"https://dofusyelle.com/donjons/salons-prives-de-klime",
"https://dofusyelle.com/donjons/laboratoire-de-nileza",
"https://dofusyelle.com/donjons/donjon-du-comte",
"https://dofusyelle.com/donjons/comte-et-ses-sbires",
"https://dofusyelle.com/donjons/aquadome-de-merkator",
"https://dofusyelle.com/donjons/palais-du-roi-nidas",
"https://dofusyelle.com/donjons/trone-de-la-cour-sombre",
"https://dofusyelle.com/donjons/ventre-de-la-baleine",
"https://dofusyelle.com/donjons/oeil-de-vortex",
"https://dofusyelle.com/donjons/defi-du-chaloeil",
"https://dofusyelle.com/donjons/vaisseau-du-capitaine-meno",
"https://dofusyelle.com/donjons/temple-de-koutoulou",
"https://dofusyelle.com/donjons/palais-de-dantinea",
"https://dofusyelle.com/donjons/chambre-de-tal-kasha",
"https://dofusyelle.com/donjons/manoir-des-katrepat",
"https://dofusyelle.com/donjons/belvedere-d-ilyzaelle",
"https://dofusyelle.com/donjons/tour-de-solar",
"https://dofusyelle.com/donjons/tour-de-bethel",
"https://dofusyelle.com/donjons/brasserie-du-roi-dazak",
"https://dofusyelle.com/donjons/sanctuaire-de-torkelonia",
"https://dofusyelle.com/donjons/arbre-de-mort",
"https://dofusyelle.com/donjons/trone-de-sang",
"https://dofusyelle.com/donjons/fers-de-la-tyrannie",
"https://dofusyelle.com/donjons/sentence-de-la-balance",
"https://dofusyelle.com/donjons/tempete-de-l-eliocalypse",
"https://dofusyelle.com/donjons/memoire-d-orukam",
"https://dofusyelle.com/donjons/souvenir-d-imagiro",
"https://dofusyelle.com/donjons/rituel-de-kabahal",
"https://dofusyelle.com/donjons/bataille-de-l-aurore-pourpre",
"https://dofusyelle.com/donjons/chambre-des-malefices",
"https://dofusyelle.com/donjons/autel-de-la-dechireuse",
"https://dofusyelle.com/donjons/breuil-du-venerable",
"https://dofusyelle.com/donjons/cratere-minus",
"https://dofusyelle.com/donjons/donjon-de-nowel",
"https://dofusyelle.com/donjons/donjon-de-nowel-2",
"https://dofusyelle.com/donjons/maison-du-papa-nowel",
"https://dofusyelle.com/donjons/potager-d-halouine",
"https://dofusyelle.com/donjons/caverne-de-cire-momore",
"https://dofusyelle.com/donjons/temple-de-gargandyas",
"https://dofusyelle.com/donjons/tour-minerale",
"https://dofusyelle.com/donjons/aurore-pourpre",
"https://dofusyelle.com/donjons/marche-de-kelba",
"https://dofusyelle.com/donjons/hauteurs-de-l-inglorium"
]

BASE_URL = "https://dofusyelle.com"
OUTPUT_DIR = "donjons_data"
IMAGE_DIR = os.path.join(OUTPUT_DIR, "images")
os.makedirs(IMAGE_DIR, exist_ok=True)


def download_image(url, folder):
    if not url:
        return None
    url = urljoin(BASE_URL, url)
    filename = url.split("/")[-1].split("?")[0]
    path = os.path.join(folder, filename)
    if not os.path.exists(path):
        try:
            r = requests.get(url, timeout=10)
            r.raise_for_status()
            with open(path, "wb") as f:
                f.write(r.content)
        except Exception as e:
            print(f"Erreur lors du téléchargement de l'image {url}: {e}")
            return None
    return path


def parse_html(html, url):
    """
    Parse the loaded HTML using BeautifulSoup and extract the relevant nodes.
    """
    soup = BeautifulSoup(html, "html.parser")

    # ----- NOM (h1) -----
    name_el = soup.select_one("#main-card h1")
    if not name_el:
        name_el = soup.find("h1")
    name = name_el.text.strip() if name_el else "Donjon Inconnu"

    # ----- VULNERABILITE & MECANIQUES (#main-card) -----
    vulnerability_text = None
    mechanics_texts = []
    
    main_card = soup.find(id="main-card")
    if main_card:
        vuln_el = main_card.find("h2")
        if vuln_el:
            vulnerability_text = vuln_el.text.strip()
        
        # Toutes les balises p dans le col-lg-8 du main-card
        for p in main_card.select(".col-lg-8 p.my-3"):
            text = p.get_text(separator="\n").strip()
            if text:
                mechanics_texts.append(text)

    # ----- SORTS DU BOSS (#spells) -----
    spells = []
    spells_article = soup.find(id="spells")
    if spells_article:
        # Extraire tous les textes intelligemment
        for child in spells_article.select(".body > div.links, .body > u"):
            if child.name == "u":
                spells.append({"type": "phase", "text": child.text.strip()})
            elif child.name == "div" and "links" in child.get("class", []):
                for li in child.find_all("li"):
                    spells.append({"type": "spell", "text": li.text.strip()})

    # Si la structure n'a pas de phases, fallback basique:
    if not spells:
        spells = [{"type": "spell", "text": li.text.strip()} for li in soup.select("#spells li")]

    # ----- QUETES (#quests) -----
    quests = []
    for a in soup.select("#quests .links a"):
        quests.append({
            "name": a.text.strip(),
            "url": urljoin(BASE_URL, a.get("href"))
        })

    # ----- CAPTURE & OCRE (#quests) -----
    capture_text = None
    is_ocre = False

    quests_article = soup.find(id="quests")
    if quests_article:
        # Trouver le h3 contenant "Capture"
        headers = quests_article.find_all("h3")
        for h in headers:
            if "Capture" in h.text:
                # Récupérer les <p> qui suivent
                sibling = h.find_next_sibling("p")
                while sibling and sibling.name == "p":
                    text = sibling.text.strip()
                    if sibling.find("img", id="picto_ocre") or "Ocre" in text:
                        is_ocre = True
                    else:
                        if not capture_text:
                            capture_text = text
                        else:
                            capture_text += "\n" + text
                    sibling = sibling.find_next_sibling("p")

    # ----- IMAGES CLES -----
    # Chercher spécifiquement: image boss, image localisation, image stats
    images_keys = {}
    boss_img = soup.select_one("#main-card .col-lg-4 img")
    if boss_img: images_keys["boss"] = boss_img.get("src")
    
    localisation_img = soup.select_one("#localisation img")
    if localisation_img: images_keys["localisation"] = localisation_img.get("src")
    
    stats_img = soup.select_one("#stats img")
    if stats_img: images_keys["stats"] = stats_img.get("src")

    # Téléchargement images
    safe_name = name.replace(" ", "_").lower().replace("'", "").replace("é", "e").replace("è", "e").replace("à", "a")
    dungeon_folder = os.path.join(IMAGE_DIR, safe_name)
    os.makedirs(dungeon_folder, exist_ok=True)

    downloaded_images = {}
    for key, img_url in images_keys.items():
        downloaded = download_image(img_url, dungeon_folder)
        if downloaded:
            downloaded_images[key] = downloaded

    return {
        "name": name,
        "url": url,
        "images": downloaded_images,
        "vulnerability": vulnerability_text,
        "mechanics": "\n\n".join(mechanics_texts) if mechanics_texts else None,
        "spells": spells,
        "quests": quests,
        "capture": capture_text,
        "useful_for_ocre": is_ocre
    }


def main():
    results = []
    print(f"Démarrage du scraping avec Playwright pour {len(URLS)} donjons...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/100.0.4896.127 Safari/537.36"
        )
        page = context.new_page()

        for url in URLS:
            print("Scraping:", url)
            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
                try:
                    # Wait for the main card to render since it's an SPA
                    page.wait_for_selector("#main-card", timeout=10000)
                except Exception:
                    print("  Avertissement: #main-card non trouvé dans les temps.")
                
                html = page.content()
                data = parse_html(html, url)
                if data:
                    results.append(data)
            except Exception as e:
                print(f"Erreur inattendue pour {url}: {e}")

        browser.close()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_file = os.path.join(OUTPUT_DIR, "donjons.json")
    with open(out_file, "w", encoding="utf8") as f:
        json.dump(results, f, indent=4, ensure_ascii=False)

    print("\nScraping terminé !")
    print(f"Données enregistrées dans : {out_file}")


if __name__ == "__main__":
    main()