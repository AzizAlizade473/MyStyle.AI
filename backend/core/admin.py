from django.contrib import admin
from .models import ImageUpload

@admin.register(ImageUpload)
class ImageUploadAdmin(admin.ModelAdmin):
    list_display = ('id', 'processed', 'created_at')
    readonly_fields = ('embedding',) # Prevent admins from manually editing vectors