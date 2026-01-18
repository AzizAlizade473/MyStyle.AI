from django.contrib import admin
from .models import ImageUpload

@admin.register(ImageUpload)
class ImageUploadAdmin(admin.ModelAdmin):
    list_display = ('id', 'processed', 'created_at')
    
    # 1. HIDE the raw field (which causes the crash)
    exclude = ('embedding',)
    
    # 2. SHOW a custom read-only summary instead
    readonly_fields = ('embedding_status', 'image_preview')

    def embedding_status(self, obj):
        if obj.embedding is None:
            return "❌ Not Processed Yet"
        # We convert it to a string so Django doesn't try to do math on it
        return f"✅ Vector Generated ({len(obj.embedding)} dimensions)"

    def image_preview(self, obj):
        return obj.image.name