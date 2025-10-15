#!/usr/bin/env python
"""
Convert stored phone numbers to Uganda format (+256...).
- If phone starts with '+' and already contains +256, leave it.
- If phone starts with '0' and looks like a local number (e.g., 0780597659), convert to +2567... by replacing leading 0 with +256.
- If phone is in other formats (e.g., +1-555-1001), generate a deterministic Ugandan number based on user id.
Idempotent: only writes when a change is necessary.
"""
import os
import sys
import django
import re

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from api.models import User

changed = 0
sample_updates = []

users = list(User.objects.all())
for u in users:
    orig = (u.phone or '').strip()
    if not orig:
        continue
    new = orig
    # if already +256, normalized
    if orig.startswith('+256'):
        continue
    # if starts with 0 and looks like local UG number (10 digits)
    digits = re.sub(r'[^0-9]', '', orig)
    if orig.startswith('0') and len(digits) in (10, 9, 7):
        # drop leading 0 and prepend +256
        if digits.startswith('0'):
            digits_no0 = digits[1:]
        else:
            digits_no0 = digits
        new = f'+256{digits_no0}'
    else:
        # generate deterministic ug number based on user id to avoid collisions
        # pattern: +2567PPNNNNN where PP from user id and NNNNN from mod
        uid = u.pk or 0
        pp = f"{uid%10}{(uid//10)%10}"
        nnnnn = f"{(uid*997) % 100000:05d}"
        new = f'+2567{pp}{nnnnn}'

    if new != orig:
        u.phone = new
        u.save()
        changed += 1
        if len(sample_updates) < 20:
            sample_updates.append((u.email, orig, new))

print(f'Phones updated: {changed}')
for e, o, n in sample_updates:
    print(f' - {e}: {o} -> {n}')
print('Done')
