from rest_framework import serializers
from .models import MealCategory, Meal, MealIngredient, CustomMeal, CustomMealIngredient
from restaurants.serializers import IngredientSerializer

class MealCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MealCategory
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']
        
    
class MealIngredientSerializer(serializers.ModelSerializer):
    ingredient_details = IngredientSerializer(source='ingredient', read_only=True)
    
    class Meta:
        model = MealIngredient
        fields = ['id', 'ingredient', 'ingredient_details', 'quantity', 'is_optional', 'additional_price']
        read_only_fields = ['id']

class MealSerializer(serializers.ModelSerializer):
    meal_ingredients = MealIngredientSerializer(many=True, read_only=True)
    category_name = serializers.ReadOnlyField(source='category.name')
    restaurant_name = serializers.ReadOnlyField(source='restaurant.name')
    
    class Meta:
        model = Meal
        fields = ['id', 'name', 'description', 'category', 'category_name', 
                  'restaurant', 'restaurant_name', 'base_price', 'image', 
                  'is_available', 'is_featured', 'meal_ingredients']
        read_only_fields = ['id']

class CustomMealIngredientSerializer(serializers.ModelSerializer):
    ingredient_details = IngredientSerializer(source='ingredient', read_only=True)
    
    class Meta:
        model = CustomMealIngredient
        fields = ['id', 'ingredient', 'ingredient_details', 'quantity']
        read_only_fields = ['id']