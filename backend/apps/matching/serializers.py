from rest_framework import serializers
from .models import MatchResult

class MatchResultSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company_name', read_only=True)

    class Meta:
        model = MatchResult
        fields = (
            'id', 'job_title', 'company_name', 'score',
            'semantic_score', 'skill_score', 'experience_score', 'education_score',
            'matched_skills', 'missing_required', 'missing_preferred',
            'related_skills', 'top_passages', 'explanation',
            'algorithm_version', 'computed_at'
        )
