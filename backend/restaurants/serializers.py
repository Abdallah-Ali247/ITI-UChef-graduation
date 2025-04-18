from rest_framework import serializers
from .models import Restaurant, Ingredient

class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'description', 'address', 'phone_number', 
                  'logo', 'opening_time', 'closing_time', 'is_active']
        read_only_fields = ['id']

class IngredientSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.ReadOnlyField(source='restaurant.name')
    
    class Meta:
        model = Ingredient
        fields = ['id', 'name', 'description', 'quantity', 'unit', 
                  'price_per_unit', 'is_available', 'restaurant', 'restaurant_name']
        read_only_fields = ['id']
