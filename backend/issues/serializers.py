from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Category, Issue, IssuePhoto, IssueComment, IssueUpdate,
    IssueAssignment, IssueVote, IssueFlag
)

User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'icon', 'color', 'is_active']


class IssuePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssuePhoto
        fields = ['id', 'image', 'caption', 'uploaded_at', 'is_primary']


class IssueCommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = IssueComment
        fields = ['id', 'user', 'content', 'created_at', 'updated_at', 'is_public']
        read_only_fields = ['user', 'created_at', 'updated_at']


# ── IssueUpdate LOG serializer (for the IssueUpdate model, NOT for patching Issue) ──
class IssueUpdateLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = IssueUpdate
        fields = [
            'id', 'user', 'update_type', 'title', 'description',
            'old_value', 'new_value', 'created_at'
        ]
        read_only_fields = ['user', 'created_at']


class IssueVoteSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = IssueVote
        fields = ['id', 'user', 'vote', 'created_at']
        read_only_fields = ['user', 'created_at']


class IssueFlagSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    resolved_by = serializers.StringRelatedField()

    class Meta:
        model = IssueFlag
        fields = [
            'id', 'user', 'reason', 'description', 'created_at',
            'is_resolved', 'resolved_by', 'resolved_at'
        ]
        read_only_fields = ['user', 'created_at', 'resolved_by', 'resolved_at']


class IssueSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    photos = IssuePhotoSerializer(many=True, read_only=True)
    comments = IssueCommentSerializer(many=True, read_only=True)
    votes = IssueVoteSerializer(many=True, read_only=True)
    flag_instances = IssueFlagSerializer(many=True, read_only=True)
    reporter_name = serializers.CharField(read_only=True)
    days_since_reported = serializers.IntegerField(read_only=True)
    has_flagged = serializers.SerializerMethodField()
    reported_by = serializers.SerializerMethodField()

    def get_has_flagged(self, obj):
        user = self.context.get('request', None)
        if user:
            user = user.user
        if user and user.is_authenticated:
            return IssueFlag.objects.filter(issue=obj, user=user).exists()
        return False
    
    def get_reported_by(self, obj):
        if obj.reported_by:
            return {
                "username": obj.reported_by.username,
                "email": obj.reported_by.email,
                "phone_number": getattr(obj.reported_by, "phone_number", None),
                "address": getattr(obj.reported_by, "address", None),
            }
        return None

    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'description', 'category', 'category_id',
            'status', 'priority', 'location', 'latitude', 'longitude',
            'reported_by', 'is_anonymous', 'reporter_name',
            'reported_at', 'updated_at', 'resolved_at',
            'estimated_resolution_time', 'actual_resolution_time',
            'flags', 'is_hidden', 'moderation_notes',
            'photos', 'comments', 'votes', 'flag_instances', 'has_flagged',
            'days_since_reported',
            'ai_issue_type', 'ai_severity', 'ai_priority', 'ai_confidence',
            'ai_cost', 'ai_time_required', 'ai_workers', 'ai_trucks', 'department',
        ]
        read_only_fields = [
            'id', 'reported_at', 'updated_at', 'resolved_at',
            'actual_resolution_time', 'flags', 'reporter_name',
            'days_since_reported'
        ]


class IssueCreateSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField()
    photos = serializers.ListField(
        child=serializers.ImageField(),
        required=False
    )
    latitude = serializers.FloatField(write_only=True)
    longitude = serializers.FloatField(write_only=True)

    class Meta:
        model = Issue
        fields = [
            'title', 'description', 'category_id', 'priority',
            'location', 'latitude', 'longitude', 'is_anonymous',
            'estimated_resolution_time', 'photos'
        ]

    def create(self, validated_data):
        photos = validated_data.pop('photos', [])
        latitude = validated_data.pop('latitude')
        longitude = validated_data.pop('longitude')
        category_id = validated_data.pop('category_id')

        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            raise serializers.ValidationError("Invalid category")

        issue = Issue.objects.create(
            category=category,
            latitude=latitude,
            longitude=longitude,
            **validated_data
        )

        for i, photo in enumerate(photos):
            IssuePhoto.objects.create(
                issue=issue,
                image=photo,
                is_primary=(i == 0)
            )

        return issue


# ── Owner PATCH serializer ─────────────────────────────────────────────────
class IssueEditSerializer(serializers.ModelSerializer):
    """Used when the issue owner PATCHes their own issue."""

    category_id = serializers.IntegerField(required=False)
    photos      = serializers.ListField(
        child=serializers.ImageField(),
        required=False
    )
    latitude    = serializers.FloatField(required=False)
    longitude   = serializers.FloatField(required=False)

    class Meta:
        model  = Issue
        fields = [
            'title', 'description', 'category_id',
            'location', 'latitude', 'longitude',
            'is_anonymous', 'photos',
        ]

    def update(self, instance, validated_data):
        photos      = validated_data.pop('photos',      None)
        category_id = validated_data.pop('category_id', None)
        latitude    = validated_data.pop('latitude',    None)
        longitude   = validated_data.pop('longitude',   None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if category_id is not None:
            try:
                instance.category = Category.objects.get(id=category_id)
            except Category.DoesNotExist:
                raise serializers.ValidationError({'category_id': 'Invalid category'})

        if latitude  is not None:
            instance.latitude  = latitude
        if longitude is not None:
            instance.longitude = longitude

        instance.save()

        if photos:
            for photo in photos:
                IssuePhoto.objects.create(issue=instance, image=photo, is_primary=False)

        return instance


# ── Admin status/priority update serializer ───────────────────────────────
class IssueFieldUpdateSerializer(serializers.ModelSerializer):
    """Used by admin to update status, priority, notes etc."""

    class Meta:
        model = Issue
        fields = [
            'title', 'description', 'status', 'priority',
            'estimated_resolution_time', 'moderation_notes'
        ]


class IssueDetailSerializer(IssueSerializer):
    # Reference the LOG serializer (IssueUpdateLogSerializer), not the old name
    updates       = IssueUpdateLogSerializer(many=True, read_only=True)
    assignments   = serializers.SerializerMethodField()
    primary_photo = serializers.SerializerMethodField()

    class Meta(IssueSerializer.Meta):
        fields = IssueSerializer.Meta.fields + ['updates', 'assignments', 'primary_photo', 'reported_by']

    def get_primary_photo(self, obj):
        request = self.context.get('request')
        photo = obj.photos.filter(is_primary=True).first()
        if photo and photo.image:
            return request.build_absolute_uri(photo.image.url)
        return None

    def get_assignments(self, obj):
        return [
            {
                'id': a.id,
                'assigned_to': a.assigned_to.username,
                'assigned_by': a.assigned_by.username,
                'assigned_at': a.assigned_at,
                'due_date':    a.due_date,
                'notes':       a.notes
            }
            for a in obj.assignments.filter(is_active=True)
        ]


class IssueListSerializer(serializers.ModelSerializer):
    category            = CategorySerializer(read_only=True)
    primary_photo       = serializers.SerializerMethodField()
    reporter_name       = serializers.CharField(read_only=True)
    days_since_reported = serializers.IntegerField(read_only=True)
    vote_count          = serializers.SerializerMethodField()
    distance_km         = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'description', 'category', 'status',
            'location', 'latitude', 'longitude', 'reported_by',
            'reported_at', 'updated_at', 'is_anonymous', 'reporter_name',
            'primary_photo', 'days_since_reported', 'vote_count', 'distance_km', 'flags',
            'ai_issue_type', 'ai_confidence', 'ai_severity', 'ai_priority',
            'ai_workers', 'ai_time_required', 'ai_cost', 'ai_trucks', 'department',
        ]

    def get_primary_photo(self, obj):
        photo = obj.photos.filter(is_primary=True).first()
        return photo.image.url if photo else None

    def get_vote_count(self, obj):
        return obj.votes.count()

    def get_distance_km(self, obj):
        return getattr(obj, 'distance_km', None)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request else None
        if not (user and (user.is_staff or user.is_superuser)):
            for f in ['ai_issue_type','ai_confidence','ai_severity','ai_priority',
                      'ai_workers','ai_time_required','ai_cost','ai_trucks']:
                data.pop(f, None)
        return data


class AdminIssueSerializer(serializers.ModelSerializer):
    category       = CategorySerializer(read_only=True)
    reported_by    = serializers.StringRelatedField()
    photos         = IssuePhotoSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    votes_count    = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id', 'title', 'description', 'category', 'status', 'priority',
            'location', 'reported_by', 'is_anonymous', 'reported_at',
            'updated_at', 'resolved_at', 'flags', 'is_hidden',
            'ai_issue_type', 'ai_severity', 'ai_workers', 'ai_time_required',
            'ai_cost', 'ai_trucks', 'ai_priority', 'department',
            'photos', 'comments_count', 'votes_count'
        ]

    def get_comments_count(self, obj):
        return obj.comments.filter(is_public=True).count()

    def get_votes_count(self, obj):
        return obj.votes.filter(vote=1).count() - obj.votes.filter(vote=-1).count()


class IssueAssignmentSerializer(serializers.ModelSerializer):
    assigned_to = serializers.StringRelatedField()
    assigned_by = serializers.StringRelatedField()
    issue       = serializers.StringRelatedField()

    class Meta:
        model = IssueAssignment
        fields = [
            'id', 'issue', 'assigned_to', 'assigned_by',
            'assigned_at', 'due_date', 'notes', 'is_active'
        ]
        read_only_fields = ['assigned_by', 'assigned_at']


class CreateCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueComment
        fields = ['content', 'is_public']


class CreateVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueVote
        fields = ['vote']


class CreateFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueFlag
        fields = ['reason', 'description']


class IssueStatsSerializer(serializers.Serializer):
    total_issues        = serializers.IntegerField()
    reported_issues     = serializers.IntegerField()
    in_progress_issues  = serializers.IntegerField()
    resolved_issues     = serializers.IntegerField()
    urgent_issues       = serializers.IntegerField()
    flagged_issues      = serializers.IntegerField()
    avg_resolution_time = serializers.FloatField()
    issues_by_category  = serializers.DictField()
    issues_by_status    = serializers.DictField()