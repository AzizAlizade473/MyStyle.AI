from django.db import transaction
from rest_framework import serializers
from .models import ImageUpload

class ImageUploadSerializer(serializers.ModelSerializer):

    MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB
    ALLOWED_CONTENT_TYPES = ("image/jpeg", "image/png", "image/webp")

    image = serializers.ImageField(write_only=True)
    embedding = serializers.ReadOnlyField()
    processed = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = ImageUpload

        fields = [
            "id", "image", "embedding", "processed", "created_at",
            "source", "market_name", "market_location"]
        read_only_fields = ["id", "embedding", "processed", "created_at"]

    def validate_image(self, value):
        content_type = getattr(value, "content_type", None)
        if content_type and content_type.lower() not in self.ALLOWED_CONTENT_TYPES:
            raise serializers.ValidationError(
                f"Unsupported image type: {content_type}. "
                f"Allowed types: {', '.join(self.ALLOWED_CONTENT_TYPES)}"
            )

        if value.size > self.MAX_UPLOAD_SIZE:
            raise serializers.ValidationError(
                f"Image size is too large. Max allowed is {self.MAX_UPLOAD_SIZE // (1024*1024)} MB."
            )

        return value

    def create(self, validated_data):
        # 1. Save to Database first
        instance = super().create(validated_data)

        def _enqueue_task():
            try:
                from .tasks import process_image_task
                process_image_task.delay(instance.id)
            except ImportError:
                print("Warning: tasks.py not found or circular import failed.")
            except Exception as e:
                print(f"Error triggering task: {e}")

        transaction.on_commit(_enqueue_task)
        
        return instance