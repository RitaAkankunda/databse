import time
import requests

BASE = 'http://127.0.0.1:8000'

resources = {
    'categories': {
        'create': {'category_name': 'TestCategory', 'description': 'created by test'},
        'patch_key': 'category_id'
    },
    'suppliers': {
        'create': {'name': 'Test Supplier', 'phone': '12345', 'email': 'test@supplier.local', 'address': '123 Test Ave'},
        'patch_key': 'supplier_id'
    },
    'locations': {
        'create': {'building': 'Test Building', 'postal_address': 'PO Box 1', 'geographical_location': '0,0'},
        'patch_key': 'location_id'
    },
    'users': {
        'create': {'name': 'Test User', 'department': 'IT', 'occupation': 'Dev', 'email': 'test@user.local'},
        'patch_key': 'user_id'
    },
    'assets': {
        'create': {'asset_name': 'Test Asset', 'category': None, 'purchase_date': None, 'purchase_cost': '100.00', 'location_id': None, 'supplier_id': None},
        'patch_key': 'asset_id'
    },
    'assignments': {
        # will be created after creating a user and asset
        'create': {'asset': None, 'user': None, 'assigned_date': '2025-10-12'}, 'patch_key': 'assignment_id'
    },
    'maintenance-staff': {
        'create': {'name': 'Tech One', 'phone': '555', 'email': 'tech@local'}, 'patch_key': 'm_staff_id'
    },
    'maintenance': {
        # will be created after creating an asset and staff
        'create': {'asset': None, 'maintenance_date': '2025-10-12', 'description': 'Routine check', 'cost': '10.00', 'staff': None}, 'patch_key': 'maintenance_id'
    },
    'valuations': {
        'create': {'asset': None, 'valuation_date': '2025-10-12', 'method': 'Test', 'initial_value': '50.00', 'current_value': '45.00'}, 'patch_key': 'valuation_id'
    },
    'disposals': {
        # will be created after creating asset and buyer
        'create': {'asset': None, 'disposal_date': '2025-10-12', 'disposal_value': '5.00', 'buyer': None}, 'patch_key': 'disposal_id'
    },
    'buyers': {
        'create': {'name': 'Buyer One', 'phone': '999', 'email': 'buyer@local', 'address': 'Addr'}, 'patch_key': 'buyer_id'
    }
}

session = requests.Session()

results = {}
created_ids = {}

for name, spec in resources.items():
    url = f"{BASE}/api/{name}/"
    print(f"Testing {name} -> {url}")
    # GET
    t0 = time.time()
    r_get = session.get(url, timeout=5)
    t_get = time.time() - t0
    print(f"  GET {r_get.status_code} ({t_get*1000:.0f} ms)")

    # CREATE if payload provided
    created_id = None
    if spec.get('create'):
        payload = dict(spec['create'])
        # substitute dependent ids from created_ids if placeholders present
        for k, v in payload.items():
            if v is None and k in ('asset', 'user', 'buyer', 'staff'):
                # pick up ids from created resources if available
                if k == 'asset' and 'assets' in created_ids:
                    payload[k] = created_ids['assets']
                if k == 'user' and 'users' in created_ids:
                    payload[k] = created_ids['users']
                if k == 'buyer' and 'buyers' in created_ids:
                    payload[k] = created_ids['buyers']
                if k == 'staff' and 'maintenance-staff' in created_ids:
                    payload[k] = created_ids['maintenance-staff']

        t0 = time.time()
        r_post = session.post(url, json=payload, timeout=5)
        t_post = time.time() - t0
        print(f"  POST {r_post.status_code} ({t_post*1000:.0f} ms)")
        if not r_post.ok:
            try:
                print('    POST error body:', r_post.json())
            except Exception:
                print('    POST error body (text):', r_post.text[:500])
        if r_post.ok:
            try:
                data = r_post.json()
                created_id = data.get(spec['patch_key']) or data.get('id')
                print(f"    created id: {created_id}")
                # store created id by resource name for dependencies
                created_ids[name] = created_id
            except Exception as e:
                print("    post response not json", e)

    # UPDATE if created (use PATCH to avoid full-object requirements)
    if created_id:
        put_url = f"{url}{created_id}/"
        patch_payload = {}
        if spec.get('create'):
            # pick one field to patch (if any strings present)
            for k, v in spec['create'].items():
                if isinstance(v, str) and v:
                    patch_payload[k] = v + ' (edited)'
                    break
        if patch_payload:
            t0 = time.time()
            r_patch = session.patch(put_url, json=patch_payload, timeout=5)
            t_patch = time.time() - t0
            print(f"  PATCH {r_patch.status_code} ({t_patch*1000:.0f} ms)")
            if not r_patch.ok:
                try:
                    print('    PATCH error body:', r_patch.json())
                except Exception:
                    print('    PATCH error body (text):', r_patch.text[:500])

        # DELETE
        t0 = time.time()
        r_del = session.delete(put_url, timeout=5)
        t_del = time.time() - t0
        print(f"  DELETE {r_del.status_code} ({t_del*1000:.0f} ms)")
        if not r_del.ok and r_del.status_code != 204:
            try:
                print('    DELETE error body:', r_del.json())
            except Exception:
                print('    DELETE error body (text):', r_del.text[:500])

print('\nAll tests completed')
