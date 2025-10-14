# Django backend (minimal)

This folder contains a minimal Django backend intended to replace the Node/Prisma backend. It exposes REST endpoints for `assets`, `users`, and `categories` and is configured to read database connection values from the local `.env` file in this folder.

## Prerequisites
- Python 3.10+
- virtualenv (optional)
- MySQL Server (required)

## Database Configuration
This application uses MySQL as the primary database. See `SETUP.md` for detailed MySQL setup instructions.

**Important**: Create a `.env` file in this directory before running the application. The `.env` file is gitignored for security.

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
