from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Order, OrderItem, Payment
from .serializers import OrderSerializer, OrderItemSerializer, PaymentSerializer
from restaurants.models import Restaurant

class IsOrderOwnerOrRestaurantOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Allow if user is the order owner
        if obj.user == request.user:
            return True
        
        # Allow if user is the restaurant owner
        if obj.restaurant.owner == request.user:
            return True
        
        # Allow if user is an admin
        if request.user.user_type == 'admin':
            return True
        
        return False

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsOrderOwnerOrRestaurantOwnerOrAdmin]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'status']
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin can see all orders
        if user.user_type == 'admin':
            return Order.objects.all()
        
        # Restaurant owner can see orders for their restaurant
        if user.user_type == 'restaurant':
            try:
                restaurant = user.restaurant
                return Order.objects.filter(restaurant=restaurant)
            except Restaurant.DoesNotExist:
                return Order.objects.none()
        
        # Regular users can only see their own orders
        return Order.objects.filter(user=user)
    
    def perform_create(self, serializer):
        # Save the order with the current user
        order = serializer.save(user=self.request.user)
        
        # Process the order items
        items_data = self.request.data.get('items', [])
        
        from meals.models import Meal, CustomMeal, CustomMealIngredient
        from restaurants.models import Ingredient
        
        for item_data in items_data:
            # Create a copy of the item data to avoid modifying the original
            item_to_create = item_data.copy()
            
            # Handle meal ID - convert to Meal object
            if 'meal' in item_to_create and item_to_create['meal']:
                try:
                    meal_id = item_to_create.pop('meal')
                    meal = Meal.objects.get(id=meal_id)
                    item_to_create['meal'] = meal
                except Meal.DoesNotExist:
                    continue  # Skip this item if meal doesn't exist
            
            # Handle custom meal ID - convert to CustomMeal object
            if 'custom_meal' in item_to_create and item_to_create['custom_meal']:
                try:
                    custom_meal_id = item_to_create.pop('custom_meal')
                    custom_meal = CustomMeal.objects.get(id=custom_meal_id)
                    item_to_create['custom_meal'] = custom_meal
                    
                    # Get the custom meal ingredients and subtract quantities from inventory
                    custom_meal_ingredients = CustomMealIngredient.objects.filter(custom_meal=custom_meal)
                    order_quantity = item_to_create.get('quantity', 1)
                    
                    for cmi in custom_meal_ingredients:
                        try:
                            # Get the ingredient
                            ingredient = cmi.ingredient
                            
                            # Calculate how much to subtract (ingredient quantity per meal × order quantity)
                            subtract_amount = cmi.quantity * order_quantity
                            
                            # Update the ingredient quantity
                            if ingredient.quantity >= subtract_amount:
                                ingredient.quantity -= subtract_amount
                                
                                # If quantity becomes zero or very close to zero, mark as unavailable
                                if ingredient.quantity < 0.001:
                                    ingredient.quantity = 0
                                    ingredient.is_available = False
                                
                                ingredient.save()
                            else:
                                # Not enough quantity available
                                # We'll still create the order but log this issue
                                import logging
                                logger = logging.getLogger(__name__)
                                logger.warning(
                                    f"Not enough quantity of ingredient {ingredient.name} (ID: {ingredient.id}) "
                                    f"for custom meal {custom_meal.name} (ID: {custom_meal.id}). "
                                    f"Required: {subtract_amount}, Available: {ingredient.quantity}"
                                )
                        except Exception as e:
                            # Log any errors but continue processing the order
                            import logging
                            logger = logging.getLogger(__name__)
                            logger.error(f"Error updating ingredient quantity: {str(e)}")
                            
                except CustomMeal.DoesNotExist:
                    continue  # Skip this item if custom meal doesn't exist
            
            # Create the order item
            OrderItem.objects.create(order=order, **item_to_create)
        
        # Process payment if provided
        payment_data = self.request.data.get('payment', None)
        if payment_data:
            Payment.objects.create(order=order, **payment_data)
        
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        status_value = request.data.get('status')
        
        if status_value not in [choice[0] for choice in Order.STATUS_CHOICES]:
            return Response({'detail': 'Invalid status value'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Only restaurant owner or admin can update status
        if request.user != order.restaurant.owner and request.user.user_type != 'admin':
            return Response({'detail': 'You do not have permission to update this order status'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        order.status = status_value
        order.save()
        
        return Response(OrderSerializer(order).data)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsOrderOwnerOrRestaurantOwnerOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin can see all payments
        if user.user_type == 'admin':
            return Payment.objects.all()
        
        # Restaurant owner can see payments for their restaurant's orders
        if user.user_type == 'restaurant':
            try:
                restaurant = user.restaurant
                return Payment.objects.filter(order__restaurant=restaurant)
            except Restaurant.DoesNotExist:
                return Payment.objects.none()
        
        # Regular users can only see their own payments
        return Payment.objects.filter(order__user=user)
