from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Measurements (in cm)
    top_len = models.FloatField(null=True, blank=True, help_text="Top length in cm")
    bottom_len = models.FloatField(null=True, blank=True, help_text="Bottom length in cm")
    shoe_size = models.FloatField(null=True, blank=True, help_text="EU Shoe size")
    
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default='O')
    preferences = models.TextField(blank=True, help_text="Comma-separated styles (e.g. 'Streetwear, Vintage')")

    def __str__(self):
        return f"{self.user.username}'s Profile"