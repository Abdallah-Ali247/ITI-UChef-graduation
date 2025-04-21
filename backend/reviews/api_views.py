from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import MealReview
from .serializers import MealReviewSerializer
import json

class DebugMealReviewCreateView(APIView):
    """
    Debug view for creating meal reviews.
    This view will print detailed information about the request and authentication.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, format=None):
        # Debug information
        print(f"Request user: {request.user}, authenticated: {request.user.is_authenticated}")
        print(f"Request data: {request.data}")
        print(f"Request auth: {request.auth}")
        print(f"Request headers: {request.headers}")
        
        # Prepare data for serializer
        data = request.data.copy()
        
        # Make sure we have the meal ID
        if 'meal' not in data:
            return Response({'meal': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create serializer with request data
        serializer = MealReviewSerializer(data=data)
        
        if serializer.is_valid():
            try:
                # Save with the authenticated user
                review = serializer.save(user=request.user)
                print(f"Successfully created review: {review}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                print(f"Error saving review: {str(e)}")
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
