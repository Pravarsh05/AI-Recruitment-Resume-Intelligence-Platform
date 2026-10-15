import os
from .base import *

DEBUG = True

# Database selection: Postgres with pgvector if configured, SQLite3 fallback for local dev
DATABASE_URL = os.getenv('DATABASE_URL')
POSTGRES_DB = os.getenv('POSTGRES_DB')

if POSTGRES_DB or DATABASE_URL:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': POSTGRES_DB or os.getenv('DB_NAME', 'recruit_ai'),
            'USER': os.getenv('POSTGRES_USER', 'postgres'),
            'PASSWORD': os.getenv('POSTGRES_PASSWORD', 'postgres'),
            'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
            'PORT': os.getenv('POSTGRES_PORT', '5432'),
        }
    }
    # Add pgvector if on Postgres
    if 'pgvector' not in INSTALLED_APPS:
        INSTALLED_APPS.insert(0, 'pgvector')
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
