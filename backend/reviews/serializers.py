from rest_framework import serializers
from .models import RestaurantReview, MealReview, CustomMealReview

class RestaurantReviewSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    restaurant_name = serializers.ReadOnlyField(source='restaurant.name')
    user = serializers.PrimaryKeyRelatedField(read_only=True)  # Make user field read-only
    
    class Meta:
        model = RestaurantReview
        fields = ['id', 'user', 'user_username', 'restaurant', 'restaurant_name', 
                  'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']  # Add user to read_only_fields

class MealReviewSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    meal_name = serializers.ReadOnlyField(source='meal.name')
    user = serializers.PrimaryKeyRelatedField(read_only=True)  # Make user field read-only
    
    class Meta:
        model = MealReview
        fields = ['id', 'user', 'user_username', 'meal', 'meal_name', 
                  'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']  # Add user to read_only_fields

class CustomMealReviewSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    custom_meal_name = serializers.ReadOnlyField(source='custom_meal.name')
    user = serializers.PrimaryKeyRelatedField(read_only=True)  # Make user field read-only
    
    class Meta:
        model = CustomMealReview
        fields = ['id', 'user', 'user_username', 'custom_meal', 'custom_meal_name', 
                  'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']  # Add user to read_only_fields
