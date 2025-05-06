from django.contrib import admin
from .models import MealCategory, Meal, MealIngredient, CustomMeal, CustomMealIngredient

class MealIngredientInline(admin.TabularInline):
    model = MealIngredient
    extra = 1

class CustomMealIngredientInline(admin.TabularInline):
    model = CustomMealIngredient
    extra = 1

@admin.register(MealCategory)
class MealCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name', 'description')

@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'category', 'base_price', 'is_available', 'is_featured', 'created_at')
    list_filter = ('is_available', 'is_featured', 'category', 'restaurant')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [MealIngredientInline]
    list_editable = ('is_available', 'is_featured', 'base_price')

@admin.register(MealIngredient)
class MealIngredientAdmin(admin.ModelAdmin):
    list_display = ('meal', 'ingredient', 'quantity', 'is_optional', 'additional_price')
    list_filter = ('is_optional', 'meal', 'ingredient')
    search_fields = ('meal__name', 'ingredient__name')
    list_editable = ('quantity', 'is_optional', 'additional_price')

@admin.register(CustomMeal)
class CustomMealAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'base_meal', 'is_public', 'created_at')
    list_filter = ('is_public', 'created_at')
    search_fields = ('name', 'description', 'user__username')
    readonly_fields = ('created_at',)
    inlines = [CustomMealIngredientInline]

@admin.register(CustomMealIngredient)
class CustomMealIngredientAdmin(admin.ModelAdmin):
    list_display = ('custom_meal', 'ingredient', 'quantity')
    list_filter = ('custom_meal', 'ingredient')
    search_fields = ('custom_meal__name', 'ingredient__name')
    list_editable = ('quantity',)
