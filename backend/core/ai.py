import torch
import clip
from PIL import Image
from .models import ImageUpload
from celery import shared_task

# For the CLIP to choose from
TAXONOMY = {
    "types":['Shirt', 'Sweatshirt', 'Jacket', 'Hoodie', 'Trousers', 'Shoes', 'Underwear & Socks', 'Accessories'],
    "ac_styles":["Glasses", "Jewelery", "Belt", "Bag", "Watch", "Scarf", "Wallet", "Hat"],
    "sh_styles":[ "t-shirt", "polo", "turtleneck", "with zipper", "with buttons", "crewneck"],
    "colors": ["Red", "Blue", "Green", "Black", "White", "Yellow", "Pink", "Purple", "Beige", "Grey"],
    "materials": ["Denim", "Cotton", "Leather", "Wool", "Silk", "Polyester", "Linen", "Knitted"],
    "styles": ["Casual", "Formal", "Streetwear", "Vintage", "Sporty", "Business", "Bohemian", "Straight", "Oversized"],
    # Note: 'Source' is hard for AI to guess from pixels alone, but we can try visual signatures
    "sources": ["Temu", "Trendyol", "Local Seller", "Luxury Brand"] 
}

# Global variables to hold the model in memory (Singleton Pattern)
_MODEL = None
_PREPROCESS = None
_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def get_model():
    """
    Loads CLIP model only if it hasn't been loaded yet.
    This prevents reloading 500MB+ for every single request.
    """
    global _MODEL, _PREPROCESS
    if _MODEL is None:
        print(f"Loading CLIP model on {_DEVICE}...")
        _MODEL, _PREPROCESS = clip.load("ViT-B/32", device=_DEVICE)
        _MODEL.eval() # Set to evaluation mode (faster, no training)
    return _MODEL, _PREPROCESS

@shared_task
def generate_image_embedding(image_id):
    """
    Finds the image by ID, generates its AI embedding, and saves it.
    """
    try:
        # 1. Get the Image Object from DB
        instance = ImageUpload.objects.get(id=image_id)
        
        # 2. Load Model
        model, preprocess = get_model()

        # 3. Process Image
        # We open the image file directly from the disk
        image_input = preprocess(Image.open(instance.image.path)).unsqueeze(0).to(_DEVICE)

        # 4. Generate Embedding (The "Thinking" Part)
        with torch.no_grad():
            image_features = model.encode_image(image_input)

        # 5. Convert to Python List and Save
        # .cpu().numpy() is needed to move data from GPU/Tensor to standard format
        embedding_list = image_features.squeeze().cpu().numpy().tolist()
        
        instance.embedding = embedding_list
        instance.processed = True
        instance.save()
        
        return f"Success: Embedding generated for Image {image_id}"

    except ImageUpload.DoesNotExist:
        return f"Error: Image {image_id} not found."
    except Exception as e:
        return f"Error processing image {image_id}: {str(e)}"

def get_image_embedding(image_file):
    """
    Reads an image file (path or object), processes it, and returns the vector.
    """
    model, preprocess = get_model()
    
    try:
        # Load image (handle both file paths and memory objects)
        image = Image.open(image_file).convert("RGB")
        
        # Preprocess and move to GPU/CPU
        image_input = preprocess(image).unsqueeze(0).to(_DEVICE)
        
        with torch.no_grad():
            image_features = model.encode_image(image_input)
            image_features /= image_features.norm(dim=-1, keepdim=True)
            
        # Convert Tensor -> Numpy -> Python List (for Postgres)
        return image_features.cpu().numpy().flatten().tolist()
        
    except Exception as e:
        print(f"[AI ERROR] Failed to embed image: {e}")
        return None

def get_text_embedding(text):
    """
    Converts text (e.g., "A red dress") into a search vector.
    """
    model, _ = get_model()
    
    try:
        # Tokenize (truncate=True handles long text automatically)
        text_tokens = clip.tokenize([text], truncate=True).to(_DEVICE)
        
        with torch.no_grad():
            text_features = model.encode_text(text_tokens)
            text_features /= text_features.norm(dim=-1, keepdim=True)
            
        return text_features.cpu().numpy().flatten().tolist()
        
    except Exception as e:
        print(f"[AI ERROR] Failed to embed text: {e}")
        return None
    
def classify_embedding(image_vector_list, candidates):
    """
    Zero-Shot Classification:
    Takes an image vector and a list of text options (e.g., ["Red", "Blue"]).
    Returns the text option that best matches the image.
    """
    model, _ = get_model()
    
    try:
        # 1. Convert candidates to Text Vectors
        text_tokens = clip.tokenize(candidates).to(_DEVICE)
        
        with torch.no_grad():
            text_features = model.encode_text(text_tokens)
            text_features /= text_features.norm(dim=-1, keepdim=True)
        
        # 2. Prepare Image Vector (Convert list back to Tensor)
        image_features = torch.tensor(image_vector_list).unsqueeze(0).to(_DEVICE)
        
        # 3. Calculate Similarity (Dot Product)
        # shape: (1, n_candidates)
        similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
        
        # 4. Pick the winner
        values, indices = similarity[0].topk(1)
        best_index = indices[0].item()
        
        return candidates[best_index]

    except Exception as e:
        print(f"[AI CLASS ERROR] {e}")
        return None