from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'role', 'full_name', 'email_verified', 'created_at')
        read_only_fields = ('id', 'email_verified', 'created_at')

    def get_full_name(self, obj):
        if hasattr(obj, 'candidate_profile') and obj.candidate_profile.full_name:
            return obj.candidate_profile.full_name
        return obj.email.split('@')[0].capitalize()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    role = serializers.ChoiceField(choices=[('candidate', 'Candidate'), ('recruiter', 'Recruiter')], default='candidate')
    full_name = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = ('email', 'password', 'role', 'full_name')

    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', User.Role.CANDIDATE)
        )
        if user.is_candidate:
            from apps.candidates.models import CandidateProfile
            CandidateProfile.objects.update_or_create(
                user=user,
                defaults={'full_name': full_name}
            )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
