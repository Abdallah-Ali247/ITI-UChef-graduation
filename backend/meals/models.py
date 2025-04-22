from django.db import models
from django.conf import settings
from restaurants.models import Restaurant, Ingredient

class MealCategory(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = 'Meal Categories'

class Meal(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='meals')
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(MealCategory, on_delete=models.SET_NULL, null=True, related_name='meals')
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='meal_images/', blank=True, null=True)
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.restaurant.name}"

class MealIngredient(models.Model):
    meal = models.ForeignKey(Meal, on_delete=models.CASCADE, related_name='meal_ingredients')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.FloatField()
    is_optional = models.BooleanField(default=False)
    additional_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return f"{self.ingredient.name} for {self.meal.name}"

class CustomMeal(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='custom_meals')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    base_meal = models.ForeignKey(Meal, on_delete=models.SET_NULL, null=True, blank=True, related_name='custom_versions')
    is_public = models.BooleanField(default=False)  # If True, other users can see and order this custom meal
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} by {self.user.username}"

class CustomMealIngredient(models.Model):
    custom_meal = models.ForeignKey(CustomMeal, on_delete=models.CASCADE, related_name='ingredients')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.FloatField()
    
    def __str__(self):
        return f"{self.ingredient.name} for {self.custom_meal.name}"