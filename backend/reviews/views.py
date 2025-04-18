from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from .models import RestaurantReview, MealReview, CustomMealReview
from .serializers import RestaurantReviewSerializer, MealReviewSerializer, CustomMealReviewSerializer

class IsReviewOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the review owner or admin
        return obj.user == request.user or request.user.user_type == 'admin'

class RestaurantReviewViewSet(viewsets.ModelViewSet):
    queryset = RestaurantReview.objects.all()
    serializer_class = RestaurantReviewSerializer
    permission_classes = [IsAuthenticated, IsReviewOwnerOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'rating']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return super().get_permissions()
    
    def get_queryset(self):
        restaurant_id = self.request.query_params.get('restaurant', None)
        if restaurant_id:
            return RestaurantReview.objects.filter(restaurant_id=restaurant_id)
        return RestaurantReview.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class MealReviewViewSet(viewsets.ModelViewSet):
    queryset = MealReview.objects.all()
    serializer_class = MealReviewSerializer
    permission_classes = [IsAuthenticated, IsReviewOwnerOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'rating']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return super().get_permissions()
    
    def get_queryset(self):
        meal_id = self.request.query_params.get('meal', None)
        if meal_id:
            return MealReview.objects.filter(meal_id=meal_id)
        return MealReview.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CustomMealReviewViewSet(viewsets.ModelViewSet):
    queryset = CustomMealReview.objects.all()
    serializer_class = CustomMealReviewSerializer
    permission_classes = [IsAuthenticated, IsReviewOwnerOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'rating']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return super().get_permissions()
    
    def get_queryset(self):
        custom_meal_id = self.request.query_params.get('custom_meal', None)
        if custom_meal_id:
            return CustomMealReview.objects.filter(custom_meal_id=custom_meal_id)
        return CustomMealReview.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
