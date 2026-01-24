from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import generics, parsers
from rest_framework.permissions import IsAuthenticated
from .serializers import ImageUploadSerializer
from pgvector.django import CosineDistance
from rest_framework.authentication import TokenAuthentication

from .models import ImageUpload
from .ai import get_text_embedding, get_model
import clip
import torch

# backend/core/views.py

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def search_images(request):
    """
    Search by Text OR by Image ID (Find Similar).
    """
    query_text = request.GET.get('q', '')      # Text search: ?q=red dress
    similar_to_id = request.GET.get('similar_to', '') # Visual search: ?similar_to=15

    if not query_text and not similar_to_id:
        return Response({"error": "Please provide 'q' (text) or 'similar_to' (image_id)"}, status=400)

    # --- MODE A: VISUAL SEARCH (Find similar to existing image) ---
    if similar_to_id:
        try:
            target_image = ImageUpload.objects.get(id=similar_to_id)
            if not target_image.embedding.all():
                return Response({"error": "Target image is not processed yet."}, status=400)
            
            search_vector = target_image.embedding
        except ImageUpload.DoesNotExist:
            return Response({"error": "Image not found"}, status=404)

    # --- MODE B: TEXT SEARCH (Text -> Embedding) ---
    else:
        model, _ = get_model()
        text_inputs = clip.tokenize([query_text]).to("cpu")
        
        with torch.no_grad():
            text_features = model.encode_text(text_inputs)
            
        search_vector = text_features.squeeze().cpu().numpy().tolist()

    # --- PERFORM DATABASE SEARCH ---
    # We use CosineDistance.
    # Note: pgvector sorts by Distance (Lower is better/closer).
    results = ImageUpload.objects.order_by(
        CosineDistance('embedding', search_vector)
    )[:10] # Get top 10

    # formatting response
    data = []
    for item in results:
        data.append({
            "id": item.id,
            "image": item.image.url if item.image else "",
            "market_name": item.market_name,
            "source": item.source
        })

    return Response(data)

class ImageUploadView(generics.CreateAPIView):
    queryset = ImageUpload.objects.all()
    serializer_class = ImageUploadSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    
    # 1. STRICTLY use Token Auth only.
    # This ignores the Session Cookie, bypassing the CSRF check entirely.
    authentication_classes = [TokenAuthentication]
    
    # 2. Require the user to be logged in (via Token)
    permission_classes = [IsAuthenticated]

    # Optional: Automatically link the uploaded image to the user
    def perform_create(self, serializer):
        # If your ImageUpload model has a 'user' field, you can do this:
        # serializer.save(user=self.request.user)
        # If not, just save typically:
        serializer.save()