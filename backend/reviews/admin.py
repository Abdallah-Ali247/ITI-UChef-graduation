from django.contrib import admin
from .models import RestaurantReview, MealReview, CustomMealReview
# Register your models here.

@admin.register(RestaurantReview)
class RestaurantReviewAdmin(admin.ModelAdmin):
    list_display = ('restaurant', 'user', 'rating', 'comment_preview', 'created_at')
    list_filter = ('rating', 'created_at', 'restaurant')
    search_fields = ('restaurant__name', 'user__username', 'comment')
    readonly_fields = ('created_at', 'updated_at')
    
    def comment_preview(self, obj):
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = 'Comment'