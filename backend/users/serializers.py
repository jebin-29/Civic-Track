from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'user_type', 'phone_number', 'address', 'profile_picture',
            'is_verified', 'date_of_birth', 'created_at', 'updated_at',
            'allow_anonymous_reports', 'allow_notifications', 'allow_location_sharing'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'bio', 'preferred_categories', 'total_reports', 'total_resolved_issues', 'reputation_score', 'last_active']
        read_only_fields = ['id', 'total_reports', 'total_resolved_issues', 'reputation_score', 'last_active']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name', 'phone_number']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        email = attrs.get('email')
        if email and User.objects.filter(email=email, is_active=False).exists():
            raise serializers.ValidationError("This email belongs to a suspended account.")
        username = attrs.get('username')
        if username and User.objects.filter(username=username, is_active=False).exists():
            raise serializers.ValidationError("This username belongs to a suspended account.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if not username or not password:
            raise serializers.ValidationError('Must include username and password')

        # Check if user exists and is banned FIRST
        try:
            user_obj = User.objects.get(username=username)
            if not user_obj.is_active:
                raise serializers.ValidationError('Your account has been banned due to spam or policy violations.')
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials')

        # Now authenticate
        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError('Invalid credentials')

        attrs['user'] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_new_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect')
        return value


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone_number', 'address', 'profile_picture', 'allow_anonymous_reports', 'allow_notifications', 'allow_location_sharing']


class AdminUserSerializer(serializers.ModelSerializer):
    reports = serializers.SerializerMethodField()
    flags = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'user_type', 'is_active', 'is_verified', 'created_at', 'status', 'reports', 'flags']
        read_only_fields = ['id', 'created_at']

    def get_status(self, obj):
        return "active" if obj.is_active else "banned"

    def get_reports(self, obj):
        try:
            return obj.profile.total_reports
        except Exception:
            return 0

    def get_flags(self, obj):
        return 0