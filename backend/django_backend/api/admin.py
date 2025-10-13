from django.contrib import admin
from .models import Asset, User, Category

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('asset_id', 'asset_name', 'category', 'purchase_cost')


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'name', 'email')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('category_id', 'category_name')

from .models import Supplier, Location, Buyer, Disposal, MaintenanceStaff, Maintenance, Assignment, AssetValuation


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('supplier_id', 'name', 'email')


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('location_id', 'building')


@admin.register(Buyer)
class BuyerAdmin(admin.ModelAdmin):
    list_display = ('buyer_id', 'name', 'email')


@admin.register(Disposal)
class DisposalAdmin(admin.ModelAdmin):
    list_display = ('disposal_id', 'asset', 'disposal_date')


@admin.register(MaintenanceStaff)
class MaintenanceStaffAdmin(admin.ModelAdmin):
    list_display = ('m_staff_id', 'name', 'email')


@admin.register(Maintenance)
class MaintenanceAdmin(admin.ModelAdmin):
    list_display = ('maintenance_id', 'asset', 'maintenance_date')


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('assignment_id', 'asset', 'user')


@admin.register(AssetValuation)
class AssetValuationAdmin(admin.ModelAdmin):
    list_display = ('valuation_id', 'asset', 'valuation_date')
