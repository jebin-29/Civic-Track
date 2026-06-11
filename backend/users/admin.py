from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, UserSession


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'user_type', 'is_active', 'is_verified', 'created_at')
    list_filter = ('user_type', 'is_active', 'is_verified', 'created_at')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Civic Zone Connect', {
            'fields': ('user_type', 'phone_number', 'address', 'profile_picture', 'is_verified', 'date_of_birth')
        }),
        ('Privacy Settings', {
            'fields': ('allow_anonymous_reports', 'allow_notifications', 'allow_location_sharing')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Civic Zone Connect', {
            'fields': ('user_type', 'phone_number', 'email')
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_reports', 'total_resolved_issues', 'reputation_score', 'last_active')
    list_filter = ('reputation_score', 'last_active')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('total_reports', 'total_resolved_issues', 'reputation_score', 'last_active')


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'ip_address', 'created_at', 'last_activity', 'is_active')
    list_filter = ('is_active', 'created_at', 'last_activity')
    search_fields = ('user__username', 'ip_address')
    readonly_fields = ('session_key', 'created_at', 'last_activity')


admin.site.register(User, UserAdmin) 