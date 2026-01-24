from rest_framework import serializers
from .models import ImageUpload
from .utils import extract_image_url_from_temulink, download_and_process_image # <--- Import utils

class ImageUploadSerializer(serializers.ModelSerializer):
    image_url = serializers.URLField(write_only=True, required=False)

    class Meta:
        model = ImageUpload
        fields = [
            "id", "image", "image_url", "embedding", "processed", 
            "created_at", "source", "market_name", "market_location"
        ]
        read_only_fields = ["id", "embedding", "processed", "created_at"]
        extra_kwargs = {'image': {'required': False}}

    def validate(self, data):
        if not data.get('image') and not data.get('image_url'):
            raise serializers.ValidationError("You must provide either an Image File or an Image URL.")
        return data

    def create(self, validated_data):
        raw_url = validated_data.pop('image_url', None)

        if raw_url:
            # 1. Check if it's a Temu Link and extract the real image
            extracted_url = extract_image_url_from_temulink(raw_url)
            
            # If extracted_url is found, use it. Otherwise, use the raw_url (maybe it's a direct link)
            target_url = extracted_url if extracted_url else raw_url

            # 2. Download and Convert to JPG (Using our new util)
            processed_file = download_and_process_image(target_url)

            if not processed_file:
                raise serializers.ValidationError({"image_url": "Failed to download or process the image. Ensure the link is valid."})

            validated_data['image'] = processed_file

        return super().create(validated_data)