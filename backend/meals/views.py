from django.shortcuts import render
from rest_framework import viewsets, filters, status 
from rest_framework.permissions import IsAuthenticated, AllowAny

class MealCategoryViewSet(viewsets.ModelViewSet):
    queryset = MealCategory.objects.all()
    serializer_class = MealCategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
