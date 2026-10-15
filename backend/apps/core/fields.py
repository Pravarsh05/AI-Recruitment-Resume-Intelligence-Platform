from django.db import models
from django.conf import settings

def get_vector_field(dimensions=384, **kwargs):
    """
    Returns pgvector.django.VectorField if on PostgreSQL with pgvector,
    otherwise a JSONField fallback for SQLite / lightweight development.
    """
    is_postgres = False
    default_db = getattr(settings, 'DATABASES', {}).get('default', {})
    engine = default_db.get('ENGINE', '')
    if 'postgresql' in engine and 'pgvector' in getattr(settings, 'INSTALLED_APPS', []):
        try:
            from pgvector.django import VectorField
            return VectorField(dimensions=dimensions, **kwargs)
        except ImportError:
            pass

    # Fallback for SQLite / non-postgres environments
    return models.JSONField(null=True, blank=True, **kwargs)
