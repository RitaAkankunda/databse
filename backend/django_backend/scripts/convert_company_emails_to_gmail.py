#!/usr/bin/env python
"""
Convert remaining users with @company.com emails to @gmail.com.
Idempotent: skips users already using @gmail.com and ensures uniqueness.
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from api.models import User

changed = 0
skipped = 0
collisions = []

users = list(User.objects.filter(email__iendswith='@company.com'))
print(f'Found {len(users)} users with @company.com')

for u in users:
    local = u.email.split('@')[0]
    candidate = f'{local}@gmail.com'
    # if candidate exists and not same user, append suffix to make unique
    if User.objects.filter(email__iexact=candidate).exclude(pk=u.pk).exists():
        # try local.N pattern
        suffix = 1
        new_candidate = f'{local}.{suffix}@gmail.com'
        while User.objects.filter(email__iexact=new_candidate).exclude(pk=u.pk).exists():
            suffix += 1
            new_candidate = f'{local}.{suffix}@gmail.com'
        candidate = new_candidate
        collisions.append((u.email, candidate))
    # apply update
    if u.email != candidate:
        u.email = candidate
        u.save()
        changed += 1
    else:
        skipped += 1

print(f'Emails changed: {changed}')
if collisions:
    print('Collisions resolved:')
    for old, new in collisions[:20]:
        print(f'  {old} -> {new}')
print(f'Skipped (already matching): {skipped}')
print('Done')
