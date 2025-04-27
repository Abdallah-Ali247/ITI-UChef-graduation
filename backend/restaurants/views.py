from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.shortcuts import get_object_or_404
from .models import Restaurant, Ingredient
from .serializers import RestaurantSerializer, IngredientSerializer

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner or admin
        return obj.owner == request.user or request.user.user_type == 'admin'

class IsRestaurantOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the restaurant owner or admin
        return obj.restaurant.owner == request.user or request.user.user_type == 'admin'

class RestaurantViewSet(viewsets.ModelViewSet):
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'address']
    ordering_fields = ['name', 'created_at']
    
    def get_queryset(self):
        # For admin users, show all restaurants
        if self.request.user.is_authenticated and self.request.user.user_type == 'admin':
            return Restaurant.objects.all()
            
        # For public users, only show active and approved restaurants
        return Restaurant.objects.filter(is_active=True, is_approved=True)
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        # For admin users, the owner_id is handled in the serializer's create method
        # For regular restaurant owners, use the current user
        if self.request.user.user_type == 'admin' and 'owner_id' in self.request.data:
            # Let the serializer handle it
            serializer.save()
        else:
            # Check if the user already has a restaurant
            from django.db.models import Q
            existing_restaurant = Restaurant.objects.filter(owner=self.request.user).exists()
            if existing_restaurant:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'owner': 'You already have a restaurant. Each user can only have one restaurant.'})
            
            # Regular restaurant owner creating their own restaurant
            serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['get'])
    def meals(self, request, pk=None):
        restaurant = self.get_object()
        meals = restaurant.meals.all()
        from meals.serializers import MealSerializer
        serializer = MealSerializer(meals, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def ingredients(self, request, pk=None):
        restaurant = self.get_object()
        ingredients = restaurant.ingredients.all()
        serializer = IngredientSerializer(ingredients, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='my-restaurant', permission_classes=[IsAuthenticated])
    def my_restaurant(self, request):
        """Get the restaurant owned by the authenticated user"""
        # Check if the user is a restaurant owner
        if request.user.user_type != 'restaurant':
            return Response(
                {'detail': 'Only restaurant owners can access this endpoint.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            restaurant = Restaurant.objects.get(owner=request.user)
            serializer = self.get_serializer(restaurant)
            return Response(serializer.data)
        except Restaurant.DoesNotExist:
            return Response(
                {'detail': 'You do not have a restaurant set up yet.'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class IngredientViewSet(viewsets.ModelViewSet):
    serializer_class = IngredientSerializer
    permission_classes = [IsAuthenticated, IsRestaurantOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve'] or self.request.method == 'GET':
            return [AllowAny()]
        return super().get_permissions()
    
    def get_queryset(self):
        # Get restaurant_id from query parameters if provided
        restaurant_id = self.request.query_params.get('restaurant', None)
        
        # Base queryset
        queryset = Ingredient.objects.all()
        
        # Filter by restaurant if specified
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)
            
        # For non-admin users, only show ingredients from active and approved restaurants
        if not (self.request.user.is_authenticated and self.request.user.user_type == 'admin'):
            queryset = queryset.filter(restaurant__is_active=True, restaurant__is_approved=True)
            
        return queryset
    
    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant')
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        
        # Check if the user is the owner of the restaurant
        if restaurant.owner != self.request.user and self.request.user.user_type != 'admin':
            return Response({'detail': 'You do not have permission to add ingredients to this restaurant.'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        serializer.save()
