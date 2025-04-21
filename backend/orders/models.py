from django.db import models
from django.conf import settings
from restaurants.models import Restaurant
from meals.models import Meal, CustomMeal

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready for Pickup'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_address = models.TextField()
    delivery_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Order #{self.id} by {self.user.username}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    meal = models.ForeignKey(Meal, on_delete=models.SET_NULL, null=True, blank=True)
    custom_meal = models.ForeignKey(CustomMeal, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at the time of order
    special_instructions = models.TextField(blank=True)
    
    def __str__(self):
        meal_name = self.meal.name if self.meal else self.custom_meal.name
        return f"{meal_name} x {self.quantity} in Order #{self.order.id}"
    
    def save(self, *args, **kwargs):
        # Ensure either meal or custom_meal is set, but not both
        if self.meal and self.custom_meal:
            raise ValueError("An order item cannot have both a regular meal and a custom meal")
        if not self.meal and not self.custom_meal:
            raise ValueError("An order item must have either a regular meal or a custom meal")
        super().save(*args, **kwargs)

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('cash', 'Cash on Delivery'),
        ('wallet', 'Digital Wallet'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    transaction_id = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Payment for Order #{self.order.id}"