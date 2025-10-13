from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    AssetViewSet, UserViewSet, CategoryViewSet,
    SupplierViewSet, LocationViewSet, MaintenanceStaffViewSet,
    MaintenanceViewSet, BuyerViewSet, DisposalViewSet,
    AssignmentViewSet, AssetValuationViewSet,
)

router = DefaultRouter()
router.register(r'assets', AssetViewSet, basename='asset')
router.register(r'users', UserViewSet, basename='user')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'buyers', BuyerViewSet, basename='buyer')
router.register(r'disposals', DisposalViewSet, basename='disposal')
router.register(r'maintenance-staff', MaintenanceStaffViewSet, basename='maintenance-staff')
router.register(r'maintenance', MaintenanceViewSet, basename='maintenance')
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'valuations', AssetValuationViewSet, basename='valuation')


urlpatterns = [
    path('', include(router.urls)),
]
