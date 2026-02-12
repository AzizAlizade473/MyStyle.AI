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

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def style_image_search(request):
    """
    Advanced Search: Combines strict DB filters (Category, Location) 
    with semantic Vector Search (Query + Occasion).
    """
    # 1. GET PARAMETERS
    query_text = request.GET.get('query', '')          # e.g. "Red Dress"
    category = request.GET.get('category', '')         # e.g. "top"
    occasion = request.GET.get('occation', '')         # e.g. "Date Night"
    include_vintage = request.GET.get('include_vintage', 'false').lower() == 'true'
    hyper_local = request.GET.get('hyper_local', 'false').lower() == 'true'

    # Start with all processed images
    queryset = ImageUpload.objects.filter(processed=True).exclude(embedding__isnull=True)

    # ---------------------------------------------------------
    # 2. APPLY "HARD" FILTERS (Database Level)
    # ---------------------------------------------------------

    # A. Hyper Local: Only show items from "Local Market" source
    if hyper_local:
        queryset = queryset.filter(source='LOCAL')

    # B. Vintage Filter: If user said NO to vintage, exclude it
    if not include_vintage:
        # Assumes 'Vintage' is one of the tags in your 'detected_style' field
        queryset = queryset.exclude(detected_style__iexact='Vintage')

    # C. Category Filter: Map API 'category' to DB 'detected_type'
    if category and category.lower() != 'all':
        # We use icontains to be safe (e.g., matching "Tops" with "top")
        queryset = queryset.filter(detected_type__icontains=category)

    # ---------------------------------------------------------
    # 3. APPLY "SOFT" SEARCH (Vector Level)
    # ---------------------------------------------------------
    
    # Construct a rich prompt for CLIP
    # If user wants "Red Dress" for "Date Night", we tell CLIP exactly that.
    search_prompt = query_text
    if occasion:
        search_prompt += f" suitable for {occasion} style"

    # Generate Text Embedding
    model, _ = get_model()
    text_inputs = clip.tokenize([search_prompt]).to("cpu")
    
    with torch.no_grad():
        text_features = model.encode_text(text_inputs)
    
    search_vector = text_features.squeeze().cpu().numpy().tolist()

    # ---------------------------------------------------------
    # 4. RANK & RETURN RESULTS
    # ---------------------------------------------------------
    
    # Calculate distance and sort by best match (lowest distance)
    results = queryset.annotate(
        distance=CosineDistance('embedding', search_vector)
    ).order_by('distance')[:20] # Limit to top 20 results

    # Format the response
    data = []
    for item in results:
        data.append({
            "id": item.id,
            "image": item.image.url if item.image else "",
            "source": item.source,
            "market_name": item.market_name,
            "market_location": item.market_location,
            "score": 1 - item.distance, # Convert distance to similarity score (0 to 1)
            # Return detected tags for UI display
            "tags": {
                "color": item.detected_color,
                "material": item.detected_material,
                "style": item.detected_style,
                "type": item.detected_type
            }
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