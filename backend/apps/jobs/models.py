from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.core.models import TimeStampedModel
from apps.core.fields import get_vector_field

class Job(TimeStampedModel):
    class WorkMode(models.TextChoices):
        ONSITE = 'onsite', _('On-site')
        HYBRID = 'hybrid', _('Hybrid')
        REMOTE = 'remote', _('Remote')

    class EmploymentType(models.TextChoices):
        FULL_TIME = 'full_time', _('Full-time')
        PART_TIME = 'part_time', _('Part-time')
        CONTRACT = 'contract', _('Contract')
        INTERNSHIP = 'internship', _('Internship')

    class Status(models.TextChoices):
        DRAFT = 'draft', _('Draft')
        OPEN = 'open', _('Open')
        CLOSED = 'closed', _('Closed')

    recruiter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posted_jobs'
    )
    company_name = models.CharField(max_length=255)
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField()
    location = models.CharField(max_length=255, blank=True)
    work_mode = models.CharField(
        max_length=20,
        choices=WorkMode.choices,
        default=WorkMode.REMOTE
    )
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME
    )
    min_experience_years = models.FloatField(default=0.0)
    max_experience_years = models.FloatField(null=True, blank=True)
    education_required = models.CharField(max_length=100, blank=True)
    salary_min = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_max = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True
    )
    parsed_data = models.JSONField(default=dict, blank=True)
    embedding = get_vector_field(dimensions=384)
    closes_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} at {self.company_name} ({self.status})"


class JobSkill(TimeStampedModel):
    class Requirement(models.TextChoices):
        REQUIRED = 'required', _('Required')
        PREFERRED = 'preferred', _('Preferred')

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='job_skills'
    )
    skill = models.ForeignKey(
        'skills.Skill',
        on_delete=models.CASCADE,
        related_name='job_instances'
    )
    requirement = models.CharField(
        max_length=20,
        choices=Requirement.choices,
        default=Requirement.REQUIRED
    )
    weight = models.FloatField(default=1.0)
    is_mandatory = models.BooleanField(
        default=False,
        help_text="If mandatory and missing in candidate, triggers knockout cap"
    )

    class Meta:
        ordering = ['requirement', '-weight', 'skill__name']
        constraints = [
            models.UniqueConstraint(
                fields=['job', 'skill'],
                name='unique_job_skill'
            )
        ]

    def __str__(self):
        return f"{self.job.title} - {self.skill.name} ({self.requirement})"
