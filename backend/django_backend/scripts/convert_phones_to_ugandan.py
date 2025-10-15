#!/usr/bin/env python
"""
Convert non-+256 phone numbers to Ugandan format.
- If phone starts with 0 (e.g., 0780597659) -> replace leading 0 with +256
- If phone is in another country format (e.g., +1...), generate a deterministic +2567... mobile number
- Idempotent: skips phones already starting with +256
"""
import os
import sys
import django
import re

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from api.models import User

users = list(User.objects.all())
print(f'Total users checked: {len(users)}')
updated = 0
skipped = 0
created_generated = 0

# provider prefixes for generated numbers
ug_prefixes = ['70','71','72','73','74','75','76','77','78','79']

for idx, user in enumerate(users, start=1):
    phone = (user.phone or '').strip()
    if not phone:
        # generate a deterministic UG number for empty phones
        provider = ug_prefixes[(idx-1) % len(ug_prefixes)]
        suffix = f"{100000 + idx:06d}"[-6:]
        new_phone = f'+2567{provider}{suffix}'
        # ensure uniqueness
        attempt = 1
        candidate = new_phone
        while User.objects.filter(phone=candidate).exclude(pk=user.pk).exists():
            candidate = f"{new_phone}_{attempt}"
            attempt += 1
        new_phone = candidate
        user.phone = new_phone
        user.save()
        updated += 1
        created_generated += 1
        continue

    # skip already ugandan
    if phone.startswith('+256'):
        skipped += 1
        continue

    # remove non-digit characters for analysis
    digits = re.sub(r'\D', '', phone)

    new_phone = None
    # if starts with 0 and length makes sense (9 or 10 digits), replace leading 0 with +256
    if digits.startswith('0') and len(digits) >= 9:
        # drop leading 0
        rest = digits[1:]
        new_phone = f'+256{rest}'
    else:
        # otherwise generate a deterministic ugandan mobile number
        provider = ug_prefixes[(idx-1) % len(ug_prefixes)]
        suffix = f"{100000 + idx:06d}"[-6:]
        new_phone = f'+2567{provider}{suffix}'

    # ensure uniqueness
    attempt = 1
    candidate = new_phone
    while User.objects.filter(phone=candidate).exclude(pk=user.pk).exists():
        candidate = f"{new_phone}_{attempt}"
        attempt += 1
    new_phone = candidate

    if user.phone != new_phone:
        user.phone = new_phone
        user.save()
        updated += 1

print('\nConversion complete')
print(f'Updated phones: {updated} (generated new: {created_generated})')
print(f'Skipped (already +256): {skipped}')

# show a sample of users with +256 phones
from django.db.models import Q
sample = list(User.objects.filter(Q(phone__startswith='+256')).values_list('email','name','phone')[:40])
print('\nSample +256 phones:')
for e,n,p in sample:
    print(f' - {e} | {n} | {p}')
