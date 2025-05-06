from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (UserViewSet, UserProfileViewSet, UserRegistrationView, 
                   current_user, update_profile, ActivateAccountView,
                   PasswordResetRequestView, PasswordResetConfirmView)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', UserRegistrationView.as_view(), name='user-registration'),
    path('activate/<uidb64>/<token>/', ActivateAccountView.as_view(), name='activate'),
    path('me/', current_user, name='current-user'),
    path('update-profile/', update_profile, name='update-profile'),
    
    # Password reset URLs
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]
