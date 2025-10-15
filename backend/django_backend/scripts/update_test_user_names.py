#!/usr/bin/env python
"""
Update 'test.userN@example.com' users to have realistic full names.
Idempotent: will update only users that exist and report counts.

Usage:
  python scripts/update_test_user_names.py
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from api.models import User
import re
from django.db.models import Q

REAL_NAMES = [
    # A list of 50 (local) Ugandan-style full names (mixed genders)
    'John Kato', 'Grace Namutebi', 'James Mugisha', 'Esther Nansubuga', 'Peter Ssemanda',
    'Sarah Nakato', 'Paul Ouma', 'Miriam Auma', 'Robert Kintu', 'Ruth Kalenzi',
    'Daniel Muwonge', 'Mercy Nakimuli', 'Joseph Mukama', 'Agnes Nakyeyune', 'Michael Ssekandi',
    'Florence Atim', 'Mark Lwanga', 'Diana Nansamba', 'David Tumusiime', 'Patricia Akello',
    'Samuel Byaruhanga', 'Rose Namagembe', 'Benjamin Kayiwa', 'Stella Abwooli', 'Anthony Baluku',
    'Naomi Ainomugisha', 'Isaac Kyomuhangi', 'Rebecca Nakabugo', 'Fredrick Baryomunsi', 'Joan Kiconco',
    'Martin Ssekisambu', 'Lilian Nakato', 'Brian Kaggwa', 'Sharifah Nabukenya', 'Charles Lubega',
    'Lillian Nakiranda', 'Alex Twinomujuni', 'Aisha Nabulime', 'Michael Ocen', 'Grace Atuhaire',
    'Josephine Namara', 'David Opio', 'Hannah Nakyagaba', 'Edward Kato', 'Nora Aciro',
    'Kenneth Sebunya', 'Sharon Namutebi', 'Oliver Wanyama', 'Annet Namatovu', 'Stephen Kabugo'
]

if len(REAL_NAMES) < 50:
    raise SystemExit('REAL_NAMES must contain at least 50 names')

updated = 0
missing = []

for i in range(1, 51):
    new_name = REAL_NAMES[i-1]
    # helper to slugify names (kept inside file scope)
    def slugify_name_local(n: str) -> str:
        s = n.lower()
        s = re.sub(r"[^a-z0-9\s]", "", s)
        s = re.sub(r"\s+", ".", s.strip())
        return s

    # Try a few ways to locate the user record (idempotent & robust):
    # 1) exact test.user{i}@example.com
    # 2) test.user{i}@gmail.com
    # 3) slugified-name@example.com or @gmail.com
    # 4) name exact match
    # 5) any email containing 'test.user{i}'
    try:
        user = None
        candidates = [
            f'test.user{i}@example.com',
            f'test.user{i}@gmail.com',
        ]
        base_local = slugify_name_local(new_name)
        candidates += [f'{base_local}@example.com', f'{base_local}@gmail.com']

        for c in candidates:
            user = User.objects.filter(email__iexact=c).first()
            if user:
                break

        if not user:
            user = User.objects.filter(name__iexact=new_name).first()
        if not user:
            user = User.objects.filter(email__icontains=f'test.user{i}').first()
        if user:
            changed = False
            if user.name != new_name:
                user.name = new_name
                changed = True
            # Set a Ugandan mobile number pattern: +2567PP###### (common provider prefixes 70-79)
            ug_prefixes = ['70','71','72','73','74','75','76','77','78','79']
            prefix = ug_prefixes[(i-1) % len(ug_prefixes)]
            # Deterministic unique suffix per user
            rest = f"{100000 + i:06d}"[-6:]
            ug_number = f'+2567{prefix}{rest}'
            if (not user.phone) or (user.phone != ug_number):
                user.phone = ug_number
                changed = True

            # Generate a simple Ugandan NIN-style identifier with gendered prefix
            # Note: This is a sample/test identifier, not a real government NIN format.
            gender = 'M' if (i % 2) == 1 else 'F'  # odd -> male, even -> female
            nin_prefix = f'UG{ "M" if gender == "M" else "F" }'
            nin_number = f"{i:07d}"  # zero-padded numeric suffix
            new_nin = f"{nin_prefix}{nin_number}"
            if (not user.nin) or (user.nin != new_nin):
                user.nin = new_nin
                changed = True

            # Generate an email from the name (slugified). Ensure uniqueness.
            def slugify_name(n: str) -> str:
                s = n.lower()
                s = re.sub(r"[^a-z0-9\s]", "", s)
                s = re.sub(r"\s+", ".", s.strip())
                return s

            base_local = slugify_name(new_name)
            candidate = f"{base_local}@gmail.com"
            # If candidate email is used by a different user, append the index to make unique
            if User.objects.filter(email=candidate).exclude(pk=user.pk).exists():
                candidate = f"{base_local}.{i}@gmail.com"

            if user.email != candidate:
                user.email = candidate
                changed = True

            if changed:
                user.save()
                updated += 1
        else:
                orig_identifier = f'test.user{i}@example.com'
                missing.append(orig_identifier)
    except Exception as e:
            print(f'Error updating {orig_identifier}: {e}')

print('Update complete')
print(f'Users updated: {updated}')
if missing:
    print(f'Missing (not present in DB): {len(missing)}')
    for m in missing:
        print(' -', m)
else:
    print('All test users found (or none were missing).')
