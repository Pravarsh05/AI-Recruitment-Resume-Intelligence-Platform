from rest_framework import serializers
from .models import CandidateProfile, Education, Experience

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = (
            'id', 'institution', 'degree', 'field_of_study',
            'start_date', 'end_date', 'is_current', 'grade',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = (
            'id', 'company', 'title', 'location',
            'start_date', 'end_date', 'is_current', 'description',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class CandidateProfileSerializer(serializers.ModelSerializer):
    educations = EducationSerializer(many=True, read_only=True)
    experiences = ExperienceSerializer(many=True, read_only=True)
    primary_resume_id = serializers.UUIDField(source='primary_resume.id', read_only=True, allow_null=True)

    class Meta:
        model = CandidateProfile
        fields = (
            'id', 'full_name', 'phone', 'location', 'headline', 'summary',
            'total_experience_years', 'highest_education', 'open_to_work',
            'primary_resume_id', 'educations', 'experiences', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'total_experience_years', 'highest_education', 'created_at', 'updated_at')
