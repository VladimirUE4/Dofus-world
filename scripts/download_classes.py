import os
import urllib.request

CLASSES = [
    "feca", "osamodas", "enutrof", "sram", "xelor", "ecaflip", "eniripsa", 
    "iop", "cra", "sadida", "sacrieur", "pandawa", "roublard", "zobal", 
    "steamer", "eliotrope", "huppermage", "ouginak", "forgelance"
]
SEXES = ["m", "f"]
BASE_URL = "https://www.dofusplanet.fr/img/breeds/"
TARGET_DIR = "/home/x0g/Documents/Dofus-world/public/assets/images/classes"

def download_classes():
    if not os.path.exists(TARGET_DIR):
        os.makedirs(TARGET_DIR)
    
    for cls in CLASSES:
        for sex in SEXES:
            filename = f"profile_{sex}.png"
            url = f"{BASE_URL}{cls}/{filename}"
            target_path = os.path.join(TARGET_DIR, f"{cls}_{sex}.png")
            
            try:
                print(f"Downloading {cls}_{sex}...")
                opener = urllib.request.build_opener()
                opener.addheaders = [('User-Agent', 'Mozilla/5.0')]
                urllib.request.install_opener(opener)
                urllib.request.urlretrieve(url, target_path)
            except Exception as e:
                print(f"Failed to download {url}: {e}")

if __name__ == "__main__":
    download_classes()
