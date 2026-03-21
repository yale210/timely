from django.contrib.auth import get_user_model

from courses.models import Teacher
from django.test import TestCase

class TeacherModelTests(TestCase):
    """Tests for the Teacher model."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="teacher_user", password="testpass123", email="teacher@test.com"
        )

    def test_teacher_creation(self):
        """Test basic teacher creation."""
        teacher = Teacher.objects.create(user=self.user)
        self.assertEqual(teacher.user, self.user)
        self.assertTrue(teacher.active)

    def test_teacher_str(self):
        """Test teacher string representation."""
        teacher = Teacher.objects.create(user=self.user)
        self.assertEqual(str(teacher), f"Teacher: {self.user.username}")

    def test_teacher_active_default(self):
        """Test that teacher is active by default."""
        teacher = Teacher.objects.create(user=self.user)
        self.assertTrue(teacher.active)

    def test_teacher_can_be_deactivated(self):
        """Test that teacher can be deactivated."""
        teacher = Teacher.objects.create(user=self.user)
        teacher.active = False
        teacher.save()
        self.assertFalse(teacher.active)

    def test_teacher_user_relationship(self):
        """Test that teacher is linked to user correctly."""
        teacher = Teacher.objects.create(user=self.user)
        self.assertIn(teacher, self.user.teacher.all())

    def test_teacher_cascade_delete(self):
        """Test that deleting user also deletes teacher."""
        teacher = Teacher.objects.create(user=self.user)
        teacher_id = teacher.id
        self.user.delete()
        self.assertFalse(Teacher.objects.filter(id=teacher_id).exists())
