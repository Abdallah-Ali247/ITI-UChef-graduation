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

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # If user is not a superuser and is a restaurant owner, only show their restaurant's reviews
        if not request.user.is_superuser and request.user.user_type == 'restaurant':
            try:
                restaurant = request.user.restaurant
                return qs.filter(restaurant=restaurant)
            except:
                return qs.none()
        return qs

@admin.register(MealReview)
class MealReviewAdmin(admin.ModelAdmin):
    list_display = ('meal', 'user', 'rating', 'comment_preview', 'created_at')
    list_filter = ('rating', 'created_at', 'meal__restaurant')
    search_fields = ('meal__name', 'user__username', 'comment')
    readonly_fields = ('created_at', 'updated_at')

    def comment_preview(self, obj):
        return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
    comment_preview.short_description = 'Comment'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # If user is not a superuser and is a restaurant owner, only show their restaurant's meal reviews
        if not request.user.is_superuser and request.user.user_type == 'restaurant':
            try:
                restaurant = request.user.restaurant
                return qs.filter(meal__restaurant=restaurant)
            except:
                return qs.none()
        return qs