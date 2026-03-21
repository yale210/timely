from rest_framework.permissions import BasePermission

from courses.models.teacher import Teacher


class IsTeacher(BasePermission):
    message = "Only teachers are allowed to perform this action"

    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return Teacher.objects.filter(user=request.user, active=True).exists()
        return False
