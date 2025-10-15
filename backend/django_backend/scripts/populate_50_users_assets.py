#!/usr/bin/env python
"""
Populate 50 users and 50 assets in the Django backend.
Idempotent: will not create duplicate users (by email) or assets (by serial_number).
Each created asset will be assigned to its owner via the Assignment model.

Usage:
  python scripts/populate_50_users_assets.py

Run from the project root (backend/django_backend) with your Django environment active.
"""
import os
import sys
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from api.models import User, Asset, Assignment, Category, Supplier, Location


def generate_user(i):
    return {
        'name': f'Test User {i}',
        'department': random.choice(['IT','Finance','HR','Operations','Sales','Maintenance']),
        'occupation': random.choice(['Engineer','Analyst','Manager','Technician','Clerk']),
        'email': f'test.user{i}@example.com',
        'phone': f'+100000{i:04d}',
        'nin': f'TEST{i:05d}',
        'status': 'Active',
        'role': 'staff'
    }


def generate_asset(i, user, category, supplier, location):
    serial = f'TESTSN{i:05d}'
    return {
        'asset_name': f"Assigned Asset {i} ({user.name})",
        'category': category,
        'purchase_date': datetime.utcnow().date() - timedelta(days=random.randint(0, 365)),
        'purchase_cost': Decimal(str(random.randint(100, 5000))),
        'status': 'Active',
        'serial_number': serial,
        'supplier': supplier,
        'location_id': location.location_id if location else None,
        'warranty_expiry': datetime.utcnow().date() + timedelta(days=365)
    }


def main():
    print('Starting population of 50 users and 50 assets...')

    # Ensure there are categories, suppliers and locations to attach to assets
    categories = list(Category.objects.all())
    if not categories:
        c = Category.objects.create(category_name='Test Category')
        categories = [c]

    suppliers = list(Supplier.objects.all())
    if not suppliers:
        s = Supplier.objects.create(name='Test Supplier')
        suppliers = [s]

    locations = list(Location.objects.all())
    if not locations:
        l = Location.objects.create(building='Test Location')
        locations = [l]

    created_users = 0
    created_assets = 0
    created_assignments = 0

    for i in range(1, 51):
        udata = generate_user(i)
        user, ucreated = User.objects.get_or_create(email=udata['email'], defaults={
            'name': udata['name'],
            'department': udata['department'],
            'occupation': udata['occupation'],
            'phone': udata['phone'],
            'nin': udata['nin'],
            'status': udata['status'],
            'role': udata.get('role', 'staff')
        })
        if ucreated:
            created_users += 1

        # Create a unique asset for this user
        category = random.choice(categories)
        supplier = random.choice(suppliers)
        location = random.choice(locations)

        adata = generate_asset(i, user, category, supplier, location)
        asset, acreated = Asset.objects.get_or_create(serial_number=adata['serial_number'], defaults={
            'asset_name': adata['asset_name'],
            'category': adata['category'],
            'purchase_date': adata['purchase_date'],
            'purchase_cost': adata['purchase_cost'],
            'status': adata['status'],
            'location_id': adata['location_id'],
            'supplier_id': adata['supplier'].supplier_id if adata['supplier'] else None,
            'warranty_expiry': adata['warranty_expiry']
        })
        if acreated:
            created_assets += 1

        # Ensure there's an Assignment linking the user to the asset
        assignment, ascreated = Assignment.objects.get_or_create(asset=asset, user=user, defaults={
            'assigned_date': datetime.utcnow().date(),
            'status': 'Assigned',
            'description': f'Auto-assigned asset {asset.asset_name} to {user.name}',
            'approved_by': 'AutoScript'
        })
        if ascreated:
            created_assignments += 1

    print(f"Created users: {created_users}")
    print(f"Created assets: {created_assets}")
    print(f"Created assignments: {created_assignments}")
    print('Population complete.')


if __name__ == '__main__':
    main()
