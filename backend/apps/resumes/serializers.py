import hashlib
from rest_framework import serializers
from ai.extraction.pdf_reader import is_valid_pdf
from .models import Resume

class ResumeUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(required=True)

    class Meta:
        model = Resume
        fields = ('file',)

    def validate_file(self, value):
        # 1. Max size: 5 MB
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size exceeds 5 MB limit.")

        # 2. Check magic bytes
        if not is_valid_pdf(value):
            raise serializers.ValidationError("Invalid file format. Uploaded file must be a valid PDF.")

        return value


class ResumeSerializer(serializers.ModelSerializer):
    is_primary = serializers.SerializerMethodField()

    uploaded_at = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Resume
        fields = (
            'id', 'original_filename', 'file_size', 'status',
            'failure_reason', 'uploaded_at', 'processed_at', 'is_primary'
        )

    def get_is_primary(self, obj):
        if hasattr(obj.candidate, 'primary_resume') and obj.candidate.primary_resume:
            return obj.candidate.primary_resume_id == obj.id
        return False


class ResumeDetailSerializer(serializers.ModelSerializer):
    is_primary = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    uploaded_at = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Resume
        fields = (
            'id', 'original_filename', 'file_size', 'status',
            'failure_reason', 'raw_text', 'clean_text', 'sections',
            'parsed_data', 'uploaded_at', 'processed_at', 'is_primary', 'file_url'
        )

    def get_is_primary(self, obj):
        if hasattr(obj.candidate, 'primary_resume') and obj.candidate.primary_resume:
            return obj.candidate.primary_resume_id == obj.id
        return False

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None
