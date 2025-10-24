# Asset Management System

This repository contains an Asset Management System built with a Django REST Framework backend and a Next.js frontend.

> Short status: Backend implemented in Django (MySQL). Frontend implemented in Next.js (TypeScript). The project is production-ready for core asset-management features.

---

## Project overview

- Database: MySQL
- Backend: Django + Django REST Framework
- Frontend: Next.js with TypeScript
- Purpose: Store, track and report on organizational assets, including lifecycle operations (assignments, maintenance, disposals), suppliers/buyers, and valuations.

---

## What this repo contains

- `backend/django_backend/` — Django project and REST API (models, serializers, views, migrations, management commands). This is the canonical backend.
- `frontend/` — Next.js application (app router) that consumes the Django API.
- `reports/sql/` — SQL reporting scripts used for exports and analytics.
- `scripts/` — Utility scripts and helpers (data import/export, sample data population).

---

## Key features

- Asset master data (create, update, list)
- Asset lifecycle: assignments, maintenance records, disposals
- Asset valuations and depreciation tracking
- User and role management (with admin UI)
- Reporting & analytics (SQL scripts + API endpoints)
- Import/export utilities and sample data population

---

## API endpoints (examples)

- `/api/users/`
- `/api/assets/`
- `/api/categories/`
- `/api/suppliers/`
- `/api/locations/`
- `/api/assignments/`
- `/api/maintenance/`
- `/api/valuations/`
- `/api/disposals/`

(Full API and models are implemented in `backend/django_backend/`.)

---

## Quickstart — Django backend (recommended)

Open a PowerShell terminal and run the following from `backend/django_backend/`:

```powershell
# from backend/django_backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# configure your .env (see README.md in that folder)
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

API root: `http://127.0.0.1:8000/api/`
Admin: `http://127.0.0.1:8000/admin/`

See `backend/django_backend/README.md` and `backend/django_backend/SETUP.md` for full setup details and MySQL instructions.

---

## Quickstart — Frontend (Next.js)

From `frontend/`:

```bash
npm install
# set NEXT_PUBLIC_API_BASE_URL to the running backend (e.g. http://127.0.0.1:8000) in .env.local
npm run dev
```

Open `http://localhost:3000`.

Notes:
- The frontend expects `NEXT_PUBLIC_API_BASE_URL` to point to the Django backend.

---

## Database & reporting

- MySQL is the primary database (sqlite fallback removed). See `backend/django_backend/SETUP.md`.
- Reporting SQL scripts are in `reports/sql/` (e.g. `full_system_report_mysql.sql`).

---

## Tests & QA

- Unit and integration tests are (or can be) run via Django test runner for backend and your chosen test runner for the frontend. See each subproject’s README for details.

---

## Where to look for more docs

- `backend/django_backend/README.md` — detailed backend docs and quickstart.
- `backend/django_backend/SETUP.md` — MySQL setup and environment variables.
- `frontend/README.md` — frontend setup and environment configuration.
- `reports/sql/` — SQL queries used for reporting.
- `backend/django_backend/DATABASE_PROGRESS.md` — progress report and implementation details.

---

## Recommended next steps

- Verify and update `.env`/`.env.local` examples to match your deployment secrets.
- Run migrations and populate sample data (`populate_sample_data.py`) if needed.
- Update CI/CD or deployment scripts to start the Django backend and build the Next.js frontend.
- If you want a single-source changelog or release notes, add `CHANGELOG.md`.

---

## Contact & contribution

If you'd like me to convert additional docs (ERDs, API docs) into this README or add diagrams, say the word and I’ll add them.

---

*Generated from project DATABASE_PROGRESS notes.*
