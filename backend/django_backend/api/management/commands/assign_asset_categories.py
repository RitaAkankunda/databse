from django.core.management.base import BaseCommand
import re
import random

from api.models import Asset, Category


class Command(BaseCommand):
    help = "Assign categories to existing assets using simple name-based heuristics or random fallback"

    def add_arguments(self, parser):
        parser.add_argument(
            "--commit",
            action="store_true",
            help="Persist changes. Without this flag the command runs as a dry-run.",
        )

    def handle(self, *args, **options):
        commit = options.get("commit", False)

        # Very small heuristic map: keyword -> preferred category label
        patterns = {
            "Phone": [r"phone", r"iphone", r"samsung", r"galaxy", r"nokia", r"xiaomi"],
            "Laptop": [r"laptop", r"lenovo", r"dell", r"hp", r"macbook", r"acer"],
            "Monitor": [r"monitor", r"screen", r"display"],
            "Printer": [r"printer", r"canon", r"epson", r"brother"],
            "Furniture": [r"chair", r"desk", r"table", r"cabinet"],
        }

        # Lowercased map of existing categories
        categories = {c.category_name.lower(): c for c in Category.objects.all()}

        if not categories:
            self.stdout.write(self.style.ERROR("No categories found. Create some categories first."))
            return

        fallback_categories = list(categories.values())

        qs = Asset.objects.filter(category__isnull=True)
        total = qs.count()
        self.stdout.write(f"Found {total} un-categorized assets")

        assigned_count = 0

        for asset in qs.iterator():
            name = (asset.asset_name or "").lower()
            chosen = None

            # try to match patterns -> prefer category whose name contains the pattern key
            for human_cat, pats in patterns.items():
                for p in pats:
                    if re.search(r"\b" + re.escape(p) + r"\b", name):
                        # find a real Category object that contains the human_cat word
                        for key, cat in categories.items():
                            if human_cat.lower() in key:
                                chosen = cat
                                break
                        if chosen:
                            break
                if chosen:
                    break

            if not chosen:
                # fallback: pick a random existing category
                chosen = random.choice(fallback_categories)

            self.stdout.write(f"{asset.asset_id}: \"{asset.asset_name}\" -> {chosen.category_name}")

            if commit:
                asset.category = chosen
                asset.save(update_fields=["category"]) 
                assigned_count += 1

        if commit:
            self.stdout.write(self.style.SUCCESS(f"Assigned {assigned_count} assets"))
        else:
            self.stdout.write(self.style.WARNING("Dry-run complete. Rerun with --commit to persist changes."))
