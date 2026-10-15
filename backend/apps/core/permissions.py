from rest_framework import permissions

class IsCandidate(permissions.BasePermission):
    """Allows access only to candidate users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_candidate)

class IsRecruiter(permissions.BasePermission):
    """Allows access only to recruiter users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_recruiter)

class IsAdminUser(permissions.BasePermission):
    """Allows access only to admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_admin))

class IsJobOwner(permissions.BasePermission):
    """Allows access only to the recruiter who posted the job."""
    def has_object_permission(self, request, view, obj):
        # Handles Job or related objects with job.recruiter
        if hasattr(obj, 'recruiter'):
            return obj.recruiter == request.user
        elif hasattr(obj, 'job') and hasattr(obj.job, 'recruiter'):
            return obj.job.recruiter == request.user
        return False

class IsResumeOwner(permissions.BasePermission):
    """Allows access only to the candidate who owns the resume."""
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'candidate'):
            # CandidateProfile user or direct User
            if hasattr(obj.candidate, 'user'):
                return obj.candidate.user == request.user
            return obj.candidate == request.user
        return False
