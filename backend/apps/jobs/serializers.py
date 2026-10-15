from rest_framework import serializers
from apps.skills.models import Skill
from apps.skills.serializers import SkillSerializer
from .models import Job, JobSkill

class JobSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    category = serializers.CharField(source='skill.category', read_only=True)
    skill_id = serializers.UUIDField(write_only=True, required=False)
    name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = JobSkill
        fields = (
            'id', 'skill_id', 'name', 'skill_name', 'category',
            'requirement', 'weight', 'is_mandatory'
        )
        read_only_fields = ('id',)


class JobSerializer(serializers.ModelSerializer):
    job_skills = JobSkillSerializer(many=True, required=False)
    recruiter_email = serializers.EmailField(source='recruiter.email', read_only=True)
    applicants_count = serializers.IntegerField(source='applications.count', read_only=True)
    match_preview = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Job
        fields = (
            'id', 'company_name', 'title', 'description', 'location',
            'work_mode', 'employment_type', 'min_experience_years',
            'max_experience_years', 'education_required', 'salary_min',
            'salary_max', 'status', 'job_skills', 'recruiter_email',
            'applicants_count', 'match_preview', 'created_at', 'closes_at'
        )
        read_only_fields = ('id', 'recruiter_email', 'applicants_count', 'match_preview', 'created_at')

    def get_match_preview(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or not request.user.is_candidate:
            return None

        # Check if candidate has primary resume
        profile = getattr(request.user, 'candidate_profile', None)
        if not profile or not profile.primary_resume:
            return None

        # Return precomputed or cached score if available
        from apps.matching.models import MatchResult
        match = MatchResult.objects.filter(resume=profile.primary_resume, job=obj).first()
        if match:
            return {
                'score': match.score,
                'matched_count': len(match.matched_skills),
                'missing_count': len(match.missing_required)
            }
        return None

    def create(self, validated_data):
        skills_data = validated_data.pop('job_skills', [])
        job = Job.objects.create(**validated_data)
        self._sync_skills(job, skills_data)
        # Compute and persist job embedding
        self._compute_job_embedding(job)
        return job

    def update(self, instance, validated_data):
        skills_data = validated_data.pop('job_skills', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if skills_data is not None:
            self._sync_skills(instance, skills_data)

        self._compute_job_embedding(instance)
        return instance

    def _sync_skills(self, job, skills_data):
        job.job_skills.all().delete()
        for item in skills_data:
            skill_id = item.get('skill_id')
            name = item.get('name')
            if skill_id:
                skill = Skill.objects.get(id=skill_id)
            elif name:
                skill = Skill.objects.filter(name__iexact=name.strip()).first()
                if not skill:
                    skill, _ = Skill.objects.get_or_create(
                        name=name.strip()
                    )
            else:
                continue

            JobSkill.objects.create(
                job=job,
                skill=skill,
                requirement=item.get('requirement', 'required'),
                weight=item.get('weight', 1.0),
                is_mandatory=item.get('is_mandatory', False)
            )

    def _compute_job_embedding(self, job):
        from ai.embeddings import encode_text
        skills_str = ", ".join([js.skill.name for js in job.job_skills.all()])
        job_summary = f"{job.title} at {job.company_name}.\n{job.description}\nKey Skills: {skills_str}"
        job.embedding = encode_text(job_summary)
        job.save(update_fields=['embedding'])
