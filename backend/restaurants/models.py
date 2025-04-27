from django.db import models
from django.conf import settings

class Restaurant(models.Model):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='restaurant')
    name = models.CharField(max_length=255)
    description = models.TextField()
    address = models.TextField()
    phone_number = models.CharField(max_length=17)
    logo = models.ImageField(upload_to='restaurant_logos/', blank=True, null=True)
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    is_approved = models.BooleanField(null=True, default=None)  # None = pending, True = approved, False = rejected
    rejection_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class Ingredient(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='ingredients')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    quantity = models.FloatField()
    unit = models.CharField(max_length=50)  # e.g., kg, g, pieces
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} ({self.restaurant.name})"
