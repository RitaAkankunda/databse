from rest_framework import viewsets
from django.db.models import OuterRef, Subquery
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
from rest_framework.decorators import api_view
from django.db.models import Count
from django.db import connection
from django.db.models import Sum
from django.db.models.functions import TruncYear
from django.db.models.functions import ExtractYear, ExtractMonth


class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer

    def get_queryset(self):
        # Annotate assets with their latest assignment (by assigned_date then id)
        latest = Assignment.objects.filter(asset=OuterRef('pk')).order_by('-assigned_date', '-assignment_id')
        # select_related to eager-load the category relation for serializers
        qs = Asset.objects.select_related('category').all().annotate(
            current_holder_name=Subquery(latest.values('user__name')[:1]),
            current_assignment_status=Subquery(latest.values('status')[:1]),
            current_assignment_date=Subquery(latest.values('assigned_date')[:1])
        )
        return qs

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


@api_view(['GET'])
def assets_by_category(request):
    """Return counts of assets grouped by category_name."""
    qs = Asset.objects.values('category__category_name').annotate(count=Count('asset_id')).order_by('-count')
    data = []
    for item in qs:
        name = item.get('category__category_name') or 'Uncategorized'
        data.append({'category': name, 'count': item.get('count', 0)})
    return Response(data)


@api_view(['GET'])
def valuation_histogram(request):
    """Return a simple histogram of AssetValuation.current_value bucketed by `bucket` query param."""
    try:
        bucket = int(request.GET.get('bucket', 1000))
        if bucket <= 0:
            bucket = 1000
    except Exception:
        bucket = 1000

    # table name for AssetValuation in this app is 'api_assetvaluation'
    sql = f"""
        SELECT FLOOR(current_value / %s) * %s AS bucket, COUNT(*) AS cnt
        FROM api_assetvaluation
        WHERE current_value IS NOT NULL
        GROUP BY bucket
        ORDER BY bucket
    """
    with connection.cursor() as c:
        c.execute(sql, [bucket, bucket])
        rows = [{'bucket': int(r[0]) if r[0] is not None else 0, 'count': int(r[1])} for r in c.fetchall()]

    return Response(rows)


@api_view(['GET'])
def sales_report(request):
    """Return aggregated disposal sales by year and quarter.

    Response JSON shape:
    {
      "yearly": [{"year": 2023, "total": 12345.67}, ...],
      "quarterly": [{"year":2023, "quarter":1, "total": 3456.78}, ...]
    }
    """
    try:
        qs = Disposal.objects.filter(disposal_value__isnull=False)
        yearly_qs = qs.annotate(year=TruncYear('disposal_date')).values('year').annotate(total=Sum('disposal_value')).order_by('year')
        # quarterly: use ORM to extract year and month (DB-agnostic), then collapse months into quarters in Python
        month_qs = qs.annotate(year=ExtractYear('disposal_date'), month=ExtractMonth('disposal_date')).values('year', 'month').annotate(total=Sum('disposal_value')).order_by('year', 'month')
        # build quarterly rows from month aggregates
        qmap = {}
        for item in month_qs:
            yr = item.get('year')
            mo = item.get('month') or 0
            total = float(item.get('total') or 0)
            quarter = ((int(mo) - 1) // 3) + 1 if mo and int(mo) >= 1 else 1
            key = (int(yr), int(quarter))
            qmap[key] = qmap.get(key, 0) + total
        qrows = []
        for (yr, qtr), tot in sorted(qmap.items()):
            qrows.append({'year': int(yr), 'quarter': int(qtr), 'total': float(tot)})
        yrows = []
        for item in yearly_qs:
            yr = item.get('year')
            total = float(item.get('total') or 0)
            # TruncYear returns a date; use year attribute if present
            if hasattr(yr, 'year'):
                yrows.append({'year': int(yr.year), 'total': total})
            else:
                yrows.append({'year': int(yr), 'total': total})

        return Response({'yearly': yrows, 'quarterly': qrows})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
