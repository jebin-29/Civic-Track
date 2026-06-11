from django.contrib import admin
from .models import (
    Category, Issue, IssuePhoto, IssueComment, IssueUpdate,
    IssueAssignment, IssueVote, IssueFlag
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']


class IssuePhotoInline(admin.TabularInline):
    model = IssuePhoto
    extra = 1
    fields = ['image', 'caption', 'is_primary']


class IssueCommentInline(admin.TabularInline):
    model = IssueComment
    extra = 0
    readonly_fields = ['created_at', 'updated_at']
    fields = ['user', 'content', 'is_public', 'created_at']


class IssueUpdateInline(admin.TabularInline):
    model = IssueUpdate
    extra = 0
    readonly_fields = ['created_at']
    fields = ['user', 'update_type', 'title', 'description', 'created_at']


class IssueAssignmentInline(admin.TabularInline):
    model = IssueAssignment
    extra = 0
    readonly_fields = ['assigned_at']
    fields = ['assigned_to', 'assigned_by', 'assigned_at', 'due_date', 'notes', 'is_active']


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'category', 'status', 'priority', 'reporter_name',
        'reported_at', 'flags', 'is_hidden'
    ]
    list_filter = [
        'status', 'priority', 'category', 'is_hidden', 'is_anonymous',
        'reported_at', 'updated_at'
    ]
    search_fields = ['title', 'description', 'location', 'reported_by__username']
    readonly_fields = [
        'reported_at', 'updated_at', 'resolved_at', 'actual_resolution_time',
        'days_since_reported'
    ]
    date_hierarchy = 'reported_at'
    ordering = ['-reported_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'category', 'status', 'priority')
        }),
        ('Location', {
            'fields': ('location', 'coordinates')
        }),
        ('Reporter', {
            'fields': ('reported_by', 'is_anonymous')
        }),
        ('Timestamps', {
            'fields': ('reported_at', 'updated_at', 'resolved_at'),
            'classes': ('collapse',)
        }),
        ('Resolution', {
            'fields': ('estimated_resolution_time', 'actual_resolution_time'),
            'classes': ('collapse',)
        }),
        ('Moderation', {
            'fields': ('flags', 'is_hidden', 'moderation_notes'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [
        IssuePhotoInline,
        IssueCommentInline,
        IssueUpdateInline,
        IssueAssignmentInline,
    ]
    
    actions = ['mark_as_resolved', 'mark_as_in_progress', 'hide_issues', 'show_issues']
    
    def mark_as_resolved(self, request, queryset):
        updated = queryset.update(status='resolved')
        self.message_user(request, f'{updated} issues marked as resolved.')
    mark_as_resolved.short_description = "Mark selected issues as resolved"
    
    def mark_as_in_progress(self, request, queryset):
        updated = queryset.update(status='progress')
        self.message_user(request, f'{updated} issues marked as in progress.')
    mark_as_in_progress.short_description = "Mark selected issues as in progress"
    
    def hide_issues(self, request, queryset):
        updated = queryset.update(is_hidden=True)
        self.message_user(request, f'{updated} issues hidden.')
    hide_issues.short_description = "Hide selected issues"
    
    def show_issues(self, request, queryset):
        updated = queryset.update(is_hidden=False)
        self.message_user(request, f'{updated} issues shown.')
    show_issues.short_description = "Show selected issues"


@admin.register(IssuePhoto)
class IssuePhotoAdmin(admin.ModelAdmin):
    list_display = ['issue', 'caption', 'is_primary', 'uploaded_at']
    list_filter = ['is_primary', 'uploaded_at']
    search_fields = ['issue__title', 'caption']
    readonly_fields = ['uploaded_at']


@admin.register(IssueComment)
class IssueCommentAdmin(admin.ModelAdmin):
    list_display = ['issue', 'user', 'content_preview', 'is_public', 'created_at']
    list_filter = ['is_public', 'created_at']
    search_fields = ['issue__title', 'user__username', 'content']
    readonly_fields = ['created_at', 'updated_at']
    
    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content'


@admin.register(IssueUpdate)
class IssueUpdateAdmin(admin.ModelAdmin):
    list_display = ['issue', 'user', 'update_type', 'title', 'created_at']
    list_filter = ['update_type', 'created_at']
    search_fields = ['issue__title', 'user__username', 'title']
    readonly_fields = ['created_at']


@admin.register(IssueAssignment)
class IssueAssignmentAdmin(admin.ModelAdmin):
    list_display = ['issue', 'assigned_to', 'assigned_by', 'assigned_at', 'is_active']
    list_filter = ['is_active', 'assigned_at']
    search_fields = ['issue__title', 'assigned_to__username', 'assigned_by__username']
    readonly_fields = ['assigned_at']


@admin.register(IssueVote)
class IssueVoteAdmin(admin.ModelAdmin):
    list_display = ['issue', 'user', 'vote', 'created_at']
    list_filter = ['vote', 'created_at']
    search_fields = ['issue__title', 'user__username']
    readonly_fields = ['created_at']


@admin.register(IssueFlag)
class IssueFlagAdmin(admin.ModelAdmin):
    list_display = ['issue', 'user', 'reason', 'is_resolved', 'created_at']
    list_filter = ['reason', 'is_resolved', 'created_at']
    search_fields = ['issue__title', 'user__username', 'description']
    readonly_fields = ['created_at', 'resolved_at'] 