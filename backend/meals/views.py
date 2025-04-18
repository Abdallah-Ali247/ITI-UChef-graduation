from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from .models import MealCategory, Meal, MealIngredient, CustomMeal, CustomMealIngredient
from .serializers import MealCategorySerializer, MealSerializer, MealIngredientSerializer, CustomMealSerializer, CustomMealIngredientSerializer
from restaurants.models import Restaurant, Ingredient
from restaurants.views import IsOwnerOrReadOnly, IsRestaurantOwnerOrReadOnly

class MealCategoryViewSet(viewsets.ModelViewSet):
    queryset = MealCategory.objects.all()
    serializer_class = MealCategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

class MealViewSet(viewsets.ModelViewSet):
    queryset = Meal.objects.all()
    serializer_class = MealSerializer
    permission_classes = [IsAuthenticated, IsRestaurantOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['name', 'base_price', 'created_at']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return super().get_permissions()
    
    def get_queryset(self):
        restaurant_id = self.request.query_params.get('restaurant', None)
        category_id = self.request.query_params.get('category', None)
        
        queryset = Meal.objects.all()
        
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        return queryset
    
    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant')
        restaurant = get_object_or_404(Restaurant, id=restaurant_id)
        
        # Check if the user is the owner of the restaurant
        if restaurant.owner != self.request.user and self.request.user.user_type != 'admin':
            return Response({'detail': 'You do not have permission to add meals to this restaurant.'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        serializer.save()

class CustomMealViewSet(viewsets.ModelViewSet):
    queryset = CustomMeal.objects.all()
    serializer_class = CustomMealSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'ingredients']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user', None)
        is_public = self.request.query_params.get('is_public', None)
        
        queryset = CustomMeal.objects.all()
        
        # If not admin or restaurant owner, only show user's own meals or public meals
        if self.request.user.user_type not in ['admin', 'restaurant']:
            queryset = queryset.filter(user=self.request.user) | queryset.filter(is_public=True)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        if is_public is not None:
            is_public = is_public.lower() == 'true'
            queryset = queryset.filter(is_public=is_public)
            
        return queryset
    
    def perform_create(self, serializer):
        # Save the custom meal with the current user
        custom_meal = serializer.save(user=self.request.user)
        
        # Process the ingredients for the custom meal
        ingredients_data = self.request.data.get('ingredients', [])
        for ingredient_data in ingredients_data:
            ingredient_id = ingredient_data.get('ingredient')
            quantity = ingredient_data.get('quantity')
            
            ingredient = get_object_or_404(Ingredient, id=ingredient_id)
            CustomMealIngredient.objects.create(
                custom_meal=custom_meal,
                ingredient=ingredient,
                quantity=quantity
            )
    
    @action(detail=True, methods=['get'])
    def ingredients(self, request, pk=None):
        """Get all ingredients for a custom meal"""
        custom_meal = self.get_object()
        ingredients = CustomMealIngredient.objects.filter(custom_meal=custom_meal)
        serializer = CustomMealIngredientSerializer(ingredients, many=True)
        return Response(serializer.data)
