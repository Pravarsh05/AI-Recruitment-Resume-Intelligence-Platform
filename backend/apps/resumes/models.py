import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import TimeStampedModel
from apps.core.fields import get_vector_field

def resume_upload_path(instance, filename):
    return f"resumes/{instance.candidate.id}/{uuid.uuid4()}_{filename}"

class Resume(TimeStampedModel):
    class Status(models.TextChoices):
        UPLOADED = 'uploaded', _('Uploaded')
        EXTRACTING = 'extracting', _('Extracting')
        EXTRACTED = 'extracted', _('Extracted')
        PARSING = 'parsing', _('Parsing')
        EMBEDDED = 'embedded', _('Embedded')
        FAILED = 'failed', _('Failed')

    candidate = models.ForeignKey(
        'candidates.CandidateProfile',
        on_delete=models.CASCADE,
        related_name='resumes'
    )
    file = models.FileField(upload_to=resume_upload_path, null=True, blank=True)
    file_key = models.CharField(max_length=512, blank=True)
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(default=0)
    sha256 = models.CharField(max_length=64, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPLOADED,
        db_index=True
    )
    failure_reason = models.TextField(blank=True)
    raw_text = models.TextField(blank=True)
    clean_text = models.TextField(blank=True)
    sections = models.JSONField(default=dict, blank=True)
    parsed_data = models.JSONField(default=dict, blank=True)
    parser_version = models.CharField(max_length=50, default='v1.0.0')
    embedding = get_vector_field(dimensions=384)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['candidate', 'sha256'],
                name='unique_candidate_resume_hash'
            )
        ]

    def __str__(self):
        return f"{self.original_filename} ({self.status}) - {self.candidate}"


class ResumeChunk(TimeStampedModel):
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name='chunks'
    )
    section = models.CharField(max_length=100, blank=True)
    text = models.TextField()
    embedding = get_vector_field(dimensions=384)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"Chunk {self.order} [{self.section}] for Resume {self.resume_id}"
