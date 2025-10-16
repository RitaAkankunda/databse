from django.core.management.base import BaseCommand
from django.db import transaction
import re

from api.models import Asset, Category
import csv
import os
from datetime import datetime


COMMON_PHONE_MODELS = [
    "Samsung Galaxy S{n}",
    "iPhone {n}",
    "Google Pixel {n}",
    "Xiaomi Redmi {n}",
    "Nokia {n}"
]

COMMON_LAPTOP_MODELS = [
    "Dell Inspiron {n}",
    "HP Pavilion {n}",
    "Lenovo ThinkPad {n}",
    "MacBook Pro {n}",
    "Acer Aspire {n}"
]

COMMON_MONITOR_MODELS = [
    "Dell UltraSharp {n}",
    "LG UltraWide {n}",
    "Samsung Curved {n}",
]

FALLBACK_TEMPLATES = {
    'phone': COMMON_PHONE_MODELS,
    'laptop': COMMON_LAPTOP_MODELS,
    'monitor': COMMON_MONITOR_MODELS,
}


def pick_template_for_category(cat_name_lower, index):
    # simple heuristics: map category keywords to templates
    if 'phone' in cat_name_lower or 'mobile' in cat_name_lower:
        templates = COMMON_PHONE_MODELS
    elif 'laptop' in cat_name_lower or 'notebook' in cat_name_lower:
        templates = COMMON_LAPTOP_MODELS
    elif 'monitor' in cat_name_lower or 'display' in cat_name_lower:
        templates = COMMON_MONITOR_MODELS
    else:
        # fallback: choose one of the phone templates for variety
        templates = COMMON_PHONE_MODELS + COMMON_LAPTOP_MODELS

    # pick a template based on index to give some variance
    tmpl = templates[index % len(templates)]
    # Replace {n} with a realistic looking number
    num = 10 + (index % 90)
    return tmpl.replace('{n}', str(num))


class Command(BaseCommand):
    help = 'Replace placeholder/generic asset names with more realistic model-like names. Dry-run by default.'

    def add_arguments(self, parser):
        parser.add_argument('--commit', action='store_true', help='Persist changes')
        parser.add_argument('--match-prefix', type=str, default='Assigned Asset', help='Prefix to match generic assets (default: "Assigned Asset")')

    def handle(self, *args, **options):
        commit = options.get('commit', False)
        prefix = options.get('match_prefix')

        assets_qs = Asset.objects.all().order_by('asset_id')

        changed = []

        # Build a mapping of category id -> lowercased name for heuristics
        # Note: this project uses `category_id` as the PK field name.
        categories = {c.category_id: c.category_name.lower() for c in Category.objects.all()}

        idx = 0
        for asset in assets_qs:
            name = (asset.asset_name or '').strip()
            # Match patterns like "Assigned Asset 1 (Test User 1)" or other placeholders
            if not name:
                should_replace = True
            else:
                should_replace = bool(re.match(rf"^{re.escape(prefix)}\b", name, flags=re.IGNORECASE))

            if not should_replace:
                idx += 1
                continue

            # heuristics based on category
            cat_name = categories.get(asset.category_id) if asset.category_id else None
            if cat_name:
                new_name = pick_template_for_category(cat_name, idx)
            else:
                # if no category, fallback to a mixed template
                new_name = pick_template_for_category('', idx)

            changed.append((asset.asset_id, name, new_name))
            idx += 1

        if not changed:
            self.stdout.write(self.style.SUCCESS('No matching generic assets found.'))
            return

        self.stdout.write('Proposed renames:')
        for aid, old, new in changed:
            self.stdout.write(f'{aid}: "{old}" -> "{new}"')

        if commit:
            self.stdout.write('Persisting changes...')
            # create a backup CSV of current asset names before updating
            ts = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '..', '..', '..')
            # fallback to current working directory if path resolution is odd
            try:
                backup_dir = os.path.abspath(backup_dir)
            except Exception:
                backup_dir = os.getcwd()
            backup_file = os.path.join(backup_dir, f'asset_name_backup_{ts}.csv')
            try:
                with open(backup_file, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow(['asset_id', 'asset_name'])
                    for aid, old, new in changed:
                        # fetch the current name from DB to be safe
                        a = Asset.objects.filter(asset_id=aid).first()
                        writer.writerow([aid, a.asset_name if a else old])
                self.stdout.write(self.style.SUCCESS(f'Backup written to {backup_file}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to write backup: {e}'))

            with transaction.atomic():
                for aid, old, new in changed:
                    Asset.objects.filter(asset_id=aid).update(asset_name=new)
            self.stdout.write(self.style.SUCCESS(f'Updated {len(changed)} assets'))
        else:
            self.stdout.write(self.style.WARNING('Dry-run: no changes were persisted. Rerun with --commit to apply.'))
