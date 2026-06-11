from django.core.management.base import BaseCommand
from issues.models import Category


class Command(BaseCommand):
    help = 'Load initial data for the Civic Zone Connect application'

    def handle(self, *args, **options):
        self.stdout.write('Loading initial data...')
        
        # Create default categories
        categories_data = [
            {
                'name': 'Roads',
                'description': 'Road-related issues including potholes, obstructions, and road damage',
                'icon': 'road',
                'color': '#FF6B6B'
            },
            {
                'name': 'Lighting',
                'description': 'Street lighting issues including broken or flickering lights',
                'icon': 'lightbulb',
                'color': '#FFD93D'
            },
            {
                'name': 'Water Supply',
                'description': 'Water supply issues including leaks, low pressure, and water quality',
                'icon': 'droplet',
                'color': '#4ECDC4'
            },
            {
                'name': 'Cleanliness',
                'description': 'Cleanliness issues including overflowing bins, garbage, and sanitation',
                'icon': 'trash',
                'color': '#45B7D1'
            },
            {
                'name': 'Public Safety',
                'description': 'Public safety issues including open manholes, exposed wiring, and hazards',
                'icon': 'shield',
                'color': '#96CEB4'
            },
            {
                'name': 'Obstructions',
                'description': 'Obstructions including fallen trees, debris, and blocked pathways',
                'icon': 'tree',
                'color': '#FF8A80'
            },
            {
                'name': 'Traffic',
                'description': 'Traffic-related issues including signal problems and congestion',
                'icon': 'car',
                'color': '#FF7043'
            },
            {
                'name': 'Parks & Recreation',
                'description': 'Parks and recreation facility issues',
                'icon': 'park',
                'color': '#66BB6A'
            }
        ]
        
        for category_data in categories_data:
            category, created = Category.objects.get_or_create(
                name=category_data['name'],
                defaults=category_data
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Category already exists: {category.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('Initial data loading completed successfully!')
        ) 