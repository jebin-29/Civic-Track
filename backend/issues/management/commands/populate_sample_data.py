from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from issues.models import Category, Issue
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate database with sample data for CivicTrack'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')
        
        # Create categories
        categories_data = [
            {'name': 'Road', 'description': 'Road-related issues'},
            {'name': 'Streetlight', 'description': 'Street lighting issues'},
            {'name': 'Garbage Collection', 'description': 'Waste management issues'},
            {'name': 'Water Supply', 'description': 'Water supply issues'},
            {'name': 'Public Safety', 'description': 'Public safety concerns'},
            {'name': 'Obstructions', 'description': 'Obstructions and blockages'},
            {'name': 'Traffic Signal', 'description': 'Traffic signal issues'},
            {'name': 'Drainage', 'description': 'Drainage and sewer issues'},
        ]
        
        categories = {}
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            categories[cat_data['name']] = category
            if created:
                self.stdout.write(f'Created category: {category.name}')
        
        # Realistic locations in Ahmedabad and Indore
        locations = [
            # Ahmedabad locations
            'Gota Bridge, Ahmedabad, Gujarat',
            'C.G Road, Ahmedabad, Gujarat',
            'IT Society, Ahmedabad, Gujarat',
            'Satellite, Ahmedabad, Gujarat',
            'Vastrapur, Ahmedabad, Gujarat',
            'Navrangpura, Ahmedabad, Gujarat',
            'Paldi, Ahmedabad, Gujarat',
            'Ellisbridge, Ahmedabad, Gujarat',
            'Bodakdev, Ahmedabad, Gujarat',
            'Jodhpur, Ahmedabad, Gujarat',
            'Thaltej, Ahmedabad, Gujarat',
            'Sola, Ahmedabad, Gujarat',
            'Bopal, Ahmedabad, Gujarat',
            'Ambawadi, Ahmedabad, Gujarat',
            'Gulbai Tekra, Ahmedabad, Gujarat',
            'Khanpur, Ahmedabad, Gujarat',
            'Dariyapur, Ahmedabad, Gujarat',
            'Jamalpur, Ahmedabad, Gujarat',
            'Maninagar, Ahmedabad, Gujarat',
            'Vatva, Ahmedabad, Gujarat',
            # Indore locations
            'Rajendra Nagar, Indore, Madhya Pradesh',
            'Vijay Nagar, Indore, Madhya Pradesh',
            'Palasia, Indore, Madhya Pradesh',
            'MG Road, Indore, Madhya Pradesh',
            'Scheme 54, Indore, Madhya Pradesh',
            'Scheme 74, Indore, Madhya Pradesh',
            'Lalbagh, Indore, Madhya Pradesh',
            'Chhoti Gwaltoli, Indore, Madhya Pradesh',
            'Bada Gwaltoli, Indore, Madhya Pradesh',
            'Saket, Indore, Madhya Pradesh',
            'Tower Square, Indore, Madhya Pradesh',
            'Rajendra Nagar Extension, Indore, Madhya Pradesh',
            'Sudama Nagar, Indore, Madhya Pradesh',
            'Khatipura, Indore, Madhya Pradesh',
            'Rau, Indore, Madhya Pradesh',
            'Pithampur, Indore, Madhya Pradesh',
            'Sanwer, Indore, Madhya Pradesh',
            'Mhow, Indore, Madhya Pradesh',
            'Dewas Road, Indore, Madhya Pradesh',
            'AB Road, Indore, Madhya Pradesh',
        ]
        
        # Realistic issue titles and descriptions
        road_issues = [
            ('Pothole on main road', 'Large pothole making driving dangerous'),
            ('Broken road surface', 'Road surface completely broken and uneven'),
            ('Road flooding', 'Road flooded due to poor drainage'),
            ('Missing manhole cover', 'Manhole cover missing, safety hazard'),
            ('Road construction debris', 'Construction debris blocking traffic'),
            ('Damaged speed breaker', 'Speed breaker damaged and dangerous'),
            ('Road marking faded', 'Road markings completely faded'),
            ('Street sign damaged', 'Street sign bent and unreadable'),
        ]
        
        streetlight_issues = [
            ('Streetlight not working', 'Street light not working since last 2 days'),
            ('Flickering streetlight', 'Streetlight flickering continuously'),
            ('Broken streetlight pole', 'Streetlight pole broken and leaning'),
            ('Streetlight too bright', 'Streetlight too bright, causing glare'),
            ('Streetlight too dim', 'Streetlight too dim to see properly'),
            ('Streetlight timing wrong', 'Streetlight not turning on/off at correct time'),
        ]
        
        garbage_issues = [
            ('Garbage not collected', 'Garbage is not collected since week it\'s smell bad and very difficult to leave here'),
            ('Garbage bin overflowing', 'Garbage bin overflowing and spreading waste'),
            ('Garbage bin missing', 'Garbage bin missing from designated area'),
            ('Garbage truck not coming', 'Garbage collection truck not coming regularly'),
            ('Illegal dumping', 'People dumping garbage illegally in public area'),
            ('Garbage bin damaged', 'Garbage bin damaged and unusable'),
        ]
        
        water_issues = [
            ('Water supply interrupted', 'No water supply for past 3 days'),
            ('Water leakage', 'Water leaking from main pipeline'),
            ('Low water pressure', 'Very low water pressure in the area'),
            ('Dirty water supply', 'Water coming dirty and contaminated'),
            ('Water meter not working', 'Water meter showing incorrect readings'),
            ('Water tank overflow', 'Water tank overflowing and wasting water'),
        ]
        
        safety_issues = [
            ('Broken railing', 'Safety railing broken near children\'s park'),
            ('Missing manhole cover', 'Manhole cover missing near school'),
            ('Damaged sidewalk', 'Sidewalk damaged and dangerous for pedestrians'),
            ('Broken playground equipment', 'Playground equipment broken and unsafe'),
            ('Loose electrical wires', 'Electrical wires hanging loose and dangerous'),
            ('Broken street furniture', 'Public bench broken and unusable'),
        ]
        
        obstruction_issues = [
            ('Tree fallen on road', 'Large tree fallen blocking the road'),
            ('Construction material blocking', 'Construction material blocking pedestrian path'),
            ('Illegal parking', 'Vehicles parked illegally blocking traffic'),
            ('Street vendor obstruction', 'Street vendors blocking pedestrian walkway'),
            ('Advertising board fallen', 'Large advertising board fallen on road'),
            ('Construction barrier damaged', 'Construction safety barrier damaged'),
        ]
        
        traffic_issues = [
            ('Traffic signal not working', 'Traffic signal completely not working'),
            ('Traffic signal timing wrong', 'Traffic signal timing causing traffic jams'),
            ('Traffic signal light broken', 'Red light broken in traffic signal'),
            ('Pedestrian signal not working', 'Pedestrian crossing signal not working'),
            ('Traffic camera damaged', 'Traffic surveillance camera damaged'),
        ]
        
        drainage_issues = [
            ('Drainage blocked', 'Drainage system completely blocked'),
            ('Sewer overflow', 'Sewer overflowing and spreading bad smell'),
            ('Drainage cover missing', 'Drainage cover missing, safety hazard'),
            ('Drainage water stagnant', 'Water stagnant in drainage causing mosquitoes'),
            ('Drainage pipe broken', 'Drainage pipe broken and leaking'),
        ]
        
        # Combine all issues
        all_issues = (
            road_issues + streetlight_issues + garbage_issues + 
            water_issues + safety_issues + obstruction_issues + 
            traffic_issues + drainage_issues
        )
        
        # Create 60 issues with realistic data
        issues_data = []
        
        for i in range(60):
            # Select random issue
            issue_title, issue_desc = random.choice(all_issues)
            
            # Determine category based on issue title
            category_name = 'Road'  # default
            if 'streetlight' in issue_title.lower() or 'light' in issue_title.lower():
                category_name = 'Streetlight'
            elif 'garbage' in issue_title.lower() or 'waste' in issue_title.lower():
                category_name = 'Garbage Collection'
            elif 'water' in issue_title.lower():
                category_name = 'Water Supply'
            elif 'safety' in issue_title.lower() or 'railing' in issue_title.lower() or 'playground' in issue_title.lower():
                category_name = 'Public Safety'
            elif 'tree' in issue_title.lower() or 'obstruction' in issue_title.lower() or 'blocking' in issue_title.lower():
                category_name = 'Obstructions'
            elif 'traffic' in issue_title.lower() or 'signal' in issue_title.lower():
                category_name = 'Traffic Signal'
            elif 'drainage' in issue_title.lower() or 'sewer' in issue_title.lower():
                category_name = 'Drainage'
            
            # Random status
            status = random.choice(['reported', 'progress', 'resolved'])
            
            # Random location
            location = random.choice(locations)
            
            # Random coordinates around Ahmedabad or Indore based on location
            if 'Indore' in location:
                # Indore coordinates (22.7196, 75.8577)
                latitude = 22.7196 + (random.random() - 0.5) * 0.1
                longitude = 75.8577 + (random.random() - 0.5) * 0.1
            else:
                # Ahmedabad coordinates (23.0225, 72.5714)
                latitude = 23.0225 + (random.random() - 0.5) * 0.1
                longitude = 72.5714 + (random.random() - 0.5) * 0.1
            
            # Random date within last 3 months
            days_ago = random.randint(1, 90)
            reported_date = timezone.now() - timedelta(days=days_ago)
            
            issues_data.append({
                'title': issue_title,
                'description': issue_desc,
                'category': category_name,
                'status': status,
                'location': location,
                'latitude': latitude,
                'longitude': longitude,
                'reported_at': reported_date,
            })
        
        # Delete existing issues first
        Issue.objects.all().delete()
        
        # Create issues
        for i, issue_data in enumerate(issues_data):
            category = categories[issue_data['category']]
            issue = Issue.objects.create(
                title=issue_data['title'],
                description=issue_data['description'],
                category=category,
                status=issue_data['status'],
                latitude=issue_data['latitude'],
                longitude=issue_data['longitude'],
                location=issue_data['location'],
                reported_at=issue_data['reported_at'],
                is_anonymous=True,
            )
            if i < 10:  # Show first 10 for logging
                self.stdout.write(f'Created issue: {issue.title}')
        
        self.stdout.write(f'Created {len(issues_data)} total issues')
        self.stdout.write(
            self.style.SUCCESS('Successfully created sample data!')
        ) 