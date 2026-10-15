from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.core.models import TimeStampedModel

class Application(TimeStampedModel):
    class Status(models.TextChoices):
        APPLIED = 'applied', _('Applied')
        SCREENING = 'screening', _('Screening')
        SHORTLISTED = 'shortlisted', _('Shortlisted')
        INTERVIEW = 'interview', _('Interview')
        OFFER = 'offer', _('Offer')
        HIRED = 'hired', _('Hired')
        REJECTED = 'rejected', _('Rejected')
        WITHDRAWN = 'withdrawn', _('Withdrawn')

    job = models.ForeignKey(
        'jobs.Job',
        on_delete=models.CASCADE,
        related_name='applications'
    )
    candidate = models.ForeignKey(
        'candidates.CandidateProfile',
        on_delete=models.CASCADE,
        related_name='applications'
    )
    resume = models.ForeignKey(
        'resumes.Resume',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applications'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.APPLIED,
        db_index=True
    )
    cover_note = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-applied_at']
        constraints = [
            models.UniqueConstraint(
                fields=['job', 'candidate'],
                name='unique_job_candidate_application'
            )
        ]

    def __str__(self):
        return f"{self.candidate} -> {self.job.title} ({self.status})"


class StatusHistory(TimeStampedModel):
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='history'
    )
    from_status = models.CharField(max_length=50)
    to_status = models.CharField(max_length=50)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='status_changes'
    )
    note = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.application.id}: {self.from_status} -> {self.to_status}"
