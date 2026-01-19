from celery import shared_task
from .models import ImageUpload
from .ai import get_image_embedding, classify_embedding, TAXONOMY

@shared_task
def process_image_task(image_id):
    try:
        upload = ImageUpload.objects.get(id=image_id)
        print(f"Processing Image {image_id}...")

        # 1. Generate Main Vector (for Search)
        vector = get_image_embedding(upload.image.path)
        
        if vector:
            upload.embedding = vector
            
            # 2. Zero-Shot Classification (The Magic)
            # We use the vector we just made to guess the attributes
            upload.detected_color = classify_embedding(vector, TAXONOMY["colors"])
            upload.detected_material = classify_embedding(vector, TAXONOMY["materials"])
            upload.detected_style = classify_embedding(vector, TAXONOMY["styles"])
            
            upload.processed = True
            upload.save()
            
            print(f"Success! Tagged as: {upload.detected_color} {upload.detected_material}")
        else:
            print(f"Failed to generate vector for Image {image_id}")
            
    except ImageUpload.DoesNotExist:
        print("Image not found DB")
    except Exception as e:
        print(f"Task Error: {e}")