import csv
from datetime import datetime
from django.core.management.base import BaseCommand

from api.models import Asset, Category


KEYWORD_TO_CATEGORY = {
    'nokia': 'Mobile Devices',
    'iphone': 'Mobile Devices',
    'samsung': 'Mobile Devices',
    'ipad': 'Mobile Devices',
    'lenovo': 'Laptops',
    'thinkpad': 'Laptops',
    'dell': 'Laptops',
    'monitor': 'Monitors',
    'printer': 'Printers & Scanners',
    'scanner': 'Printers & Scanners',
    'chair': 'Office Furniture',
    'desk': 'Office Furniture',
    'vehicle': 'Vehicles',
    'car': 'Vehicles',
    'truck': 'Vehicles',
}


class Command(BaseCommand):
    help = 'Propose or apply category reassignments for assets based on asset_name heuristics.'

    def add_arguments(self, parser):
        parser.add_argument('--commit', action='store_true', help='Apply changes')

    def find_category(self, name):
        if not name: return None
        n = name.lower()
        for k, cat_name in KEYWORD_TO_CATEGORY.items():
            if k in n:
                return Category.objects.filter(category_name__iexact=cat_name).first()
        return None

    def handle(self, *args, **options):
        assets = Asset.objects.all()
        proposals = []
        for a in assets:
            cat = self.find_category(a.asset_name)
            if cat and (a.category is None or a.category.category_id != cat.category_id):
                proposals.append((a, cat))

        if not proposals:
            self.stdout.write('No proposals found based on heuristics.')
            return

        self.stdout.write('Proposed reassignments:')
        for a, cat in proposals:
            self.stdout.write(f'{a.asset_id}: "{a.asset_name}" -> {cat.category_name} (was: {a.category.category_name if a.category else "None"})')

        if not options.get('commit'):
            self.stdout.write('\nRun with --commit to apply these changes.\n')
            return

        # commit changes with backup
        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = f'asset_category_backup_{ts}.csv'
        with open(backup_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['asset_id', 'asset_name', 'old_category_id', 'old_category_name', 'new_category_id', 'new_category_name'])
            for a, cat in proposals:
                writer.writerow([a.asset_id, a.asset_name, a.category.category_id if a.category else '', a.category.category_name if a.category else '', cat.category_id, cat.category_name])
                a.category = cat
                a.save()

        self.stdout.write(self.style.SUCCESS(f'Applied {len(proposals)} changes. Backup written to {backup_path}'))
