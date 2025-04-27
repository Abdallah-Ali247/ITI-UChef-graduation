from rest_framework import serializers
from .models import Order, OrderItem, Payment
from meals.serializers import MealSerializer, CustomMealSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    meal_details = MealSerializer(source='meal', read_only=True)
    custom_meal_details = CustomMealSerializer(source='custom_meal', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'meal', 'meal_details', 'custom_meal', 'custom_meal_details', 
                  'quantity', 'price', 'special_instructions']
        read_only_fields = ['id']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'order', 'amount', 'payment_method', 
                  'transaction_id', 'status', 'payment_date']
        read_only_fields = ['id', 'payment_date']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    restaurant_name = serializers.ReadOnlyField(source='restaurant.name')
    user_username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'user_username', 'restaurant', 'restaurant_name', 
                  'status', 'total_price', 'delivery_address', 'delivery_notes', 
                  'created_at', 'updated_at', 'items', 'payment']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        items_data = self.context.get('items', [])
        payment_data = self.context.get('payment', None)
        
        order = Order.objects.create(**validated_data)
        
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        if payment_data:
            Payment.objects.create(order=order, **payment_data)
        
        return order