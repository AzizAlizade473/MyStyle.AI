import torch
import clip
from PIL import Image
import numpy as np

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