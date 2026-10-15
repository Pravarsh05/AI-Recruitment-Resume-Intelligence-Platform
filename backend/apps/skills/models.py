from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from apps.core.models import TimeStampedModel
from apps.core.fields import get_vector_field

class Skill(TimeStampedModel):
    class Category(models.TextChoices):
        LANGUAGE = 'language', _('Programming Language')
        FRAMEWORK = 'framework', _('Framework / Library')
        DATABASE = 'database', _('Database')
        CLOUD = 'cloud', _('Cloud / DevOps')
        TOOL = 'tool', _('Tool / Platform')
        SOFT = 'soft', _('Soft Skill')
        DOMAIN = 'domain', _('Domain / Methodology')

    name = models.CharField(max_length=150, unique=True, db_index=True)
    slug = models.SlugField(max_length=150, unique=True)
    category = models.CharField(
        max_length=30,
        choices=Category.choices,
        default=Category.TOOL,
        db_index=True
    )
    aliases = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    embedding = get_vector_field(dimensions=384)

    class Meta:
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            slug_base = self.name.replace('++', 'plusplus').replace('#', 'sharp').replace('.', 'dot')
            self.slug = slugify(slug_base)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.category})"


class CandidateSkill(TimeStampedModel):
    candidate = models.ForeignKey(
        'candidates.CandidateProfile',
        on_delete=models.CASCADE,
        related_name='candidate_skills'
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name='candidate_instances'
    )
    source_resume = models.ForeignKey(
        'resumes.Resume',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='extracted_skills'
    )
    confidence = models.FloatField(default=1.0) # 0.0 to 1.0
    years = models.FloatField(null=True, blank=True)
    evidence = models.TextField(blank=True) # Sentence snippet
    is_confirmed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-confidence', 'skill__name']
        constraints = [
            models.UniqueConstraint(
                fields=['candidate', 'skill'],
                name='unique_candidate_skill'
            )
        ]

    def __str__(self):
        return f"{self.candidate} - {self.skill.name} ({self.confidence:.2f})"
