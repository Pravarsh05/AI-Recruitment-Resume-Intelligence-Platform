from rest_framework import serializers
from .models import Application, StatusHistory
from apps.jobs.serializers import JobSerializer
from apps.resumes.serializers import ResumeDetailSerializer

class StatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(source='changed_by.email', read_only=True)

    class Meta:
        model = StatusHistory
        fields = ('id', 'from_status', 'to_status', 'changed_by_email', 'note', 'changed_at')


class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.title', read_only=True)
    company_name = serializers.CharField(source='job.company_name', read_only=True)
    job_location = serializers.CharField(source='job.location', read_only=True)
    work_mode = serializers.CharField(source='job.work_mode', read_only=True)
    history = StatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = (
            'id', 'job', 'job_title', 'company_name', 'job_location',
            'work_mode', 'status', 'cover_note', 'history', 'applied_at'
        )
        read_only_fields = ('id', 'applied_at', 'status', 'history')


class ApplicationDetailSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    resume = ResumeDetailSerializer(read_only=True)
    candidate_name = serializers.CharField(source='candidate.full_name', read_only=True)
    candidate_email = serializers.EmailField(source='candidate.user.email', read_only=True)
    history = StatusHistorySerializer(many=True, read_only=True)
    match_result = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Application
        fields = (
            'id', 'job', 'candidate_name', 'candidate_email', 'resume',
            'status', 'cover_note', 'history', 'match_result', 'applied_at'
        )

    def get_match_result(self, obj):
        if obj.resume:
            from apps.matching.services import get_or_calculate_match
            from apps.matching.serializers import MatchResultSerializer
            mr = get_or_calculate_match(obj.resume, obj.job)
            return MatchResultSerializer(mr).data
        return None


class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Application.Status.choices)
    note = serializers.CharField(required=False, allow_blank=True, default='')
