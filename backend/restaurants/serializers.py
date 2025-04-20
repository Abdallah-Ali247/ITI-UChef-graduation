from rest_framework import serializers
from .models import Restaurant, Ingredient

class RestaurantSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(write_only=True, required=False)
    owner_username = serializers.ReadOnlyField(source='owner.username')
    owner_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'description', 'address', 'phone_number', 
                  'logo', 'opening_time', 'closing_time', 'is_active', 'is_approved',
                  'rejection_reason', 'owner_id', 'owner_username', 'owner_details']
        read_only_fields = ['id']
