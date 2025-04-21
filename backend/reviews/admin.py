from django.contrib import admin
from .models import RestaurantReview, MealReview, CustomMealReview
# Register your models here.

@admin.register(RestaurantReview)
class RestaurantReviewAdmin(admin.ModelAdmin):
    list_display = ('restaurant', 'user', 'rating', 'comment_preview', 'created_at')
    list_filter = ('rating', 'created_at', 'restaurant')
    search_fields = ('restaurant__name', 'user__username', 'comment')
    readonly_fields = ('created_at', 'updated_at')
    