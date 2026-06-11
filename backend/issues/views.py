from rest_framework import status, generics, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg
import base64, io
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Category, Issue, IssuePhoto, IssueComment, IssueUpdate,
    IssueAssignment, IssueVote, IssueFlag
)
from .serializers import (
    CategorySerializer,
    IssueSerializer,
    IssueCreateSerializer,
    IssueEditSerializer,          
    IssueFieldUpdateSerializer,   
    IssueDetailSerializer,
    IssueListSerializer,
    AdminIssueSerializer,
    IssueCommentSerializer,
    CreateCommentSerializer,
    CreateVoteSerializer,
    CreateFlagSerializer,
    IssueStatsSerializer,
    IssueAssignmentSerializer,
)
from django.contrib.auth import get_user_model
import requests as http_requests
# from google import genai
# from google.genai import types
# import json
# from PIL import Image
#from inference_sdk import InferenceHTTPClient
from django.conf import settings
from .models import Issue
import os
import math
User = get_user_model()

# gemini_client = genai.Client(api_key="AIzaSyBEf7_GRt-203p4mYSw9h-tn1c8F69JVxU")



# ── KNOWN HIGH-PRIORITY LOCATIONS (Coimbatore) ──────────────────────
HIGH_PRIORITY_LOCATIONS = [
    # Hospitals
    {"name": "PSG Hospital",         "lat": 11.0168, "lng": 77.0015},
    {"name": "Coimbatore Medical",   "lat": 11.0000, "lng": 76.9700},
    {"name": "KMCH",                 "lat": 11.0263, "lng": 76.9794},
    {"name": "Sri Ramakrishna",      "lat": 11.0200, "lng": 76.9800},
    # Airports
    {"name": "Coimbatore Airport",   "lat": 11.0300, "lng": 77.0434},
    # Schools / Colleges
    {"name": "PSG Tech",             "lat": 11.0232, "lng": 77.0001},
    {"name": "Coimbatore Institute", "lat": 11.0600, "lng": 76.9800},
    # Government
    {"name": "Collectorate",         "lat": 11.0168, "lng": 76.9558},
    {"name": "Coimbatore Railway",   "lat": 11.0000, "lng": 76.9694},
]

def run_roboflow_workflow(image_path: str) -> list:
    """Call Roboflow serverless API directly — no heavy SDK needed."""
    try:
        with open(image_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode("utf-8")

        resp = http_requests.post(
            "https://serverless.roboflow.com/jebin-g72td/detect-count-and-visualize",
            params={"api_key": os.environ.get("ROBOFLOW_API_KEY", "3O5Kwl6qF8yz6wPUaVN9")},
            json={"image": {"type": "base64", "value": img_b64}},
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("predictions", {}).get("predictions", [])
    except Exception as e:
        print("❌ Roboflow HTTP error:", e)
        return []


def is_near_critical_location(lat, lng, radius_km=1.5):
    """Check if issue is within radius_km of any critical location"""
    if not lat or not lng:
        return False
    try:
        for loc in HIGH_PRIORITY_LOCATIONS:
            dist = haversine_distance(float(lat), float(lng), loc["lat"], loc["lng"])
            if dist <= radius_km:
                print(f"⚠️ Near critical location: {loc['name']} ({dist:.2f}km)")
                return True
    except:
        pass
    return False


def calculate_severity_from_confidence(ai_conf, impact_ratio):
    """Calculate severity based on AI confidence and bounding box size"""
    if impact_ratio > 0.45 and ai_conf > 0.85:
        return "urgent"
    elif impact_ratio > 0.28 and ai_conf > 0.70:
        return "high"
    elif impact_ratio > 0.12:
        return "medium"
    else:
        return "low"


def calculate_resources(issue_type, severity):
    """
    Accurate resource matrix per issue type and severity.
    Time = hours, Cost = Indian Rupees
    """
    resource_matrix = {
        "Garbage": {
            "low":    {"workers": 1, "time": "15 mins",  "cost": 150,  "trucks": 0},
            "medium": {"workers": 2, "time": "30 mins",  "cost": 350,  "trucks": 0},
            "high":   {"workers": 3, "time": "45 mins",  "cost": 700,  "trucks": 1},
            "urgent": {"workers": 4, "time": "1 hr",     "cost": 1200, "trucks": 1},
        },
        "Pothole": {
            "low":    {"workers": 2, "time": "2 hrs",    "cost": 4000,  "trucks": 0},
            "medium": {"workers": 4, "time": "4 hrs",    "cost": 9000,  "trucks": 1},
            "high":   {"workers": 6, "time": "7 hrs",    "cost": 18000, "trucks": 1},
            "urgent": {"workers": 9, "time": "10 hrs",   "cost": 30000, "trucks": 2},
        },
        "Road Damage": {
            "low":    {"workers": 2, "time": "2 hrs",    "cost": 4000,  "trucks": 0},
            "medium": {"workers": 4, "time": "4 hrs",    "cost": 9000,  "trucks": 1},
            "high":   {"workers": 6, "time": "7 hrs",    "cost": 18000, "trucks": 1},
            "urgent": {"workers": 9, "time": "10 hrs",   "cost": 30000, "trucks": 2},
        },
        "Streetlight": {
            "low":    {"workers": 1, "time": "15 mins",  "cost": 200,  "trucks": 0},
            "medium": {"workers": 2, "time": "30 mins",  "cost": 400,  "trucks": 0},
            "high":   {"workers": 2, "time": "45 mins",  "cost": 600,  "trucks": 0},
            "urgent": {"workers": 3, "time": "1 hr",     "cost": 1000, "trucks": 0},
        },
        "Sewage": {
            "low":    {"workers": 1, "time": "30 mins",  "cost": 300,  "trucks": 0},
            "medium": {"workers": 1, "time": "1 hr",     "cost": 600,  "trucks": 0},
            "high":   {"workers": 2, "time": "2 hrs",    "cost": 1000, "trucks": 0},
            "urgent": {"workers": 3, "time": "3 hrs",    "cost": 1500, "trucks": 1},
        },
        "Water Leakage": {
            "low":    {"workers": 1, "time": "30 mins",  "cost": 300,  "trucks": 0},
            "medium": {"workers": 1, "time": "1 hr",     "cost": 600,  "trucks": 0},
            "high":   {"workers": 2, "time": "2 hrs",    "cost": 1000, "trucks": 0},
            "urgent": {"workers": 3, "time": "3 hrs",    "cost": 1500, "trucks": 1},
        },
        "General Issue": {
            "low":    {"workers": 1, "time": "30 mins",  "cost": 300,  "trucks": 0},
            "medium": {"workers": 1, "time": "1 hr",     "cost": 600,  "trucks": 0},
            "high":   {"workers": 2, "time": "2 hrs",    "cost": 1000, "trucks": 0},
            "urgent": {"workers": 3, "time": "3 hrs",    "cost": 1500, "trucks": 1},
        },
    }

    # Normalize issue_type (Roboflow returns lowercase sometimes)
    normalized = {
        "garbage": "Garbage", "pothole": "Pothole",
        "road damage": "Road Damage", "road_damage": "Road Damage",
        "streetlight": "Streetlight", "street light": "Streetlight",
        "sewage": "Sewage", "drainage": "Sewage",
        "water leakage": "Water Leakage", "water_leakage": "Water Leakage",
        "general issue": "General Issue",
    }
    issue_key = normalized.get(issue_type.lower(), issue_type)
    default = {"workers": 3, "time": 2, "cost": 4000, "trucks": 1}
    return resource_matrix.get(issue_key, {"low": default, "medium": default, "high": default, "urgent": default}).get(severity, default)


def assign_department(issue_type):
    # Normalize to lowercase for matching
    issue_lower = issue_type.lower().strip()
    
    mapping = {
        "garbage":       "Sanitation Department",
        "pothole":       "Road Maintenance Department",
        "road damage":   "Road Maintenance Department",
        "road_damage":   "Road Maintenance Department",
        "streetlight":   "Electrical Department",
        "street light":  "Electrical Department",
        "sewage":        "Drainage Department",
        "drainage":      "Drainage Department",
        "water leakage": "Water Supply Department",
        "water_leakage": "Water Supply Department",
        "water":         "Water Supply Department",
        "general issue": "General Civic Department",
    }
    
    # Direct match first
    if issue_lower in mapping:
        return mapping[issue_lower]
    
    # Partial match fallback
    if "garbage" in issue_lower:   return "Sanitation Department"
    if "pothole" in issue_lower:   return "Road Maintenance Department"
    if "road" in issue_lower:      return "Road Maintenance Department"
    if "light" in issue_lower:     return "Electrical Department"
    if "sewage" in issue_lower:    return "Drainage Department"
    if "drain" in issue_lower:     return "Drainage Department"
    if "water" in issue_lower:     return "Water Supply Department"
    
    return "General Civic Department"

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r


class CategoryListView(generics.ListAPIView):
    """List all active categories"""
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = Category.objects.filter(is_active=True)
    pagination_class = None  # Disable pagination for categories


class IssueListView(generics.ListAPIView):
    """List issues with filtering and search"""
    serializer_class = IssueListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'category']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['reported_at', 'updated_at', 'priority']
    ordering = ['-reported_at']
    
    def get_queryset(self):
        queryset = Issue.objects.filter(is_hidden=False)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by category
        category_filter = self.request.query_params.get('category', None)
        if category_filter:
            # Try to find category by name first
            try:
                category = Category.objects.get(name__iexact=category_filter)
                queryset = queryset.filter(category=category)
            except Category.DoesNotExist:
                # If not found by name, try by ID
                queryset = queryset.filter(category_id=category_filter)
        
        # Filter by location (nearby issues) - accurate distance calculation
        lat = self.request.query_params.get('lat', None)
        lng = self.request.query_params.get('lng', None)
        radius = self.request.query_params.get('radius', 10)  # Default 10km
        
        if lat and lng:
            try:
                user_lat = float(lat)
                user_lng = float(lng)
                radius_km = float(radius)
                
                # First, get all issues with coordinates
                issues_with_coords = queryset.filter(
                    latitude__isnull=False,
                    longitude__isnull=False
                )
                
                # Filter issues within the specified radius using Haversine formula
                nearby_issues = []
                for issue in issues_with_coords:
                    distance = haversine_distance(
                        user_lat, user_lng,
                        float(issue.latitude), float(issue.longitude)
                    )
                    if distance <= radius_km:
                        # Add distance to issue for frontend display
                        issue.distance_km = round(distance, 1)
                        nearby_issues.append(issue)
                
                # Return filtered queryset
                issue_ids = [issue.id for issue in nearby_issues]
                queryset = queryset.filter(id__in=issue_ids)
                
            except (ValueError, TypeError):
                pass

        for issue in queryset:
            issue.auto_escalate()
        
        return queryset


class IssueCreateView(APIView):
    """Create a new issue"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = IssueCreateSerializer(data=request.data)
        if serializer.is_valid():
            issue = serializer.save(reported_by=request.user)

            try:
                primary_photo = issue.photos.filter(is_primary=True).first()
                if primary_photo and primary_photo.image:
                    image_path = primary_photo.image.path
                    predictions = run_roboflow_workflow(image_path)
                    if predictions:
                        top_pred = predictions[0]
                        ai_class = top_pred.get("class", "General Issue")
                        ai_conf = top_pred.get("confidence", 0.75)
                        bbox_width = top_pred.get("width", 0)
                        bbox_height = top_pred.get("height", 0)
                        image_width = top_pred.get("image_width", 640)
                        image_height = top_pred.get("image_height", 640)
                        impact_ratio = 0
                        if image_width and image_height:
                            impact_ratio = (bbox_width * bbox_height) / (image_width * image_height)
                        if impact_ratio > 0.40 and ai_conf > 0.9:
                            severity = "urgent"
                            priority = "urgent"
                        elif impact_ratio > 0.25:
                            severity = "high"
                            priority = "high"
                        elif impact_ratio > 0.10:
                            severity = "medium"
                            priority = "high"
                        else:
                            severity = "low"
                            priority = "medium"
                        issue.ai_issue_type = ai_class
                        issue.ai_confidence = ai_conf
                        issue.ai_severity = severity
                        issue.ai_priority = priority
                        resources = calculate_resources(ai_class, severity)
                        issue.ai_workers = resources["workers"]
                        issue.ai_time_required = resources["time"]
                        issue.ai_cost = resources["cost"]
                        issue.ai_trucks = resources["trucks"]
                        issue.department = assign_department(ai_class)
                        issue.save()
                        print("✅ Roboflow detection:", ai_class, severity)
                    else:
                        issue.ai_issue_type = "General Issue"
                        issue.ai_severity = "medium"
                        issue.ai_priority = "medium"
                        issue.ai_workers = 3
                        issue.ai_time_required = 2
                        issue.ai_cost = 5000
                        issue.ai_trucks = 1
                        issue.department = "General Civic Department"
                        issue.save()
            except Exception as e:
                print("❌ Roboflow error:", e)
                issue.ai_issue_type = "General Issue"
                issue.ai_severity = "medium"
                issue.ai_priority = "medium"
                issue.ai_workers = 3
                issue.ai_time_required = 2
                issue.ai_cost = 5000
                issue.ai_trucks = 1
                issue.department = "General Civic Department"
                issue.save()

            try:
                profile = request.user.profile
                profile.increment_reports()
            except:
                pass

            IssueUpdate.objects.create(
                issue=issue,
                user=request.user,
                update_type='status_change',
                title='Issue Reported',
                description='Issue has been reported and is under review',
                new_value='reported'
            )

            return Response(
                IssueSerializer(issue, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IssueDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset           = Issue.objects.filter(is_hidden=False)
 
    def get_serializer_context(self):
        return {'request': self.request}
 
    def get_serializer_class(self):
        # IssueEditSerializer for writes, IssueDetailSerializer for reads
        if self.request.method in ('PATCH', 'PUT'):
            return IssueEditSerializer
        return IssueDetailSerializer
 
    def update(self, request, *args, **kwargs):
        issue = self.get_object()
        if issue.reported_by != request.user:
            return Response({"error": "Not allowed"}, status=403)
 
        # Validate + save with IssueEditSerializer (accepts our FormData fields)
        serializer = IssueEditSerializer(issue, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_issue = serializer.save()
 
        # ✅ Respond with IssueDetailSerializer — it knows how to handle
        #    RelatedManagers (photos, comments, votes etc.) correctly
        return Response(
            IssueDetailSerializer(updated_issue, context={'request': request}).data
        )


class IssueUpdateView(APIView):
    """Update issue (admin only)"""
    permission_classes = [permissions.IsAdminUser]
 
    def put(self, request, pk):
        issue = get_object_or_404(Issue, pk=pk)
        serializer = IssueFieldUpdateSerializer(issue, data=request.data, partial=True)
 
        if serializer.is_valid():
            old_status   = issue.status
            old_priority = issue.priority
            issue = serializer.save()
 
            if old_status != issue.status:
                IssueUpdate.objects.create(
                    issue=issue, user=request.user,
                    update_type='status_change',
                    title=f'Status changed to {issue.get_status_display()}',
                    description=f'Status updated from {old_status} to {issue.status}',
                    old_value=old_status, new_value=issue.status
                )
            if old_priority != issue.priority:
                IssueUpdate.objects.create(
                    issue=issue, user=request.user,
                    update_type='priority_change',
                    title=f'Priority changed to {issue.get_priority_display()}',
                    description=f'Priority updated from {old_priority} to {issue.priority}',
                    old_value=old_priority, new_value=issue.priority
                )
 
            return Response(IssueSerializer(issue).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class MyIssuesView(generics.ListAPIView):
    """Get issues reported by current user"""
    serializer_class = IssueListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Issue.objects.filter(
            reported_by=self.request.user,
            is_hidden=False
        ).order_by('-reported_at')


class IssueCommentView(APIView):
    """Add comment to issue"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        issue = get_object_or_404(Issue, pk=pk)
        serializer = CreateCommentSerializer(data=request.data)
        
        if serializer.is_valid():
            comment = serializer.save(
                issue=issue,
                user=request.user
            )
            return Response(
                IssueCommentSerializer(comment).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IssueVoteView(APIView):
    """Vote on issue"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        issue = get_object_or_404(Issue, pk=pk)
        serializer = CreateVoteSerializer(data=request.data)
        
        if serializer.is_valid():
            vote_value = serializer.validated_data['vote']
            
            # Check if user already voted
            existing_vote = IssueVote.objects.filter(
                issue=issue,
                user=request.user
            ).first()
            
            if existing_vote:
                if existing_vote.vote == vote_value:
                    # Remove vote if same vote
                    existing_vote.delete()
                else:
                    # Update vote
                    existing_vote.vote = vote_value
                    existing_vote.save()
            else:
                # Create new vote
                IssueVote.objects.create(
                    issue=issue,
                    user=request.user,
                    vote=vote_value
                )

            # --- AUTO ESCALATE BASED ON VOTES ---
            vote_count = issue.votes.filter(vote=1).count()

            if vote_count >= 10 and issue.ai_priority != "urgent":
                issue.ai_priority = "urgent"
                issue.save()
            
            return Response({'message': 'Vote recorded successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IssueFlagView(APIView):
    """Flag an issue"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        issue = get_object_or_404(Issue, pk=pk)
        serializer = CreateFlagSerializer(data=request.data)
        
        if serializer.is_valid():
            # Check if user already flagged
            existing_flag = IssueFlag.objects.filter(
                issue=issue,
                user=request.user
            ).first()
            
            if existing_flag:
                return Response(
                    {'error': 'You have already flagged this issue'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            flag = serializer.save(
                issue=issue,
                user=request.user
            )
            
            # Increment issue flag count
            issue.increment_flags()

            # --- AUTO ESCALATE BASED ON FLAGS ---
            if issue.flags >= 5 and issue.ai_priority != "urgent":
                issue.ai_priority = "urgent"
                issue.save()
            
            return Response(
                {'message': 'Issue flagged successfully'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Admin Views
class AdminIssueListView(generics.ListAPIView):
    """Admin view to list all issues"""
    serializer_class = AdminIssueSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'category', 'is_hidden']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['reported_at', 'updated_at', 'flags']
    ordering = ['-reported_at']
    
    def get_queryset(self):
        queryset = Issue.objects.all()

        # Hide/show logic
        show_hidden = self.request.query_params.get('show_hidden', 'false').lower() == 'true'
        if show_hidden:
            queryset = queryset.filter(is_hidden=True)
        else:
            queryset = queryset.filter(is_hidden=False)

        return queryset


class AdminIssueDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin view to manage individual issues"""
    serializer_class = AdminIssueSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Issue.objects.all()
    
    def perform_destroy(self, instance):
        # Soft delete - just hide the issue
        instance.is_hidden = True
        instance.save()

@api_view(['GET'])
@permission_classes([AllowAny]) 
def public_stats(request):
    total_issues = Issue.objects.count()
    resolved_issues = Issue.objects.filter(status='resolved').count()

    resolution_rate = 0
    if total_issues > 0:
        resolution_rate = round((resolved_issues / total_issues) * 100)

    active_users = User.objects.filter(is_active=True).count()

    # simple placeholder for now
    avg_response_time = "< 4h"

    return Response({
        "issues_resolved": resolved_issues,
        "resolution_rate": resolution_rate,
        "avg_response_time": avg_response_time,
        "active_citizens": active_users
    })


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def toggle_issue_visibility(request, pk):
    """Toggle issue visibility (hide/show)"""
    issue = get_object_or_404(Issue, pk=pk)
    issue.is_hidden = not issue.is_hidden
    issue.save()
    
    return Response({
        'message': f'Issue {"hidden" if issue.is_hidden else "shown"} successfully',
        'is_hidden': issue.is_hidden
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def report_spam(request, pk):
    issue = get_object_or_404(Issue, pk=pk)

    issue.increment_flags()

    if issue.flags >= 3:
        issue.is_hidden = True

    issue.save()

    return Response({"message": "Reported as spam"}, status=200)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def unflag_issue(request, pk):
    issue = get_object_or_404(Issue, pk=pk)
    flag = IssueFlag.objects.filter(issue=issue, user=request.user).first()
    if not flag:
        return Response({"error": "You have not flagged this issue"}, status=400)
    flag.delete()
    issue.flags = max(0, issue.flags - 1)
    issue.save()
    return Response({"message": "Flag removed successfully"})


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def assign_issue(request, pk):
    """Assign issue to a user"""
    issue = get_object_or_404(Issue, pk=pk)
    assigned_to_id = request.data.get('assigned_to')
    due_date = request.data.get('due_date')
    notes = request.data.get('notes', '')
    
    if not assigned_to_id:
        return Response(
            {'error': 'assigned_to is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        assigned_to = User.objects.get(id=assigned_to_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid user ID'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Deactivate existing assignments
    IssueAssignment.objects.filter(issue=issue, is_active=True).update(is_active=False)
    
    # Create new assignment
    assignment = IssueAssignment.objects.create(
        issue=issue,
        assigned_to=assigned_to,
        assigned_by=request.user,
        due_date=due_date,
        notes=notes
    )
    
    # Create update record
    IssueUpdate.objects.create(
        issue=issue,
        user=request.user,
        update_type='assignment',
        title=f'Assigned to {assigned_to.username}',
        description=f'Issue assigned to {assigned_to.username}',
        new_value=assigned_to.username
    )
    
    return Response({
        'message': f'Issue assigned to {assigned_to.username}',
        'assignment': IssueAssignmentSerializer(assignment).data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def issue_statistics(request):
    """Get issue statistics for admin dashboard"""
    total_issues = Issue.objects.count()
    reported_issues = Issue.objects.filter(status='reported').count()
    in_progress_issues = Issue.objects.filter(status='progress').count()
    resolved_issues = Issue.objects.filter(status='resolved').count()
    urgent_issues = Issue.objects.filter(priority='urgent').count()
    flagged_issues = Issue.objects.filter(flags__gt=0).count()
    
    # Average resolution time
    resolved_issues_with_time = Issue.objects.filter(
        status='resolved',
        actual_resolution_time__isnull=False
    )
    avg_resolution_time = resolved_issues_with_time.aggregate(
        avg_time=Avg('actual_resolution_time')
    )['avg_time'] or 0
    
    # Issues by category
    issues_by_category = {}
    categories = Category.objects.all()
    for category in categories:
        issues_by_category[category.name] = Issue.objects.filter(category=category).count()
    
    # Issues by status
    issues_by_status = {}
    for status_choice in Issue.STATUS_CHOICES:
        issues_by_status[status_choice[1]] = Issue.objects.filter(status=status_choice[0]).count()
    
    stats = {
        'total_issues': total_issues,
        'reported_issues': reported_issues,
        'in_progress_issues': in_progress_issues,
        'resolved_issues': resolved_issues,
        'urgent_issues': urgent_issues,
        'flagged_issues': flagged_issues,
        'avg_resolution_time': round(avg_resolution_time, 1),
        'issues_by_category': issues_by_category,
        'issues_by_status': issues_by_status
    }
    
    serializer = IssueStatsSerializer(stats)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_issue(request, pk):
    issue = get_object_or_404(Issue, pk=pk)

    # ✅ only owner can delete
    if issue.reported_by != request.user:
        return Response({"error": "Not allowed"}, status=403)

    issue.delete()
    return Response({"message": "Deleted successfully"})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def nearby_issues(request):
    """Get issues near user's location"""
    lat = request.query_params.get('lat')
    lng = request.query_params.get('lng')
    radius = request.query_params.get('radius', 5)  # Default 5km
    
    if not lat or not lng:
        return Response(
            {'error': 'Latitude and longitude are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user_lat = float(lat)
        user_lng = float(lng)
        radius_km = float(radius)
        
        # Simple bounding box calculation (approximation for nearby issues)
        # 1 degree latitude ≈ 111 km
        lat_delta = radius_km / 111.0
        lng_delta = radius_km / (111.0 * abs(user_lat) / 90.0) if user_lat != 0 else radius_km / 111.0
        
        nearby_issues = Issue.objects.filter(
            latitude__range=(user_lat - lat_delta, user_lat + lat_delta),
            longitude__range=(user_lng - lng_delta, user_lng + lng_delta),
            latitude__isnull=False,
            longitude__isnull=False
        ).order_by('-reported_at')[:20]  # Limit to 20 recent issues
        
        serializer = IssueListSerializer(nearby_issues, many=True)
        return Response(serializer.data)
    except (ValueError, TypeError):
        return Response(
            {'error': 'Invalid coordinates'},
            status=status.HTTP_400_BAD_REQUEST
        )