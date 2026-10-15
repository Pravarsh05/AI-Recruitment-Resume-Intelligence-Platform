from django.db import models
from apps.core.models import TimeStampedModel

class MatchResult(TimeStampedModel):
    resume = models.ForeignKey(
        'resumes.Resume',
        on_delete=models.CASCADE,
        related_name='match_results'
    )
    job = models.ForeignKey(
        'jobs.Job',
        on_delete=models.CASCADE,
        related_name='match_results'
    )
    score = models.FloatField(db_index=True) # 0.0 to 100.0
    semantic_score = models.FloatField(default=0.0) # 0.0 to 100.0
    skill_score = models.FloatField(default=0.0) # 0.0 to 100.0
    experience_score = models.FloatField(default=0.0) # 0.0 to 100.0
    education_score = models.FloatField(default=0.0) # 0.0 to 100.0
    matched_skills = models.JSONField(default=list, blank=True)
    missing_required = models.JSONField(default=list, blank=True)
    missing_preferred = models.JSONField(default=list, blank=True)
    related_skills = models.JSONField(default=list, blank=True)
    top_passages = models.JSONField(default=list, blank=True)
    explanation = models.TextField(blank=True)
    algorithm_version = models.CharField(max_length=50, default='v1.0.0', db_index=True)
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-score']
        constraints = [
            models.UniqueConstraint(
                fields=['resume', 'job', 'algorithm_version'],
                name='unique_resume_job_algo_match'
            )
        ]

    def __str__(self):
        return f"Match {self.score:.1f}%: Resume {self.resume_id} -> Job {self.job.title}"
