#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civic_zone_connect.settings')
django.setup()

from users.models import User

try:
    user = User.objects.get(username='admin')
    user.set_password('admin123')
    user.save()
    print('Password set successfully')
except User.DoesNotExist:
    print('User not found')
