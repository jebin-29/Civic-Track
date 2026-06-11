from django.contrib.auth import get_user_model
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
# from rest_framework.permissions import IsAdminUser
# from rest_framework.authentication import TokenAuthentication
# from django.contrib.auth import login, logout
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import User, UserProfile
from .serializers import (
    UserSerializer, UserProfileSerializer, RegisterSerializer,
    LoginSerializer, ChangePasswordSerializer, UserUpdateSerializer,
    AdminUserSerializer
)

User = get_user_model()


class RegisterView(APIView):
    """User registration view"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key,
                'message': 'User registered successfully'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data['user']

            # ❌ REMOVE session login
            # login(request, user)

            token, created = Token.objects.get_or_create(user=user)

            return Response({
                'user': UserSerializer(user).data,
                'token': token.key,
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except:
            pass

        # ❌ REMOVE THIS LINE
        # logout(request)

        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    """User profile view"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    def put(self, request):
        user = request.user
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=user)
        
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserUpdateView(APIView):
    """Update user information"""
    permission_classes = [permissions.IsAuthenticated]
    
    def put(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """Change user password"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateLocationView(APIView):
    """Update user location"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if not latitude or not longitude:
            return Response(
                {'error': 'Latitude and longitude are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            profile = request.user.profile
            profile.update_location(float(latitude), float(longitude))
            return Response({'message': 'Location updated successfully'})
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )


# Admin Views
class AdminUserListView(generics.ListAPIView):
    """Admin view to list all users"""
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = User.objects.all()
        search = self.request.query_params.get('search', None)

        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search)
            )

        return queryset.order_by('-date_joined')


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin view to manage individual users"""
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.all()
    
    def perform_destroy(self, instance):
        # Soft delete - just deactivate the user
        instance.is_active = False
        instance.save()

# @api_view(['GET'])
# @permission_classes([IsAdminUser])
# @authentication_classes([TokenAuthentication])
# def admin_users_list(request):
#     users = User.objects.all()

#     data = []
#     for user in users:
#         data.append({
#             "id": user.id,
#             "username": user.username,
#             "email": user.email,
#             "status": "active" if user.is_active else "banned",
#         })

#     return Response(data)

# @api_view(['POST'])
# @permission_classes([IsAdminUser])
# @authentication_classes([TokenAuthentication])
# def ban_user(request, user_id):
#     user = get_object_or_404(User, id=user_id)
#     user.is_active = False
#     user.save()
#     return Response({"message": "User banned"})


# @api_view(['POST'])
# @permission_classes([IsAdminUser])
# @authentication_classes([TokenAuthentication])
# def unban_user(request, user_id):
#     user = get_object_or_404(User, id=user_id)
#     user.is_active = True
#     user.save()
#     return Response({"message": "User unbanned"})


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def toggle_user_status(request, user_id):
    from issues.models import Issue
    
    user = get_object_or_404(User, id=user_id)
    user.is_active = not user.is_active
    user.save()
    
    # Hide/show all issues by this user when banned/unbanned
    if not user.is_active:
        # User banned → hide all their issues
        Issue.objects.filter(reported_by=user).update(is_hidden=True)
        print(f"🚫 Banned {user.username} - hidden all their issues")
    else:
        # User unbanned → restore all their issues
        Issue.objects.filter(reported_by=user).update(is_hidden=False)
        print(f"✅ Unbanned {user.username} - restored all their issues")
    
    return Response({
        "message": f"User {'banned' if not user.is_active else 'unbanned'} successfully",
        "is_active": user.is_active
    })


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def verify_user(request, user_id):
    """Verify a user account"""
    user = get_object_or_404(User, id=user_id)
    user.is_verified = True
    user.save()
    
    return Response({
        'message': 'User verified successfully',
        'is_verified': user.is_verified
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    """Get current user information"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_account(request):
    user = request.user
    user.delete()
    return Response({"message": "Account deleted successfully"}, status=204)


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_dashboard_stats(request):
    """Get admin dashboard statistics"""
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    verified_users = User.objects.filter(is_verified=True).count()
    admin_users = User.objects.filter(user_type__in=['admin', 'moderator']).count()
    
    # Get user registration stats for the last 30 days
    from django.utils import timezone
    from datetime import timedelta
    
    thirty_days_ago = timezone.now() - timedelta(days=30)
    new_users_30_days = User.objects.filter(created_at__gte=thirty_days_ago).count()
    
    return Response({
        'total_users': total_users,
        'active_users': active_users,
        'verified_users': verified_users,
        'admin_users': admin_users,
        'new_users_30_days': new_users_30_days
    }) 