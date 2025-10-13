from rest_framework import viewsets
from .models import (
    Asset, User, Category, Supplier, Location, Buyer, Disposal,
    MaintenanceStaff, Maintenance, Assignment, AssetValuation
)
from .serializers import (
    AssetSerializer, UserSerializer, CategorySerializer,
    SupplierSerializer, LocationSerializer, BuyerSerializer, DisposalSerializer,
    MaintenanceStaffSerializer, MaintenanceSerializer, AssignmentSerializer, AssetValuationSerializer
)
from rest_framework.response import Response
from rest_framework import status
from .models import Category


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer

    def create(self, request, *args, **kwargs):
        # Validate category_id from the incoming payload before attempting
        # to create. This ensures we return a 400 when the frontend sends an
        # invalid FK id instead of silently creating a null relationship.
        cat_id = request.data.get('category_id', None)
        if cat_id not in (None, '', 'null'):
            try:
                cid = int(cat_id)
            except (TypeError, ValueError):
                return Response({'category_id': ['Invalid pk format']}, status=status.HTTP_400_BAD_REQUEST)
            if not Category.objects.filter(pk=cid).exists():
                return Response({'category_id': [f'Invalid pk "{cid}" - object does not exist.']}, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        cat_id = request.data.get('category_id', None)
        if cat_id not in (None, '', 'null'):
            try:
                cid = int(cat_id)
            except (TypeError, ValueError):
                return Response({'category_id': ['Invalid pk format']}, status=status.HTTP_400_BAD_REQUEST)
            if not Category.objects.filter(pk=cid).exists():
                return Response({'category_id': [f'Invalid pk "{cid}" - object does not exist.']}, status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, *args, **kwargs)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer


class BuyerViewSet(viewsets.ModelViewSet):
    queryset = Buyer.objects.all()
    serializer_class = BuyerSerializer


class DisposalViewSet(viewsets.ModelViewSet):
    queryset = Disposal.objects.all()
    serializer_class = DisposalSerializer


class MaintenanceStaffViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceStaff.objects.all()
    serializer_class = MaintenanceStaffSerializer


class MaintenanceViewSet(viewsets.ModelViewSet):
    queryset = Maintenance.objects.all()
    serializer_class = MaintenanceSerializer


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer


class AssetValuationViewSet(viewsets.ModelViewSet):
    queryset = AssetValuation.objects.all()
    serializer_class = AssetValuationSerializer
