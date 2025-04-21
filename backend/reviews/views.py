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


