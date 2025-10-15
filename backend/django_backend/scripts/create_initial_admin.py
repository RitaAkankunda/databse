"""
Run this with `python manage.py runscript create_initial_admin` if django-extensions is available,
or execute via `python manage.py shell < create_initial_admin.py` for a quick start.

This script creates an initial admin user in the `api.User` model (not Django's auth user).
"""

from django.contrib.auth import get_user_model
from api.models import User

# Change these values before running in production
ADMIN_NAME = 'admin'
ADMIN_EMAIL = 'admin@example.com'

# Only create if not exists
if not User.objects.filter(name=ADMIN_NAME).exists():
    u = User.objects.create(name=ADMIN_NAME, email=ADMIN_EMAIL, role='admin')
    print(f"Created initial admin user: {u}")
else:
    print("Admin user already exists")
