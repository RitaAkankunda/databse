#!/usr/bin/env python
"""
Script to export data from SQLite to JSON format for migration to MySQL
"""
import os
import sys
import django
import json
from datetime import datetime

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from api.models import User, Category, Asset, Supplier, Location, Buyer, Disposal, MaintenanceStaff, Maintenance, Assignment, AssetValuation

def export_model_data(model_class, filename):
    """Export model data to JSON file"""
    from decimal import Decimal
    
    data = []
    for obj in model_class.objects.all():
        # Convert model instance to dictionary
        obj_dict = {}
        for field in obj._meta.fields:
            value = getattr(obj, field.name)
            if hasattr(value, 'isoformat'):  # Handle datetime/date fields
                value = value.isoformat()
            elif isinstance(value, Decimal):  # Handle Decimal fields
                value = float(value)
            obj_dict[field.name] = value
        data.append(obj_dict)
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Exported {len(data)} {model_class.__name__} records to {filename}")

def main():
    """Export all model data"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    export_dir = f"data_export_{timestamp}"
    os.makedirs(export_dir, exist_ok=True)
    
    # Export each model
    models_to_export = [
        (Category, 'categories'),
        (User, 'users'),
        (Supplier, 'suppliers'),
        (Location, 'locations'),
        (Buyer, 'buyers'),
        (Asset, 'assets'),
        (MaintenanceStaff, 'maintenance_staff'),
        (Maintenance, 'maintenance'),
        (Assignment, 'assignments'),
        (AssetValuation, 'asset_valuations'),
        (Disposal, 'disposals'),
    ]
    
    for model_class, filename in models_to_export:
        export_model_data(model_class, os.path.join(export_dir, f"{filename}.json"))
    
    print(f"\nAll data exported to {export_dir}/ directory")
    print("You can now switch to MySQL and import this data.")

if __name__ == "__main__":
    main()
