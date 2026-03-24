from django.conf import settings
from django.db import models

from core.models.base_event import BaseEventModel
from courses.models.student import Student
from courses.models.teacher import Teacher


class Course(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)
    lead = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name


class CourseEnrollment(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="enrollments"
    )
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="courses"
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("course", "student")
        ordering = ["-enrolled_at"]

    def __str__(self):
        return f"{self.student.user.username} enrolled in {self.course.name}"


class CourseStaff(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="staff_members")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="course_staff_memberships"
    )
    active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("course", "student")
        ordering = ["-assigned_at"]

    def __str__(self):
        return f"{self.student.username} is staff for {self.course.name}"


class CourseEvent(BaseEventModel):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="events")
    created_by = models.ForeignKey(
        Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="author"
    )

class CourseJoinCode(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="join_codes",
    )
    code = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Join code for {self.course.name}: {self.code}"
