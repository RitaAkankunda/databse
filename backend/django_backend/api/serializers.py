from rest_framework import serializers
from .models import (
    Asset, User, Category, Supplier, Location, Buyer, Disposal,
    MaintenanceStaff, Maintenance, Assignment, AssetValuation
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


class AssetSerializer(serializers.ModelSerializer):
    # Use PrimaryKeyRelatedField for proper FK validation at the serializer
    # layer. The frontend sends `category_id`; we expose a write-only
    # `category_id` field that maps to the `category` relation. This will
    # produce validation errors when an invalid category id is supplied.
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    def to_internal_value(self, data):
        # Allow incoming `category_id` to be treated as `category` for
        # PrimaryKeyRelatedField validation.
        if 'category_id' in data and 'category' not in data:
            data = data.copy()
            data['category'] = data.get('category_id')
        return super().to_internal_value(data)

    def validate(self, attrs):
        # Provide a clear validation error when frontend sends a category_id
        # that does not exist. `category` will be present if `category_id`
        # was supplied in the input and mapped by to_internal_value.
        from django.core.exceptions import ObjectDoesNotExist
        category_val = None
        # attrs may include the resolved category object (if valid) or the
        # raw id in case validation hasn't run; check initial_data for clarity.
        if hasattr(self, 'initial_data') and isinstance(self.initial_data, dict):
            category_val = self.initial_data.get('category_id', None)
        if category_val is not None:
            if category_val == '' or category_val is None:
                return attrs
            # If provided and not null, ensure object exists
            from .models import Category
            if not Category.objects.filter(pk=category_val).exists():
                raise serializers.ValidationError({'category_id': [f'Invalid pk "{category_val}" - object does not exist.']})
        return attrs

    def create(self, validated_data):
        # Pop any write-only category_id and resolve to category instance
        category_id = validated_data.pop('category_id', None)
        if category_id is not None and category_id != '':
            from .models import Category
            try:
                validated_data['category'] = Category.objects.get(pk=category_id)
            except Category.DoesNotExist:
                raise serializers.ValidationError({'category_id': [f'Invalid pk "{category_id}" - object does not exist.']})

        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Handle category_id for updates similarly
        category_id = validated_data.pop('category_id', None)
        if category_id is not None:
            from .models import Category
            if category_id == '' or category_id is None:
                validated_data['category'] = None
            else:
                try:
                    validated_data['category'] = Category.objects.get(pk=category_id)
                except Category.DoesNotExist:
                    raise serializers.ValidationError({'category_id': [f'Invalid pk "{category_id}" - object does not exist.']})

        return super().update(instance, validated_data)

    def validate_category_id(self, value):
        # Field-level validator called before create/update; ensures the
        # provided category id exists.
        if value is None or value == '':
            return value
        from .models import Category
        if not Category.objects.filter(pk=value).exists():
            raise serializers.ValidationError([f'Invalid pk "{value}" - object does not exist.'])
        return value

    class Meta:
        model = Asset
        fields = '__all__'


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'


class BuyerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Buyer
        fields = '__all__'


class DisposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disposal
        fields = '__all__'


class MaintenanceStaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceStaff
        fields = '__all__'


class MaintenanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Maintenance
        fields = '__all__'


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = '__all__'


class AssetValuationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssetValuation
        fields = '__all__'
