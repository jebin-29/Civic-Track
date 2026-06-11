from django.contrib import admin
from .models import Notification, NotificationPreference, NotificationTemplate


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'recipient', 'notification_type', 'title', 'is_read', 'created_at'
    ]
    list_filter = [
        'notification_type', 'is_read', 'created_at'
    ]
    search_fields = [
        'recipient__username', 'recipient__email', 'title', 'message'
    ]
    readonly_fields = ['created_at', 'read_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('recipient', 'notification_type', 'title', 'message')
        }),
        ('Content Object', {
            'fields': ('content_type', 'object_id'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Additional Data', {
            'fields': ('data',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(is_read=True, read_at=timezone.now())
        self.message_user(request, f'{updated} notifications marked as read.')
    mark_as_read.short_description = "Mark selected notifications as read"
    
    def mark_as_unread(self, request, queryset):
        updated = queryset.update(is_read=False, read_at=None)
        self.message_user(request, f'{updated} notifications marked as unread.')
    mark_as_unread.short_description = "Mark selected notifications as unread"


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'email_notifications', 'push_notifications',
        'notification_frequency', 'quiet_hours_enabled'
    ]
    list_filter = [
        'email_notifications', 'push_notifications', 'notification_frequency',
        'quiet_hours_enabled'
    ]
    search_fields = ['user__username', 'user__email']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Email Notifications', {
            'fields': (
                'email_notifications', 'email_issue_updates', 'email_comments',
                'email_assignments', 'email_system_messages'
            )
        }),
        ('Push Notifications', {
            'fields': (
                'push_notifications', 'push_issue_updates', 'push_comments',
                'push_assignments'
            )
        }),
        ('Settings', {
            'fields': (
                'notification_frequency', 'quiet_hours_enabled',
                'quiet_hours_start', 'quiet_hours_end'
            )
        }),
    )


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'notification_type', 'is_active', 'created_at'
    ]
    list_filter = [
        'notification_type', 'is_active', 'created_at'
    ]
    search_fields = ['name', 'title_template', 'message_template']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'notification_type', 'is_active')
        }),
        ('Templates', {
            'fields': ('title_template', 'message_template'),
            'description': 'Use Django template syntax. Available variables depend on notification type.'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['activate_templates', 'deactivate_templates']
    
    def activate_templates(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} templates activated.')
    activate_templates.short_description = "Activate selected templates"
    
    def deactivate_templates(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} templates deactivated.')
    deactivate_templates.short_description = "Deactivate selected templates" 