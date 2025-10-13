from django.db import models


class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    category_name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.category_name


class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    department = models.CharField(max_length=255, null=True, blank=True)
    occupation = models.CharField(max_length=255, null=True, blank=True)
    email = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    nin = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return self.name


class Asset(models.Model):
    asset_id = models.AutoField(primary_key=True)
    asset_name = models.CharField(max_length=255)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name='assets')
    purchase_date = models.DateField(null=True, blank=True)
    purchase_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=100, null=True, blank=True)
    location_id = models.IntegerField(null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)
    supplier_id = models.IntegerField(null=True, blank=True)
    serial_number = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.asset_name


class Supplier(models.Model):
    supplier_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.CharField(max_length=255, null=True, blank=True)
    address = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.name


class Location(models.Model):
    location_id = models.AutoField(primary_key=True)
    building = models.CharField(max_length=255, null=True, blank=True)
    postal_address = models.CharField(max_length=255, null=True, blank=True)
    geographical_location = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.building or str(self.location_id)


class Buyer(models.Model):
    buyer_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.CharField(max_length=255, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    tin = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return self.name


class Disposal(models.Model):
    disposal_id = models.AutoField(primary_key=True)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='disposals')
    disposal_date = models.DateField(null=True, blank=True)
    disposal_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    buyer = models.ForeignKey(Buyer, null=True, blank=True, on_delete=models.SET_NULL, related_name='disposals')
    reason = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Disposal {self.disposal_id} for {self.asset}"


class MaintenanceStaff(models.Model):
    m_staff_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50, null=True, blank=True)
    email = models.CharField(max_length=255, null=True, blank=True)
    specialization = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.name


class Maintenance(models.Model):
    maintenance_id = models.AutoField(primary_key=True)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='maintenance')
    maintenance_date = models.DateField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    staff = models.ForeignKey(MaintenanceStaff, null=True, blank=True, on_delete=models.SET_NULL, related_name='maintenance')
    performed_by = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"Maintenance {self.maintenance_id} for {self.asset}"


class Assignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='assignments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignments')
    assigned_date = models.DateField(null=True, blank=True)
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    approved_by = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"Assignment {self.assignment_id} - {self.asset} to {self.user}"


class AssetValuation(models.Model):
    valuation_id = models.AutoField(primary_key=True)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='asset_valuation')
    valuation_date = models.DateField(null=True, blank=True)
    method = models.CharField(max_length=255, null=True, blank=True)
    initial_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    current_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"Valuation {self.valuation_id} for {self.asset}"
