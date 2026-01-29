from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework.permissions import AllowAny
from .serializers import UserRegistrationSerializer
from .models import UserProfile
from .serializers import UserProfileSerializer


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def register_user(request):
    if request.method == 'POST':
        serializer = UserRegistrationSerializer(data = request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message':"User created successfully"}, status=status.HTTP_201_CREATED)
        print(serializer.errors)
        return Response(serializer.errors ,status=status.HTTP_400_BAD_REQUEST)

class ManageProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated] # <--- Only logged-in users

    def get_object(self):
        # Return the profile of the CURRENT user
        return self.request.user.profile