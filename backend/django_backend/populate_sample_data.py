#!/usr/bin/env python
"""
Sample Data Population Script for Asset Management System
This script creates realistic sample data for testing and demonstration purposes.
"""
import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal
import random

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from api.models import (
    User, Category, Asset, Supplier, Location, Buyer, 
    Disposal, MaintenanceStaff, Maintenance, Assignment, AssetValuation
)

def create_categories():
    """Create sample categories"""
    categories_data = [
        {'category_name': 'Computers & Laptops', 'description': 'Desktop computers, laptops, and workstations'},
        {'category_name': 'Mobile Devices', 'description': 'Smartphones, tablets, and mobile accessories'},
        {'category_name': 'Office Furniture', 'description': 'Desks, chairs, filing cabinets, and office equipment'},
        {'category_name': 'Network Equipment', 'description': 'Routers, switches, servers, and networking devices'},
        {'category_name': 'Printers & Scanners', 'description': 'Printing and scanning equipment'},
        {'category_name': 'Vehicles', 'description': 'Company cars, trucks, and transportation vehicles'},
        {'category_name': 'Tools & Equipment', 'description': 'Maintenance tools and specialized equipment'},
        {'category_name': 'Software Licenses', 'description': 'Software applications and licenses'},
    ]
    
    categories = []
    for cat_data in categories_data:
        category, created = Category.objects.get_or_create(
            category_name=cat_data['category_name'],
            defaults={'description': cat_data['description']}
        )
        categories.append(category)
        if created:
            print(f"Created category: {category.category_name}")
    
    return categories

def create_suppliers():
    """Create sample suppliers"""
    suppliers_data = [
        {'name': 'Tech Solutions Inc', 'phone': '+1-555-0101', 'email': 'sales@techsolutions.com', 'address': '123 Tech Street, Silicon Valley, CA'},
        {'name': 'Office Depot Pro', 'phone': '+1-555-0102', 'email': 'corporate@officedepot.com', 'address': '456 Business Ave, New York, NY'},
        {'name': 'Dell Technologies', 'phone': '+1-555-0103', 'email': 'enterprise@dell.com', 'address': '789 Dell Way, Round Rock, TX'},
        {'name': 'HP Enterprise', 'phone': '+1-555-0104', 'email': 'business@hp.com', 'address': '321 HP Boulevard, Palo Alto, CA'},
        {'name': 'Cisco Systems', 'phone': '+1-555-0105', 'email': 'sales@cisco.com', 'address': '654 Network Drive, San Jose, CA'},
        {'name': 'Apple Business', 'phone': '+1-555-0106', 'email': 'business@apple.com', 'address': '987 Apple Park Way, Cupertino, CA'},
    ]
    
    suppliers = []
    for sup_data in suppliers_data:
        supplier, created = Supplier.objects.get_or_create(
            name=sup_data['name'],
            defaults={
                'phone': sup_data['phone'],
                'email': sup_data['email'],
                'address': sup_data['address']
            }
        )
        suppliers.append(supplier)
        if created:
            print(f"Created supplier: {supplier.name}")
    
    return suppliers

def create_locations():
    """Create sample locations"""
    locations_data = [
        {'building': 'Main Office', 'postal_address': '100 Corporate Plaza, Downtown', 'geographical_location': 'City Center'},
        {'building': 'Branch Office North', 'postal_address': '200 North Street, North District', 'geographical_location': 'North Side'},
        {'building': 'Branch Office South', 'postal_address': '300 South Avenue, South District', 'geographical_location': 'South Side'},
        {'building': 'Warehouse Complex', 'postal_address': '400 Industrial Road, Industrial Zone', 'geographical_location': 'Industrial Area'},
        {'building': 'Remote Office East', 'postal_address': '500 East Boulevard, East District', 'geographical_location': 'East Side'},
    ]
    
    locations = []
    for loc_data in locations_data:
        location, created = Location.objects.get_or_create(
            building=loc_data['building'],
            defaults={
                'postal_address': loc_data['postal_address'],
                'geographical_location': loc_data['geographical_location']
            }
        )
        locations.append(location)
        if created:
            print(f"Created location: {location.building}")
    
    return locations

def create_users():
    """Create sample users"""
    users_data = [
        {'name': 'John Smith', 'department': 'IT', 'occupation': 'System Administrator', 'email': 'john.smith@company.com', 'phone': '+1-555-1001', 'nin': 'EMP001', 'status': 'Active'},
        {'name': 'Sarah Johnson', 'department': 'HR', 'occupation': 'HR Manager', 'email': 'sarah.johnson@company.com', 'phone': '+1-555-1002', 'nin': 'EMP002', 'status': 'Active'},
        {'name': 'Mike Davis', 'department': 'Finance', 'occupation': 'Financial Analyst', 'email': 'mike.davis@company.com', 'phone': '+1-555-1003', 'nin': 'EMP003', 'status': 'Active'},
        {'name': 'Lisa Wilson', 'department': 'Marketing', 'occupation': 'Marketing Manager', 'email': 'lisa.wilson@company.com', 'phone': '+1-555-1004', 'nin': 'EMP004', 'status': 'Active'},
        {'name': 'David Brown', 'department': 'IT', 'occupation': 'Software Developer', 'email': 'david.brown@company.com', 'phone': '+1-555-1005', 'nin': 'EMP005', 'status': 'Active'},
        {'name': 'Emma Taylor', 'department': 'Operations', 'occupation': 'Operations Manager', 'email': 'emma.taylor@company.com', 'phone': '+1-555-1006', 'nin': 'EMP006', 'status': 'Active'},
        {'name': 'James Miller', 'department': 'Sales', 'occupation': 'Sales Representative', 'email': 'james.miller@company.com', 'phone': '+1-555-1007', 'nin': 'EMP007', 'status': 'Active'},
        {'name': 'Anna Garcia', 'department': 'IT', 'occupation': 'Network Engineer', 'email': 'anna.garcia@company.com', 'phone': '+1-555-1008', 'nin': 'EMP008', 'status': 'Active'},
        {'name': 'Robert Martinez', 'department': 'Maintenance', 'occupation': 'Maintenance Technician', 'email': 'robert.martinez@company.com', 'phone': '+1-555-1009', 'nin': 'EMP009', 'status': 'Active'},
        {'name': 'Jennifer Anderson', 'department': 'Finance', 'occupation': 'Accountant', 'email': 'jennifer.anderson@company.com', 'phone': '+1-555-1010', 'nin': 'EMP010', 'status': 'Active'},
    ]
    
    users = []
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults={
                'name': user_data['name'],
                'department': user_data['department'],
                'occupation': user_data['occupation'],
                'phone': user_data['phone'],
                'nin': user_data['nin'],
                'status': user_data['status']
            }
        )
        users.append(user)
        if created:
            print(f"Created user: {user.name}")
    
    return users

def create_assets(categories, suppliers, locations):
    """Create sample assets"""
    assets_data = [
        # Computers & Laptops
        {'asset_name': 'Dell OptiPlex 7090', 'category': 'Computers & Laptops', 'purchase_date': '2023-01-15', 'purchase_cost': 1200.00, 'status': 'Active', 'serial_number': 'DL001', 'supplier': 'Dell Technologies'},
        {'asset_name': 'HP EliteBook 850', 'category': 'Computers & Laptops', 'purchase_date': '2023-02-20', 'purchase_cost': 1500.00, 'status': 'Active', 'serial_number': 'HP001', 'supplier': 'HP Enterprise'},
        {'asset_name': 'MacBook Pro 16"', 'category': 'Computers & Laptops', 'purchase_date': '2023-03-10', 'purchase_cost': 2500.00, 'status': 'Active', 'serial_number': 'MB001', 'supplier': 'Apple Business'},
        {'asset_name': 'Dell Latitude 5520', 'category': 'Computers & Laptops', 'purchase_date': '2023-04-05', 'purchase_cost': 1100.00, 'status': 'Maintenance', 'serial_number': 'DL002', 'supplier': 'Dell Technologies'},
        
        # Mobile Devices
        {'asset_name': 'iPhone 14 Pro', 'category': 'Mobile Devices', 'purchase_date': '2023-05-12', 'purchase_cost': 999.00, 'status': 'Active', 'serial_number': 'IP001', 'supplier': 'Apple Business'},
        {'asset_name': 'Samsung Galaxy S23', 'category': 'Mobile Devices', 'purchase_date': '2023-06-18', 'purchase_cost': 799.00, 'status': 'Active', 'serial_number': 'SG001', 'supplier': 'Tech Solutions Inc'},
        {'asset_name': 'iPad Pro 12.9"', 'category': 'Mobile Devices', 'purchase_date': '2023-07-22', 'purchase_cost': 1099.00, 'status': 'Active', 'serial_number': 'IP002', 'supplier': 'Apple Business'},
        
        # Office Furniture
        {'asset_name': 'Herman Miller Aeron Chair', 'category': 'Office Furniture', 'purchase_date': '2023-01-30', 'purchase_cost': 1200.00, 'status': 'Active', 'serial_number': 'HM001', 'supplier': 'Office Depot Pro'},
        {'asset_name': 'IKEA Bekant Desk', 'category': 'Office Furniture', 'purchase_date': '2023-02-15', 'purchase_cost': 200.00, 'status': 'Active', 'serial_number': 'IK001', 'supplier': 'Office Depot Pro'},
        {'asset_name': 'Steelcase Think Chair', 'category': 'Office Furniture', 'purchase_date': '2023-03-25', 'purchase_cost': 800.00, 'status': 'Active', 'serial_number': 'SC001', 'supplier': 'Office Depot Pro'},
        
        # Network Equipment
        {'asset_name': 'Cisco Catalyst 2960 Switch', 'category': 'Network Equipment', 'purchase_date': '2023-01-10', 'purchase_cost': 500.00, 'status': 'Active', 'serial_number': 'CS001', 'supplier': 'Cisco Systems'},
        {'asset_name': 'Dell PowerEdge R740 Server', 'category': 'Network Equipment', 'purchase_date': '2023-02-28', 'purchase_cost': 5000.00, 'status': 'Active', 'serial_number': 'DE001', 'supplier': 'Dell Technologies'},
        {'asset_name': 'HP ProLiant DL380 Server', 'category': 'Network Equipment', 'purchase_date': '2023-04-12', 'purchase_cost': 4500.00, 'status': 'Active', 'serial_number': 'HP002', 'supplier': 'HP Enterprise'},
        
        # Printers & Scanners
        {'asset_name': 'HP LaserJet Pro 400', 'category': 'Printers & Scanners', 'purchase_date': '2023-03-08', 'purchase_cost': 300.00, 'status': 'Active', 'serial_number': 'HP003', 'supplier': 'HP Enterprise'},
        {'asset_name': 'Canon imageRUNNER 2530i', 'category': 'Printers & Scanners', 'purchase_date': '2023-05-20', 'purchase_cost': 800.00, 'status': 'Active', 'serial_number': 'CN001', 'supplier': 'Tech Solutions Inc'},
        
        # Vehicles
        {'asset_name': 'Toyota Camry 2023', 'category': 'Vehicles', 'purchase_date': '2023-06-01', 'purchase_cost': 25000.00, 'status': 'Active', 'serial_number': 'TC001', 'supplier': 'Tech Solutions Inc'},
        {'asset_name': 'Ford Transit Van', 'category': 'Vehicles', 'purchase_date': '2023-07-15', 'purchase_cost': 35000.00, 'status': 'Active', 'serial_number': 'FT001', 'supplier': 'Tech Solutions Inc'},
    ]
    
    assets = []
    for asset_data in assets_data:
        # Find category and supplier
        category = next((cat for cat in categories if cat.category_name == asset_data['category']), None)
        supplier = next((sup for sup in suppliers if sup.name == asset_data['supplier']), None)
        location = random.choice(locations)
        
        asset, created = Asset.objects.get_or_create(
            serial_number=asset_data['serial_number'],
            defaults={
                'asset_name': asset_data['asset_name'],
                'category': category,
                'purchase_date': datetime.strptime(asset_data['purchase_date'], '%Y-%m-%d').date(),
                'purchase_cost': Decimal(str(asset_data['purchase_cost'])),
                'status': asset_data['status'],
                'location_id': location.location_id,
                'supplier_id': supplier.supplier_id if supplier else None,
                'warranty_expiry': datetime.strptime(asset_data['purchase_date'], '%Y-%m-%d').date() + timedelta(days=365)
            }
        )
        assets.append(asset)
        if created:
            print(f"Created asset: {asset.asset_name}")
    
    return assets

def create_maintenance_staff():
    """Create sample maintenance staff"""
    staff_data = [
        {'name': 'Tom Wilson', 'phone': '+1-555-2001', 'email': 'tom.wilson@company.com', 'specialization': 'Computer Hardware'},
        {'name': 'Maria Rodriguez', 'phone': '+1-555-2002', 'email': 'maria.rodriguez@company.com', 'specialization': 'Network Equipment'},
        {'name': 'Kevin Chen', 'phone': '+1-555-2003', 'email': 'kevin.chen@company.com', 'specialization': 'Office Equipment'},
        {'name': 'Susan Lee', 'phone': '+1-555-2004', 'email': 'susan.lee@company.com', 'specialization': 'Mobile Devices'},
    ]
    
    staff = []
    for staff_data_item in staff_data:
        staff_member, created = MaintenanceStaff.objects.get_or_create(
            email=staff_data_item['email'],
            defaults={
                'name': staff_data_item['name'],
                'phone': staff_data_item['phone'],
                'specialization': staff_data_item['specialization']
            }
        )
        staff.append(staff_member)
        if created:
            print(f"Created maintenance staff: {staff_member.name}")
    
    return staff

def create_maintenance_records(assets, staff):
    """Create sample maintenance records"""
    maintenance_data = [
        {'asset': 'DL002', 'date': '2023-08-15', 'description': 'Hard drive replacement', 'cost': 150.00, 'staff': 'Tom Wilson'},
        {'asset': 'HP003', 'date': '2023-09-10', 'description': 'Toner cartridge replacement', 'cost': 50.00, 'staff': 'Kevin Chen'},
        {'asset': 'CS001', 'date': '2023-10-05', 'description': 'Firmware update', 'cost': 0.00, 'staff': 'Maria Rodriguez'},
        {'asset': 'IP001', 'date': '2023-11-20', 'description': 'Screen repair', 'cost': 200.00, 'staff': 'Susan Lee'},
    ]
    
    for maint_data in maintenance_data:
        asset = next((a for a in assets if a.serial_number == maint_data['asset']), None)
        staff_member = next((s for s in staff if s.name == maint_data['staff']), None)
        
        if asset and staff_member:
            maintenance, created = Maintenance.objects.get_or_create(
                asset=asset,
                maintenance_date=datetime.strptime(maint_data['date'], '%Y-%m-%d').date(),
                defaults={
                    'description': maint_data['description'],
                    'cost': Decimal(str(maint_data['cost'])),
                    'staff': staff_member,
                    'performed_by': staff_member.name
                }
            )
            if created:
                print(f"Created maintenance record: {maintenance.description}")

def create_assignments(assets, users):
    """Create sample assignments"""
    # Assign some assets to users
    assignments_data = [
        {'asset': 'DL001', 'user': 'John Smith', 'assigned_date': '2023-01-20'},
        {'asset': 'HP001', 'user': 'Sarah Johnson', 'assigned_date': '2023-02-25'},
        {'asset': 'MB001', 'user': 'David Brown', 'assigned_date': '2023-03-15'},
        {'asset': 'IP001', 'user': 'Lisa Wilson', 'assigned_date': '2023-05-15'},
        {'asset': 'SG001', 'user': 'Mike Davis', 'assigned_date': '2023-06-20'},
        {'asset': 'IP002', 'user': 'Emma Taylor', 'assigned_date': '2023-07-25'},
        {'asset': 'HM001', 'user': 'John Smith', 'assigned_date': '2023-02-01'},
        {'asset': 'IK001', 'user': 'Sarah Johnson', 'assigned_date': '2023-02-20'},
        {'asset': 'SC001', 'user': 'David Brown', 'assigned_date': '2023-03-30'},
    ]
    
    for assign_data in assignments_data:
        asset = next((a for a in assets if a.serial_number == assign_data['asset']), None)
        user = next((u for u in users if u.name == assign_data['user']), None)
        
        if asset and user:
            assignment, created = Assignment.objects.get_or_create(
                asset=asset,
                user=user,
                assigned_date=datetime.strptime(assign_data['assigned_date'], '%Y-%m-%d').date(),
                defaults={
                    'status': 'Active',
                    'description': f'Assigned to {user.name} for daily use',
                    'approved_by': 'HR Manager'
                }
            )
            if created:
                print(f"Created assignment: {asset.asset_name} -> {user.name}")

def create_asset_valuations(assets):
    """Create sample asset valuations"""
    for asset in assets:
        if asset.purchase_date and asset.purchase_cost:
            # Create initial valuation
            initial_valuation, created = AssetValuation.objects.get_or_create(
                asset=asset,
                valuation_date=asset.purchase_date,
                defaults={
                    'method': 'Purchase Price',
                    'initial_value': asset.purchase_cost,
                    'current_value': asset.purchase_cost
                }
            )
            
            # Create current valuation (with some depreciation)
            current_date = asset.purchase_date + timedelta(days=random.randint(30, 365))
            depreciation_rate = random.uniform(0.05, 0.20)  # 5-20% depreciation
            current_value = float(asset.purchase_cost) * (1 - depreciation_rate)
            
            current_valuation, created = AssetValuation.objects.get_or_create(
                asset=asset,
                valuation_date=current_date,
                defaults={
                    'method': 'Depreciation',
                    'initial_value': asset.purchase_cost,
                    'current_value': Decimal(str(round(current_value, 2)))
                }
            )
            
            if created:
                print(f"Created valuation for: {asset.asset_name}")

def create_buyers():
    """Create sample buyers for disposal"""
    buyers_data = [
        {'name': 'Tech Resale Inc', 'phone': '+1-555-3001', 'email': 'buy@techresale.com', 'address': '100 Resale Street, Tech City', 'tin': 'TR123456789'},
        {'name': 'Office Liquidators', 'phone': '+1-555-3002', 'email': 'sales@officeliquidators.com', 'address': '200 Liquidator Ave, Business District', 'tin': 'OL987654321'},
        {'name': 'Green Electronics', 'phone': '+1-555-3003', 'email': 'info@greenelectronics.com', 'address': '300 Green Way, Eco Park', 'tin': 'GE456789123'},
    ]
    
    buyers = []
    for buyer_data in buyers_data:
        buyer, created = Buyer.objects.get_or_create(
            name=buyer_data['name'],
            defaults={
                'phone': buyer_data['phone'],
                'email': buyer_data['email'],
                'address': buyer_data['address'],
                'tin': buyer_data['tin']
            }
        )
        buyers.append(buyer)
        if created:
            print(f"Created buyer: {buyer.name}")
    
    return buyers

def create_disposals(assets, buyers):
    """Create sample disposal records"""
    # Dispose of some older assets
    disposal_data = [
        {'asset': 'DL002', 'date': '2023-12-01', 'value': 200.00, 'buyer': 'Tech Resale Inc', 'reason': 'End of life, replaced with newer model'},
        {'asset': 'HP003', 'date': '2023-12-15', 'value': 50.00, 'buyer': 'Office Liquidators', 'reason': 'Frequent maintenance issues'},
    ]
    
    for disp_data in disposal_data:
        asset = next((a for a in assets if a.serial_number == disp_data['asset']), None)
        buyer = next((b for b in buyers if b.name == disp_data['buyer']), None)
        
        if asset and buyer:
            disposal, created = Disposal.objects.get_or_create(
                asset=asset,
                disposal_date=datetime.strptime(disp_data['date'], '%Y-%m-%d').date(),
                defaults={
                    'disposal_value': Decimal(str(disp_data['value'])),
                    'buyer': buyer,
                    'reason': disp_data['reason']
                }
            )
            if created:
                print(f"Created disposal record: {asset.asset_name} -> {buyer.name}")

def main():
    """Main function to populate all sample data"""
    print("Starting sample data population...")
    
    # Create all entities
    categories = create_categories()
    suppliers = create_suppliers()
    locations = create_locations()
    users = create_users()
    assets = create_assets(categories, suppliers, locations)
    staff = create_maintenance_staff()
    buyers = create_buyers()
    
    # Create relationships
    create_maintenance_records(assets, staff)
    create_assignments(assets, users)
    create_asset_valuations(assets)
    create_disposals(assets, buyers)
    
    print("\nSample data population completed!")
    print(f"Created:")
    print(f"   - {len(categories)} categories")
    print(f"   - {len(suppliers)} suppliers")
    print(f"   - {len(locations)} locations")
    print(f"   - {len(users)} users")
    print(f"   - {len(assets)} assets")
    print(f"   - {len(staff)} maintenance staff")
    print(f"   - {len(buyers)} buyers")
    print(f"   - {Maintenance.objects.count()} maintenance records")
    print(f"   - {Assignment.objects.count()} assignments")
    print(f"   - {AssetValuation.objects.count()} valuations")
    print(f"   - {Disposal.objects.count()} disposals")
    
    print("\nYou can now run the reports from REPORTS_AND_ANALYTICS.md!")

if __name__ == "__main__":
    main()
