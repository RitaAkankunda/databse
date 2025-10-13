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

ALLOWED_HOSTS = ['*']

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
# honor DB_ENGINE and DB_* env vars. When DEBUG is True and no DB config is
# provided, fall back to sqlite to make `runserver` safe for local development.
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
else:
    DB_ENGINE = os.getenv('DB_ENGINE')
    # If DB_ENGINE not provided, assume sqlite in DEBUG, otherwise require vars
    if not DB_ENGINE and DEBUG:
        SQLITE_PATH = BASE_DIR / 'db.sqlite3'
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': str(SQLITE_PATH),
            }
        }
    else:
        # When DB_ENGINE is provided (eg. 'django.db.backends.mysql'), build config
        DB_ENGINE = DB_ENGINE or 'django.db.backends.sqlite3'
        if DB_ENGINE == 'django.db.backends.sqlite3':
            SQLITE_PATH = BASE_DIR / 'db.sqlite3'
            DATABASES = {
                'default': {
                    'ENGINE': 'django.db.backends.sqlite3',
                    'NAME': str(SQLITE_PATH),
                }
            }
        else:
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

            # If the configured backend requires an external DB driver that isn't
            # installed (for example MySQL), fall back to sqlite when DEBUG is
            # enabled so developers can run the dev server without the DB.
            if DEBUG:
                engine = DATABASES['default'].get('ENGINE', '')
                needs_mysql = 'mysql' in engine or 'mysql' in os.getenv('DB_ENGINE', '')
                if needs_mysql:
                    # Try to detect installed MySQL client libraries
                    try:
                        import importlib
                        # mysql-connector-python exposes 'mysql', mysqlclient exposes 'MySQLdb'
                        mysql_module = importlib.import_module('mysql')
                    except Exception:
                        try:
                            import importlib
                            mysql_module = importlib.import_module('MySQLdb')
                        except Exception:
                            # No MySQL driver found; warn and switch to sqlite for dev
                            print("WARNING: MySQL DB engine configured but no MySQL driver is installed. Falling back to sqlite because DEBUG=True.")
                            SQLITE_PATH = BASE_DIR / 'db.sqlite3'
                            DATABASES = {
                                'default': {
                                    'ENGINE': 'django.db.backends.sqlite3',
                                    'NAME': str(SQLITE_PATH),
                                }
                            }

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# DRF
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
}

# CORS - allow local frontend during development (adjust in prod)
CORS_ALLOW_ALL_ORIGINS = True
