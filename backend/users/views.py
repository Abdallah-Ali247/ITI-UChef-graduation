from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer, UserRegistrationSerializer
from django.shortcuts import get_object_or_404

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.user_type == 'admin':
            return User.objects.all()
        return User.objects.filter(id=user.id)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.user_type == 'admin':
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Custom endpoint to update both user and profile data in one request"""
    user = request.user
    
    # Update user fields
    if 'first_name' in request.data:
        user.first_name = request.data['first_name']
    if 'last_name' in request.data:
        user.last_name = request.data['last_name']
    if 'email' in request.data:
        user.email = request.data['email']
    if 'phone_number' in request.data:
        user.phone_number = request.data['phone_number']
    if 'address' in request.data:
        user.address = request.data['address']
    
    # Save user changes
    user.save()
    
    # Update or create profile
    profile, created = UserProfile.objects.get_or_create(user=user)
    
    # Update profile fields
    if 'bio' in request.data:
        profile.bio = request.data['bio']
    if 'favorite_cuisine' in request.data:
        profile.favorite_cuisine = request.data['favorite_cuisine']
    
    # Save profile changes
    profile.save()
    
    # Return updated user data
    serializer = UserSerializer(user)
    return Response(serializer.data)