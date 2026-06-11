from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path('categories/', views.CategoryListView.as_view(), name='categories'),

    path('stats/', views.public_stats, name='public-stats'),
    
    # Issues
    path('issues/', views.IssueListView.as_view(), name='issues'),
    path('issues/create/', views.IssueCreateView.as_view(), name='create-issue'),
    path('issues/<int:pk>/', views.IssueDetailView.as_view(), name='issue-detail'),
    path('issues/<int:pk>/update/', views.IssueUpdateView.as_view(), name='update-issue'),
    path('issues/<int:pk>/comment/', views.IssueCommentView.as_view(), name='add-comment'),
    path('issues/<int:pk>/vote/', views.IssueVoteView.as_view(), name='vote-issue'),
    path('issues/<int:pk>/delete/', views.delete_issue, name='delete-issue'),
    path('issues/<int:pk>/flag/', views.IssueFlagView.as_view(), name='flag-issue'),
    path('issues/<int:pk>/report-spam/', views.report_spam, name='report-spam'),
    path('issues/<int:pk>/unflag/', views.unflag_issue, name='unflag-issue'),
    path('my-issues/', views.MyIssuesView.as_view(), name='my-issues'),
    path('nearby-issues/', views.nearby_issues, name='nearby-issues'),
    
    # Admin views
    path('admin/issues/', views.AdminIssueListView.as_view(), name='admin-issues'),
    path('admin/issues/<int:pk>/', views.AdminIssueDetailView.as_view(), name='admin-issue-detail'),
    path('admin/issues/<int:pk>/update/', views.IssueUpdateView.as_view(), name='admin-update-issue'),
    path('admin/issues/<int:pk>/toggle-visibility/', views.toggle_issue_visibility, name='toggle-issue-visibility'),
    path('admin/issues/<int:pk>/assign/', views.assign_issue, name='assign-issue'),
    path('admin/statistics/', views.issue_statistics, name='issue-statistics'),
] 