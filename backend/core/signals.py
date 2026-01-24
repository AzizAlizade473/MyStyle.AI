from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ImageUpload
from .tasks import process_image_task

@receiver(post_save, sender=ImageUpload)
def image_upload_post_save(sender, instance, created, **kwargs):
    """
    Triggered immediately after an ImageUpload is saved to the DB.
    """
    if created:
        # If this is a new image, tell Celery to process it.
        # .delay() is what sends it to the background worker.
        process_image_task.delay(instance.id)