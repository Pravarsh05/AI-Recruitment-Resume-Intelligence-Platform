from rest_framework import serializers
from .models import Skill, CandidateSkill

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ('id', 'name', 'slug', 'category', 'aliases', 'is_active', 'created_at')
        read_only_fields = ('id', 'slug', 'created_at')


class CandidateSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    category = serializers.CharField(source='skill.category', read_only=True)
    skill_id = serializers.UUIDField(write_only=True, required=False)
    name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CandidateSkill
        fields = (
            'id', 'skill_id', 'name', 'skill_name', 'category',
            'confidence', 'years', 'evidence', 'is_confirmed', 'created_at'
        )
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        candidate = validated_data.pop('candidate')
        skill_id = validated_data.pop('skill_id', None)
        name = validated_data.pop('name', None)

        if skill_id:
            skill = Skill.objects.get(id=skill_id)
        elif name:
            skill = Skill.objects.filter(name__iexact=name.strip()).first()
            if not skill:
                skill, _ = Skill.objects.get_or_create(
                    name=name.strip()
                )
        else:
            raise serializers.ValidationError("Either skill_id or name must be provided.")

        cand_skill, _ = CandidateSkill.objects.update_or_create(
            candidate=candidate,
            skill=skill,
            defaults={
                'confidence': validated_data.get('confidence', 1.0),
                'years': validated_data.get('years'),
                'is_confirmed': validated_data.get('is_confirmed', True)
            }
        )
        return cand_skill
