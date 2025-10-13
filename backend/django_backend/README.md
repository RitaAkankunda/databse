# Django backend (minimal)

This folder contains a minimal Django backend intended to replace the Node/Prisma backend. It exposes REST endpoints for `assets`, `users`, and `categories` and is configured to read database connection values from the local `.env` file in this folder.

Prereqs
- Python 3.10+
- virtualenv (optional)
- MySQL reachable at the `DATABASE_URL` from the repo `.env` (currently points to your MySQL host)

Quick start (PowerShell):

```powershell
# from backend/django_backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# ensure `.env` is configured with DB_* variables (see example below). This repo uses `mysql-connector-python` on Windows by default.
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

Open the admin at http://127.0.0.1:8000/admin/ and the API root at http://127.0.0.1:8000/api/

Connecting with MySQL Workbench
- Use the same host, port, database, username and password from the `.env` file in `backend/django_backend/.env` to connect with MySQL Workbench.

Example `.env` (already present in this folder):

```
DB_ENGINE=mysql.connector.django
DB_NAME=assets_db
DB_USER=ams_db
DB_PASSWORD="Riri2004#"
DB_HOST=127.0.0.1
DB_PORT=3307
```

Windows notes
- `requirements.txt` includes `mysql-connector-python` which avoids compiling C extensions on Windows. If you prefer the native adapter for performance, install the OS build tools and `mysqlclient`, and set `DB_ENGINE=django.db.backends.mysql` in `.env`.

Typical steps to start the app (PowerShell):

```powershell
# from backend/django_backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```
