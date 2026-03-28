"""Database models for the courses application.

This package defines the core entities for course management, including
Course details, Teacher and Student profiles, Enrollments, and Join Codes.
"""

__all__ = [
    "Course",
    "Teacher",
    "CourseEnrollment",
    "CourseEvent",
    "Student",
    "CourseStaff",
    "CourseJoinCode",
]

from courses.models.student import Student
from courses.models.teacher import Teacher

from courses.models.course import (
    Course,
    CourseEnrollment,
    CourseEvent,
    CourseStaff,
    CourseJoinCode,
)
