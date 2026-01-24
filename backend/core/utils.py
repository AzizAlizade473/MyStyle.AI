import requests
from io import BytesIO
from urllib.parse import urlparse, parse_qs, unquote
from PIL import Image
from django.core.files.base import ContentFile

def extract_image_url_from_temulink(full_url):
    """
    Extracts the 'top_gallery_url' query parameter from a Temu product link.
    """
    try:
        parsed_url = urlparse(full_url)
        # Check if it is actually a Temu link
        if 'temu.com' not in parsed_url.netloc:
            return None
            
        query_params = parse_qs(parsed_url.query)
        # The image is often hidden in 'top_gallery_url'
        encoded_img_url = query_params.get("top_gallery_url", [None])[0]
        
        if encoded_img_url:
            return unquote(encoded_img_url)
            
    except Exception as e:
        print(f"[ERROR] Could not extract image URL from Temu: {e}")
    
    return None

def download_and_process_image(url):
    """
    Downloads an image, converts it to standard RGB JPEG, 
    and returns a Django ContentFile.
    """
    try:
        # 1. Download the raw bytes
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        # 2. Open with PIL (This handles AVIF, WebP, PNG, etc.)
        image = Image.open(BytesIO(response.content))
        
        # 3. Convert to RGB (Removes transparency and fixes Color Space issues)
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # 4. Save to a memory buffer as JPEG
        output_io = BytesIO()
        image.save(output_io, format='JPEG', quality=90)
        
        # 5. Create a Django ContentFile
        file_name = "downloaded_item.jpg" # We enforce .jpg extension
        return ContentFile(output_io.getvalue(), name=file_name)

    except Exception as e:
        print(f"[ERROR] Failed to process image: {e}")
        return None