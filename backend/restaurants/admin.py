from django.contrib import admin
from .models import Restaurant, Ingredient

class IngredientInline(admin.TabularInline):
    model = Ingredient
    extra = 1

@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'address', 'phone_number', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description', 'address')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [IngredientInline]
    
@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'quantity', 'unit', 'price_per_unit', 'is_available')
    list_filter = ('is_available', 'restaurant')
    search_fields = ('name', 'description')
    list_editable = ('quantity', 'price_per_unit', 'is_available')
