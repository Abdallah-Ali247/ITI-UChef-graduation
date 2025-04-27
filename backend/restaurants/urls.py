from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RestaurantViewSet, IngredientViewSet

router = DefaultRouter()
router.register(r'restaurants', RestaurantViewSet, basename='restaurant')
router.register(r'ingredients', IngredientViewSet, basename='ingredient')

urlpatterns = [
    path('', include(router.urls)),
]
