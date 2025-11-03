import os
from pathlib import Path
from dotenv import load_dotenv

# dj-database-url is optional; only import it if DATABASE_URL is set so that
# a missing package doesn't prevent local development with sqlite.
try:
    import dj_database_url
except Exception:
    dj_database_url = None

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET', 'change-me-for-prod')

DEBUG = os.getenv('DJANGO_DEBUG', '1') == '1'

# ALLOWED_HOSTS: Use '*' for development, specify domains in production
# For production, set ALLOWED_HOSTS env var as comma-separated list: "domain1.com,domain2.com"
ALLOWED_HOSTS_ENV = os.getenv('ALLOWED_HOSTS', '')
ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS_ENV.split(',')] if ALLOWED_HOSTS_ENV else ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'backend_django.utils.request_timer.RequestTimingMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serve static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend_django.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend_django.wsgi.application'

# Database configuration
# Default behavior: when DEBUG is True (development), use a local sqlite database
# to avoid failing the dev server when an external DB (eg. MySQL) isn't available.
# To use MySQL/Postgres in development or production, set either DATABASE_URL or
# DB_ENGINE and the appropriate DB_* environment variables.

DATABASE_URL = os.getenv('DATABASE_URL')

# Helper: prefer DATABASE_URL if set (works with dj-database-url), otherwise
# honor DB_ENGINE and DB_* env vars. This project requires a MySQL-compatible
# database; sqlite fallback has been intentionally removed.
if DATABASE_URL:
    # Expect DATABASE_URL to point to a MySQL-compatible URL when used in this project
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
else:
    DB_ENGINE = os.getenv('DB_ENGINE')
    # Require DB_ENGINE to be explicitly set to a MySQL backend (no sqlite)
    if not DB_ENGINE:
        raise RuntimeError("Database configuration missing: set DATABASE_URL or DB_ENGINE to a MySQL backend (e.g. 'django.db.backends.mysql'). sqlite is disabled.")

    # Build config from DB_* env vars
    DATABASES = {
        'default': {
            'ENGINE': DB_ENGINE,
            'NAME': os.getenv('DB_NAME', ''),
            'USER': os.getenv('DB_USER', ''),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', ''),
        }
    }

    # If a non-sqlite engine is required but the engine isn't MySQL-like, warn
    engine = DATABASES['default'].get('ENGINE', '')
    if 'mysql' not in engine.lower() and 'mariadb' not in engine.lower():
        raise RuntimeError(f"DB_ENGINE must be MySQL/MariaDB for this project; got '{engine}'.")

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# WhiteNoise configuration for static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# DRF
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
}

# CORS Configuration
# For production, set CORS_ALLOWED_ORIGINS env var as comma-separated list
CORS_ALLOWED_ORIGINS_ENV = os.getenv('CORS_ALLOWED_ORIGINS', '')
if CORS_ALLOWED_ORIGINS_ENV:
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_ENV.split(',')]
    CORS_ALLOW_ALL_ORIGINS = False
else:
    # Development: allow all origins
    CORS_ALLOW_ALL_ORIGINS = True
