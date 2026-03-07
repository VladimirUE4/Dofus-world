import json
import os
import urllib.request
import hashlib
from urllib.parse import urlparse

# Paths
JSON_FILE = '/home/x0g/Documents/Dofus-world/guideopti_brakmar.json'
IMAGE_DIR = '/home/x0g/Documents/Dofus-world/public/assets/images/json'
LOCAL_BASE_URL = '/assets/images/json/'

def get_filename(url):
    parsed = urlparse(url)
    path_parts = parsed.path.strip('/').split('/')
    if len(path_parts) >= 2:
        # Use the last two parts to handle names like /boss/123.png vs /icons/123.png
        filename = "_".join(path_parts[-2:])
    else:
        filename = path_parts[-1]
    
    # Clean filename of suspicious characters just in case
    filename = filename.replace(' ', '_').replace(':', '_').replace('/', '_')
    return filename

def download_image(url):
    try:
        filename = get_filename(url)
        filepath = os.path.join(IMAGE_DIR, filename)

        # If file exists but URL is different, we might have a collision
        # However, for Dofus icons, the same URL often means the same image.
        # But if different URLs have same filename (rare for this dataset), we'll overwrite or skip.
        # Let's check if the file exists already
        if not os.path.exists(filepath):
            print(f"Downloading: {url} -> {filename}")
            opener = urllib.request.build_opener()
            opener.addheaders = [('User-Agent', 'Mozilla/5.0')]
            urllib.request.install_opener(opener)
            urllib.request.urlretrieve(url, filepath)
        
        return LOCAL_BASE_URL + filename
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return url

def main():
    if not os.path.exists(IMAGE_DIR):
        os.makedirs(IMAGE_DIR)

    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Process all items
    for item in data:
        # Check 'image' field (usually for categories)
        if 'image' in item and item['image'] and item['image'].startswith('http'):
            item['image'] = download_image(item['image'])
        
        # Check 'images' array (usually for quests)
        if 'images' in item and isinstance(item['images'], list):
            new_images = []
            for img_url in item['images']:
                if img_url.startswith('http'):
                    new_images.append(download_image(img_url))
                else:
                    new_images.append(img_url)
            item['images'] = new_images

        # Check 'bossImages' array
        if 'bossImages' in item and isinstance(item['bossImages'], list):
            new_boss_images = []
            for img_url in item['bossImages']:
                if img_url.startswith('http'):
                    new_boss_images.append(download_image(img_url))
                else:
                    new_boss_images.append(img_url)
            item['bossImages'] = new_boss_images
        
        # Check legacy 'bossImage' string
        if 'bossImage' in item and item['bossImage'] and item['bossImage'].startswith('http'):
             item['bossImage'] = download_image(item['bossImage'])

    # Save the updated JSON
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"JSON updated: {JSON_FILE}")

if __name__ == "__main__":
    main()
