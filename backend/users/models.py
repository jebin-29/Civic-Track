from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model for Civic Zone Connect"""
    
    USER_TYPE_CHOICES = [
        ('user', 'Regular User'),
        ('admin', 'Administrator'),
        ('moderator', 'Moderator'),
    ]
    
    email = models.EmailField(unique=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='user')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    date_of_birth = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Privacy settings
    allow_anonymous_reports = models.BooleanField(default=False)
    allow_notifications = models.BooleanField(default=True)
    allow_location_sharing = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.username
    
    @property
    def is_admin(self):
        return self.user_type in ['admin', 'moderator']
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username


class UserProfile(models.Model):
    """Extended user profile information"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    preferred_categories = models.JSONField(default=list, blank=True)
    total_reports = models.PositiveIntegerField(default=0)
    total_resolved_issues = models.PositiveIntegerField(default=0)
    reputation_score = models.IntegerField(default=0)
    last_active = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
    
    def __str__(self):
        return f"Profile of {self.user.username}"
    
    def update_location(self, latitude, longitude):
        """Update user location"""
        self.latitude = latitude
        self.longitude = longitude
        self.save()
    
    def increment_reports(self):
        """Increment total reports count"""
        self.total_reports += 1
        self.save()
    
    def increment_resolved_issues(self):
        """Increment resolved issues count"""
        self.total_resolved_issues += 1
        self.save()


class UserSession(models.Model):
    """Track user sessions and activity"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'user_sessions'
    
    def __str__(self):
        return f"Session for {self.user.username} - {self.created_at}"