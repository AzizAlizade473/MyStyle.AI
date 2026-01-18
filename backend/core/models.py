from pgvector.django import VectorField
from django.db import models

class ImageUpload(models.Model):
    image = models.ImageField(upload_to='uploads/')
    embedding = VectorField(dimensions=512, null=True, blank=True)
    processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Image {self.id} (Processed: {self.processed})'