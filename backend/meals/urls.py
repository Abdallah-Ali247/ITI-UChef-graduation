from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MealCategoryViewSet, MealViewSet, CustomMealViewSet

router = DefaultRouter()
router.register(r'categories', MealCategoryViewSet)
router.register(r'meals', MealViewSet)
router.register(r'custom-meals', CustomMealViewSet)

urlpatterns = [
    path('', include(router.urls)),
]