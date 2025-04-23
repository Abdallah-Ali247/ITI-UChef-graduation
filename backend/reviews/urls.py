from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RestaurantReviewViewSet, MealReviewViewSet, CustomMealReviewViewSet
from .api_views import DebugMealReviewCreateView

router = DefaultRouter()
router.register(r'restaurant-reviews', RestaurantReviewViewSet)
router.register(r'meal-reviews', MealReviewViewSet)
router.register(r'custom-meal-reviews', CustomMealReviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('debug-meal-review/', DebugMealReviewCreateView.as_view(), name='debug-meal-review'),
]
