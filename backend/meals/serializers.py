from rest_framework import serializers
from .models import MealCategory, Meal, MealIngredient, CustomMeal, CustomMealIngredient
from restaurants.serializers import IngredientSerializer

class MealCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MealCategory
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']
        
        