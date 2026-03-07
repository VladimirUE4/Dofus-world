from bs4 import BeautifulSoup

BASE = "https://dofusyelle.com"

# ouvre ton fichier HTML local
with open("page.html", "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")

urls = []

# parcourt les <a> dans #donjons-container dans l'ordre du HTML
for a in soup.select("#donjons-container a[href]"):
    href = a.get("href")
    if href.startswith("/donjons/"):
        full_url = BASE + href
        urls.append(full_url)

# on garde l'ordre tel quel
print("\nListe des URLs dans l'ordre :\n")

for url in urls:
    print(url)

print(f"\nTotal : {len(urls)}")