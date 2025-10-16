from django.core.management.base import BaseCommand

from api.models import Category


class Command(BaseCommand):
    help = 'Ensure an "Others" category exists in the database. Run with --commit to create it.'

    def add_arguments(self, parser):
        parser.add_argument('--commit', action='store_true', help='Create the category if missing')

    def handle(self, *args, **options):
        name = 'Others'
        existing = Category.objects.filter(category_name__iexact=name).first()
        if existing:
            self.stdout.write(self.style.SUCCESS(f'Existing category found: id={existing.category_id} name="{existing.category_name}"'))
            return

        if not options.get('commit'):
            self.stdout.write(f'No "Others" category found. Would create: name="{name}", description="Uncategorized / Other"')
            self.stdout.write('Run this command with --commit to create the category.')
            return

        cat = Category.objects.create(category_name=name, description='Uncategorized / Other')
        self.stdout.write(self.style.SUCCESS(f'Created category: id={cat.category_id} name="{cat.category_name}"'))
