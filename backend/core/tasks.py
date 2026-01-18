from celery import shared_task
from .models import ImageUpload
from .ai import get_image_embedding # Import our new AI engine

@shared_task
def process_image_task(image_id):
    """
    Background task that:
    1. Gets the image from DB
    2. Runs AI model
    3. Saves vector to DB
    """
    try:
        # 1. Fetch the object
        upload = ImageUpload.objects.get(id=image_id)
        
        print(f"Processing Image ID: {image_id}")
        
        # 2. Generate Vector (Passing the file path)
        vector = get_image_embedding(upload.image.path)
        
        if vector:
            # 3. Save to Database
            upload.embedding = vector
            upload.processed = True
            upload.save()
            print(f"Success! Vector saved for Image {image_id}")
        else:
            print(f"Failed to generate vector for Image {image_id}")
            
    except ImageUpload.DoesNotExist:
        print("Image not found in DB")
    except Exception as e:
        print(f"Task Error: {e}")