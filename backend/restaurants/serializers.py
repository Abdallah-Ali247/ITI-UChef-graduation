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
        
    def get_owner_details(self, obj):
        if not obj.owner:
            return None
            
        return {
            'id': obj.owner.id,
            'username': obj.owner.username,
            'email': obj.owner.email,
            'first_name': obj.owner.first_name,
            'last_name': obj.owner.last_name,
            'user_type': obj.owner.user_type
        }
    
    def create(self, validated_data):
        # Handle owner_id if provided (for admin users)
        owner_id = validated_data.pop('owner_id', None)
        request = self.context.get('request')
        
        # Set is_active based on approval status
        is_approved = validated_data.get('is_approved', None)
        if is_approved is not None:
            validated_data['is_active'] = is_approved  # Active only if approved
        
        # If owner_id is provided and user is admin, use that owner
        if owner_id and request and request.user.user_type == 'admin':
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                owner = User.objects.get(id=owner_id)
                # Check if owner already has a restaurant
                if hasattr(owner, 'restaurant'):
                    raise serializers.ValidationError({'owner_id': 'This user already has a restaurant.'})
                restaurant = Restaurant.objects.create(owner=owner, **validated_data)
                return restaurant
            except User.DoesNotExist:
                raise serializers.ValidationError({'owner_id': 'User does not exist.'})
        
        # Check if owner is already in validated_data (set by perform_create)
        if 'owner' in validated_data:
            restaurant = Restaurant.objects.create(**validated_data)
        else:
            # Default behavior: use the requesting user as owner
            restaurant = Restaurant.objects.create(owner=request.user, **validated_data)
        return restaurant
        
    def update(self, instance, validated_data):
        # Set is_active based on approval status if approval status is being updated
        if 'is_approved' in validated_data:
            is_approved = validated_data.get('is_approved')
            validated_data['is_active'] = bool(is_approved)  # Active only if approved (True), not if pending (None) or rejected (False)
        
        # Update all fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance
