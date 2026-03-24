import datetime

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import (
    Course,
    CourseEnrollment,
    CourseEvent,
    CourseJoinCode,
    CourseStaff,
    Student,
    Teacher,
)

User = get_user_model()


class CourseViewTests(APITestCase):
    def setUp(self):
        self.teacher_user = User.objects.create_user(
            username="teacher",
            password="password123",
            email="teacher@example.com",
        )
        self.student_user = User.objects.create_user(
            username="student",
            password="password123",
            email="student@example.com",
        )
        self.other_user = User.objects.create_user(
            username="other",
            password="password123",
            email="other@example.com",
        )
        self.admin_user = User.objects.create_superuser(
            username="admin",
            password="password123",
            email="admin@example.com",
        )

        self.teacher = Teacher.objects.create(user=self.teacher_user)
        self.student = Student.objects.create(user=self.student_user)
        self.other_student = Student.objects.create(user=self.other_user)

        self.course = Course.objects.create(
            name="Python Basics",
            description="Intro course",
            lead=self.teacher,
        )
        self.inactive_course = Course.objects.create(
            name="Inactive Course",
            description="Inactive",
            lead=self.teacher,
            active=False,
        )

        self.list_url = reverse("course-list")
        self.detail_url = reverse("course-detail", args=[self.course.id])
        self.inactive_detail_url = reverse(
            "course-detail", args=[self.inactive_course.id]
        )
        self.events_url = reverse("course-events", args=[self.course.id])
        self.join_url = reverse("course-join", args=[self.course.id])
        self.leave_url = reverse("course-leave", args=[self.course.id])
        self.staff_url = reverse("course-staff", args=[self.course.id])
        self.join_by_code_url = reverse("course-join-by-code")

    # -------------------------
    # list
    # -------------------------

    def test_list_requires_authentication(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_student_courses(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Python Basics")

    def test_list_returns_teacher_courses(self):
        second_course = Course.objects.create(
            name="Advanced Python",
            description="Advanced course",
            lead=self.teacher,
        )

        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)
        returned_ids = [item["id"] for item in response.data]
        self.assertIn(self.course.id, returned_ids)
        self.assertIn(second_course.id, returned_ids)

    def test_list_returns_all_courses_for_superuser(self):
        Course.objects.create(
            name="Another Course",
            description="Another",
            lead=self.teacher,
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 3)

    # -------------------------
    # create
    # -------------------------

    def test_create_requires_authentication(self):
        response = self.client.post(
            self.list_url, {"name": "New Course"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_requires_teacher_permission(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            self.list_url,
            {"name": "New Course", "description": "Desc"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_course_success(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(
            self.list_url,
            {"name": "New Course", "description": "A brand new course"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Course.objects.filter(name="New Course").count(), 1)

        course = Course.objects.get(name="New Course")
        self.assertEqual(course.lead, self.teacher)
        self.assertEqual(course.description, "A brand new course")

    def test_create_course_with_minimal_payload(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(self.list_url, {"name": "Minimal"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        course = Course.objects.get(name="Minimal")
        self.assertEqual(course.description, "")

    # -------------------------
    # retrieve
    # -------------------------

    def test_retrieve_requires_authentication(self):
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_returns_course_data_with_cohort_and_students(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], self.course.name)
        self.assertEqual(response.data["cohort"], 1)
        self.assertEqual(list(response.data["students"]), [self.student.id])

    def test_retrieve_excludes_inactive_enrollments_from_cohort(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=False
        )

        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["cohort"], 0)

    def test_retrieve_nonexistent_course(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get(reverse("course-detail", args=[999999]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -------------------------
    # update / partial_update
    # -------------------------

    def test_update_requires_authentication(self):
        response = self.client.put(
            self.detail_url,
            {"name": "Updated", "description": "Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_requires_permission(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.put(
            self.detail_url,
            {"name": "Updated", "description": "Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_lead_can_change_name_and_description(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.put(
            self.detail_url,
            {"name": "Updated Name", "description": "Updated Description"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.name, "Updated Name")
        self.assertEqual(self.course.description, "Updated Description")

    def test_partial_update_lead_success(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.patch(
            self.detail_url,
            {"name": "Patched Name"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.name, "Patched Name")

    def test_partial_update_non_lead_cannot_change_name(self):
        CourseStaff.objects.create(
            course=self.course, student=self.other_user, active=True
        )

        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(
            self.detail_url,
            {"name": "Should Not Change", "description": "Patched Desc"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.name, "Python Basics")
        self.assertEqual(self.course.description, "Patched Desc")

    def test_update_invalid_data_returns_400(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.put(self.detail_url, {"name": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------
    # destroy
    # -------------------------

    def test_destroy_requires_authentication(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_destroy_requires_lead_or_admin(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_destroy_soft_deletes_course(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.course.refresh_from_db()
        self.assertFalse(self.course.active)

    def test_destroy_by_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.course.refresh_from_db()
        self.assertFalse(self.course.active)

    # -------------------------
    # events
    # -------------------------

    def test_get_events_orders_by_start_time(self):
        later = timezone.now() + datetime.timedelta(days=1)
        earlier = timezone.now()

        CourseEvent.objects.create(
            title="Later",
            course=self.course,
            created_by=self.teacher,
            start_time=later,
            end_time=later + datetime.timedelta(hours=1),
        )
        CourseEvent.objects.create(
            title="Earlier",
            course=self.course,
            created_by=self.teacher,
            start_time=earlier,
            end_time=earlier + datetime.timedelta(hours=1),
        )
        CourseEnrollment.objects.get_or_create(
            course=self.course, student=self.student, active=True
        )
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.events_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["title"], "Earlier")
        self.assertEqual(response.data[1]["title"], "Later")

    def test_create_event_requires_authentication(self):
        response = self.client.post(
            self.events_url,
            {
                "title": "New Event",
                "start_time": timezone.now().isoformat(),
                "end_time": (timezone.now() + datetime.timedelta(hours=1)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_event_success(self):
        self.client.force_authenticate(user=self.teacher_user)
        start = timezone.now()
        end = start + datetime.timedelta(hours=1)

        response = self.client.post(
            self.events_url,
            {
                "title": "Lecture 1",
                "description": "Intro",
                "location": "Room 101",
                "start_time": start.isoformat(),
                "end_time": end.isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CourseEvent.objects.filter(course=self.course).count(), 1)

        event = CourseEvent.objects.first()
        self.assertEqual(event.title, "Lecture 1")
        self.assertEqual(event.created_by, self.teacher)

    def test_create_event_invalid_range_returns_400(self):
        self.client.force_authenticate(user=self.teacher_user)
        now = timezone.now()

        response = self.client.post(
            self.events_url,
            {
                "title": "Bad Event",
                "start_time": now.isoformat(),
                "end_time": (now - datetime.timedelta(hours=1)).isoformat(),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -------------------------
    # join / leave
    # -------------------------

    def test_join_requires_authentication(self):
        response = self.client.post(self.join_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_join_creates_enrollment(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.join_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            CourseEnrollment.objects.filter(
                course=self.course, student=self.student
            ).count(),
            1,
        )

    def test_join_reactivates_inactive_enrollment(self):
        enrollment = CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=False
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.join_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        enrollment.refresh_from_db()
        self.assertTrue(enrollment.active)

    def test_join_creates_student_profile_if_missing(self):
        new_user = User.objects.create_user(
            username="newstudent",
            password="password123",
            email="newstudent@example.com",
        )
        self.assertFalse(Student.objects.filter(user=new_user).exists())

        self.client.force_authenticate(user=new_user)
        response = self.client.post(self.join_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Student.objects.filter(user=new_user).exists())

    def test_join_by_code_success(self):
        join_code = CourseJoinCode.objects.create(
            course=self.course,
            code="ABC123",
            active=True,
            expires_at=timezone.now() + datetime.timedelta(days=1),
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            self.join_by_code_url, {"code": join_code.code}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["course_id"], self.course.id)
        self.assertTrue(
            CourseEnrollment.objects.filter(
                course=self.course, student=self.student
            ).exists()
        )

    def test_join_by_code_invalid_code_returns_400(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            self.join_by_code_url, {"code": "missing"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_join_by_code_expired_returns_400(self):
        CourseJoinCode.objects.create(
            course=self.course,
            code="EXPIRED",
            active=True,
            expires_at=timezone.now() - datetime.timedelta(minutes=1),
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            self.join_by_code_url, {"code": "EXPIRED"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("expired", response.data["detail"])

    def test_leave_success(self):
        CourseEnrollment.objects.create(
            course=self.course, student=self.student, active=True
        )

        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.leave_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        enrollment = CourseEnrollment.objects.get(
            course=self.course, student=self.student
        )
        self.assertFalse(enrollment.active)

    def test_leave_returns_404_when_no_student_profile(self):
        new_user = User.objects.create_user(
            username="nostudent",
            password="password123",
            email="nostudent@example.com",
        )

        self.client.force_authenticate(user=new_user)
        response = self.client.post(self.leave_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_leave_returns_404_when_not_enrolled(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(self.leave_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -------------------------
    # staff
    # -------------------------

    def test_staff_get_requires_lead_or_admin(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.staff_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_get_returns_active_staff(self):
        CourseStaff.objects.create(
            course=self.course, student=self.other_user, active=True
        )

        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get(self.staff_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["user_id"], self.other_user.id)

    def test_staff_post_adds_member(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(
            self.staff_url, {"user_id": self.other_user.id}, format="json"
        )

        self.assertIn(
            response.status_code, (status.HTTP_201_CREATED, status.HTTP_200_OK)
        )
        self.assertTrue(
            CourseStaff.objects.filter(
                course=self.course, student=self.other_user, active=True
            ).exists()
        )

    def test_staff_post_validates_user_id(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(self.staff_url, {"user_id": 999999}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_staff_delete_requires_user_id(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.delete(self.staff_url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("required", response.data["detail"])

    def test_staff_delete_removes_staff_member(self):
        CourseStaff.objects.create(
            course=self.course, student=self.other_user, active=True
        )

        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.delete(
            self.staff_url, {"user_id": self.other_user.id}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            CourseStaff.objects.filter(
                course=self.course, student=self.other_user
            ).exists()
        )

    def test_staff_delete_returns_404_when_missing(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.delete(
            self.staff_url, {"user_id": self.other_user.id}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -------------------------
    # join_code
    # -------------------------

    def test_join_code_requires_permission(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            reverse("course-join-code", args=[self.course.id]),
            {"expires_at": (timezone.now() + datetime.timedelta(days=1)).isoformat()},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
