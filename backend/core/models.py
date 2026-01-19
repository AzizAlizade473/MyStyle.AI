from pgvector.django import VectorField
from django.db import models


class ImageUpload(models.Model):
    SOURCE_CHOICES = [
        ('AMAZON', 'Amazon'),
        ('TEMU', 'Temu'),
        ('TRENDYOL', 'Trendyol'),
        ('LOCAL', 'Local Market'),
    ]


    image = models.ImageField(upload_to='uploads/')
    embedding = VectorField(dimensions=512, null=True, blank=True)
    processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='AMAZON')
    
    # These are only used if source == 'LOCAL'
    market_name = models.CharField(max_length=100, blank=True, null=True)
    market_location = models.CharField(max_length=200, blank=True, null=True)

    # New AI-Detected Fields
    detected_color = models.CharField(max_length=50, blank=True, null=True)
    detected_material = models.CharField(max_length=50, blank=True, null=True)
    detected_style = models.CharField(max_length=50, blank=True, null=True)
    detected_source = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"Image {self.id} ({self.detected_style or 'Unknown'})"