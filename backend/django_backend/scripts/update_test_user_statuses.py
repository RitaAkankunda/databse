#!/usr/bin/env python
"""
Mark a subset of test users inactive.
Default behavior: mark every 5th test user (test.user5@example.com, test.user10@..., ..., test.user50@...) as Inactive.
Idempotent: only updates users that exist and reports counts.

Usage:
  python scripts/update_test_user_statuses.py

Optional:
  python scripts/update_test_user_statuses.py --every 10   # mark every 10th user inactive
  python scripts/update_test_user_statuses.py --list 5,12,20 # mark these specific indices inactive
"""
import os
import sys
import django
import argparse

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from api.models import User

parser = argparse.ArgumentParser()
parser.add_argument('--every', type=int, default=5, help='Mark every Nth user inactive (default 5)')
parser.add_argument('--list', type=str, default='', help='Comma-separated list of indices to mark inactive (overrides --every)')
args = parser.parse_args()

indices = []
if args.list:
    try:
        indices = [int(x.strip()) for x in args.list.split(',') if x.strip()]
    except ValueError:
        print('Invalid --list format; must be comma separated integers')
        sys.exit(1)
else:
    if args.every <= 0:
        print('--every must be > 0')
        sys.exit(1)
    indices = list(range(args.every, 51, args.every))

print('Will mark these test user indices inactive:', indices)

updated = 0
missing = []

for i in indices:
    email = f'test.user{i}@example.com'
    user = User.objects.filter(email=email).first()
    if not user:
        missing.append(email)
        continue
    if user.status != 'Inactive':
        user.status = 'Inactive'
        user.save()
        updated += 1

print('Operation complete')
print(f'Users updated to Inactive: {updated}')
if missing:
    print(f'Missing (not present in DB): {len(missing)}')
    for m in missing:
        print(' -', m)
else:
    print('No missing users.')
