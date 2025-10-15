#!/usr/bin/env python
"""
Update specific user NINs to Ugandan-style pattern (UGM/UGF + zero-padded number).
This script targets an explicit list of existing NINs and replaces them deterministically.
Idempotent: it only updates users whose current nin matches the listed old_nins.
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from api.models import User

# The exact old NIN values to replace (in the order shown)
OLD_NINS = [
    'CD122',
    'EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005', 'EMP006', 'EMP007', 'EMP008', 'EMP009', 'EMP010'
]

print('Target old NINs:', OLD_NINS)

updated = []
missing = []
conflicts = []

for idx, old in enumerate(OLD_NINS, start=1):
    # Decide gender: odd index -> male (M), even -> female (F)
    gender = 'M' if (idx % 2) == 1 else 'F'
    prefix = f'UGM' if gender == 'M' else f'UGF'
    new_nin = f"{prefix}{idx:07d}"

    user = User.objects.filter(nin=old).first()
    if not user:
        missing.append(old)
        continue

    # if new_nin already assigned to someone else (conflict), record and append suffix
    if User.objects.filter(nin=new_nin).exclude(pk=user.pk).exists():
        suffix = 1
        candidate = f"{new_nin}_{suffix}"
        while User.objects.filter(nin=candidate).exclude(pk=user.pk).exists():
            suffix += 1
            candidate = f"{new_nin}_{suffix}"
        conflicts.append((old, new_nin, candidate))
        new_nin = candidate

    if user.nin != new_nin:
        old_val = user.nin
        user.nin = new_nin
        user.save()
        updated.append((user.email, old_val, new_nin))

print('\nUpdated records:')
for e, old, new in updated:
    print(f' - {e}: {old} -> {new}')

if missing:
    print('\nMissing (old NINs not found):')
    for m in missing:
        print(' -', m)

if conflicts:
    print('\nConflicts resolved:')
    for old, intended, resolved in conflicts:
        print(f' - {old}: intended {intended}, used {resolved}')

print('\nDone')
