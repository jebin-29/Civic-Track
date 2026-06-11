from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

User = get_user_model()


class Category(models.Model):
    """Issue categories"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Issue(models.Model):
    """Main issue model"""
    
    STATUS_CHOICES = [
        ('reported', 'Reported'),
        ('progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
        ('rejected', 'Rejected'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='issues')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reported')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
      # Location
    location = models.CharField(max_length=500)  # Human readable address
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    spam_count = models.IntegerField(default=0)
    
    # Reporter
    reported_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='reported_issues',
        null=True,
        blank=True
    )
    is_anonymous = models.BooleanField(default=False)
    
    # Timestamps
    reported_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    # Additional fields
    estimated_resolution_time = models.PositiveIntegerField(
        blank=True, 
        null=True,
        help_text="Estimated resolution time in days"
    )
    actual_resolution_time = models.PositiveIntegerField(
        blank=True, 
        null=True,
        help_text="Actual resolution time in days"
    )

        # --- AI Analysis Fields (NEW) ---
    ai_issue_type = models.CharField(max_length=100, blank=True, null=True)
    ai_confidence = models.FloatField(blank=True, null=True)

    SEVERITY_CHOICES = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
    ('urgent', 'Urgent'),
    ]
    ai_severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, blank=True, null=True)

    ai_workers = models.PositiveIntegerField(blank=True, null=True)
    ai_time_required = models.CharField(max_length=50, blank=True, null=True)  # e.g. "2 hours", "1 day"
    ai_cost = models.PositiveIntegerField(blank=True, null=True)
    ai_trucks = models.PositiveIntegerField(blank=True, null=True, default=0)
    department = models.CharField(max_length=100, null=True, blank=True)

    AI_PRIORITY_CHOICES = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
    ('urgent', 'Urgent'),
    ]
    ai_priority = models.CharField(max_length=10, choices=AI_PRIORITY_CHOICES, blank=True, null=True)
    
    # Flags and moderation
    flags = models.PositiveIntegerField(default=0)
    is_hidden = models.BooleanField(default=False)
    moderation_notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'issues'
        ordering = ['-reported_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['reported_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        # Update resolved_at when status changes to resolved
        if self.status == 'resolved' and not self.resolved_at:
            self.resolved_at = timezone.now()
        
        # Calculate actual resolution time        if self.status == 'resolved' and self.resolved_at and self.reported_at:
            self.actual_resolution_time = (self.resolved_at - self.reported_at).days
        
        super().save(*args, **kwargs)

    def auto_escalate(self):
        if self.status != "resolved":
            days_open = (timezone.now() - self.reported_at).days

            if days_open >= 3 and self.ai_priority != "urgent":
                self.ai_priority = "urgent"
                self.save()
    
    def update_location(self, latitude, longitude, address):
        """Update issue location"""
        self.latitude = latitude
        self.longitude = longitude
        self.location = address
        self.save()
    
    def increment_flags(self):
        """Increment flag count"""
        self.flags += 1
        self.save()
    
    @property
    def reporter_name(self):
        """Get reporter name (anonymous or actual)"""
        if self.is_anonymous:
            return "Anonymous"
        return self.reported_by.username if self.reported_by else "Unknown"
    
    @property
    def is_urgent(self):
        """Check if issue is urgent based on priority"""
        return self.priority == 'urgent'
    
    @property
    def days_since_reported(self):
        """Calculate days since issue was reported"""
        return (timezone.now() - self.reported_at).days


class IssuePhoto(models.Model):
    """Photos attached to issues"""
    
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='issue_photos/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_primary = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'issue_photos'
        ordering = ['-is_primary', 'uploaded_at']
    
    def __str__(self):
        return f"Photo for {self.issue.title}"
    
    def save(self, *args, **kwargs):
        # Ensure only one primary photo per issue
        if self.is_primary:
            IssuePhoto.objects.filter(issue=self.issue, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)


class IssueComment(models.Model):
    """Comments on issues"""
    
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='issue_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_public = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'issue_comments'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.user.username} on {self.issue.title}"


class IssueUpdate(models.Model):
    """Status updates for issues"""
    
    UPDATE_TYPE_CHOICES = [
        ('status_change', 'Status Change'),
        ('priority_change', 'Priority Change'),
        ('assignment', 'Assignment'),
        ('note', 'Note'),
        ('resolution', 'Resolution'),
    ]
    
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='updates')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='issue_updates')
    update_type = models.CharField(max_length=20, choices=UPDATE_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Additional data for specific update types
    old_value = models.CharField(max_length=100, blank=True)
    new_value = models.CharField(max_length=100, blank=True)
    
    class Meta:
        db_table = 'issue_updates'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.update_type} update for {self.issue.title}"


class IssueAssignment(models.Model):
    """Assign issues to users (for admins/moderators)"""
    
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='assignments')
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_issues')
    assigned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignments_made')
    assigned_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'issue_assignments'
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.issue.title} assigned to {self.assigned_to.username}"


class IssueVote(models.Model):
    """Votes on issues (upvote/downvote)"""
    
    VOTE_CHOICES = [
        (1, 'Upvote'),
        (-1, 'Downvote'),
    ]
    
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='issue_votes')
    vote = models.SmallIntegerField(choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'issue_votes'
        unique_together = ['issue', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} voted {self.get_vote_display()} on {self.issue.title}"


class IssueFlag(models.Model):
    """Flags for inappropriate issues"""
    
    FLAG_REASON_CHOICES = [
        ('inappropriate', 'Inappropriate Content'),
        ('spam', 'Spam'),
        ('duplicate', 'Duplicate Issue'),
        ('false_information', 'False Information'),
        ('other', 'Other'),
    ]
    
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='flag_instances')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flags_submitted')
    reason = models.CharField(max_length=20, choices=FLAG_REASON_CHOICES)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='flags_resolved'
    )
    resolved_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'issue_flags'
        unique_together = ['issue', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Flag on {self.issue.title} by {self.user.username}" 