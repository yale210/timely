"""Database models for the courses application.

This module defines the core data structures representing courses, enrollments,
course-specific events, and access control mechanisms like join codes and staff
assignments. It forms the backbone of the educational content management.
"""

from django.conf import settings
from django.db import models

from core.models.base_event import BaseEventModel
from courses.models.student import Student
from courses.models.teacher import Teacher


class Course(models.Model):
    """Represents an academic course within the system.

    A course is the primary unit of organization, containing students (enrolled),
    staff, and a set of scheduled events. It is led by a Teacher.
    """

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)
    lead = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses",
    )

    def __str__(self):
        """Returns the course name as its string representation."""
        return self.name


class CourseEnrollment(models.Model):
    """Tracks the enrollment of a student in a specific course.

    Maintains a record of when a student joined a course and their current
    active status within that course context.
    """

    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="enrollments"
    )
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="courses"
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)

    class Meta:
        """Meta options for CourseEnrollment, enforcing unique student-course pairs."""

        unique_together = ("course", "student")
        ordering = ["-enrolled_at"]

    def __str__(self):
        """Returns a descriptive enrollment string including student and course names."""
        return f"{self.student.user.username} enrolled in {self.course.name}"


class CourseStaff(models.Model):
    """Represents a staff assignment for a course.

    Staff members are users granted administrative or instructional privileges
    over a specific course, separate from their standard enrollment or lead status.
    """

    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="staff_members"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_staff_memberships",
    )
    active = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Meta options for CourseStaff, enforcing unique staff-course pairs."""

        unique_together = ("course", "student")
        ordering = ["-assigned_at"]

    def __str__(self):
        """Returns a string identifying the user as staff for a specific course."""
        return f"{self.student.username} is staff for {self.course.name}"


class CourseEvent(BaseEventModel):
    """Represents a scheduled event tied specifically to a course.

    Extends the basic event model to include a relationship with the course
    it belongs to and the teacher who created it.
    """

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="events")
    created_by = models.ForeignKey(
        Teacher, on_delete=models.SET_NULL, null=True, blank=True, related_name="author"
    )


class CourseJoinCode(models.Model):
    """A code used by students to gain access and enroll in a course.

    Join codes can have an optional expiration date and an active toggle to
    control availability of course enrollment through that specific code.
    """

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
        """Meta options for CourseJoinCode, ordering by creation date."""

        ordering = ["-created_at"]

    def __str__(self):
        """Returns the join code and the associated course name."""
        return f"Join code for {self.course.name}: {self.code}"
