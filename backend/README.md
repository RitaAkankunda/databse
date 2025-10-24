# Backend (Django)

The Node/Prisma backend previously present in this repository has been removed. The canonical backend for this project is the Django application located at `backend/django_backend/`.

Please use the Django backend for all API development, migrations, and database access. See the following files for setup and running instructions (MySQL is required):

- `backend/django_backend/README.md`
- `backend/django_backend/SETUP.md`

Quick-start (PowerShell):

```powershell
cd backend/django_backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

API root: http://127.0.0.1:8000/api/

If you have any automation or scripts that referenced the old Node/Prisma toolchain (Prisma client, `prisma` commands, `backend/package.json`), they can be removed or replaced with Django equivalents.