from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import generics, parsers
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import ImageUploadSerializer
from pgvector.django import CosineDistance

from .models import ImageUpload
from .ai import get_text_embedding

# backend/core/views.py

@api_view(['GET'])
@permission_classes([AllowAny])
def search_images(request):
    query = request.GET.get('q', '')
    if not query:
        return Response({"error": "No query provided"}, status=400)

    # 1. Convert Text -> Vector
    query_vector = get_text_embedding(query)
    if not query_vector:
        return Response({"error": "AI Model failed to process text"}, status=500)

    # 2. Database Search (FIXED)
    # We add .filter(embedding__isnull=False) to ignore unprocessed images
    results = ImageUpload.objects.filter(embedding__isnull=False).annotate(
        distance=CosineDistance('embedding', query_vector)
    ).order_by('distance')[:5]

    # 3. Serialize
    data = [
        {
            "id": img.id,
            "url": request.build_absolute_uri(img.image.url),
            "score": f"{1 - img.distance:.2f}" 
        } 
        for img in results
    ]
    
    return Response(data)

class ImageUploadView(generics.CreateAPIView):
    queryset = ImageUpload.objects.all()
    serializer_class = ImageUploadSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser] # Important for handling files!

    permission_classes = [IsAuthenticated]