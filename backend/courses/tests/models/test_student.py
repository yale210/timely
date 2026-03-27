from courses.models import Student
from django.contrib.auth import get_user_model
from django.test import TestCase

User = get_user_model()


class StudentModelTests(TestCase):
    """Tests for the Student model."""
    
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username="student_user", password="testpass123", email="student@test.com"
        )
    def test_student_creation(self):
        """Test basic student creation."""
        student = Student.objects.create(user=self.user)
        self.assertEqual(student.user, self.user)

    def test_student_str(self):
        """Test student string representation."""
        student = Student.objects.create(user=self.user)
        self.assertEqual(str(student), "Student:")

    def test_student_user_relationship(self):
        """Test that student is linked to user correctly."""
        student = Student.objects.create(user=self.user)
        self.assertIn(student, self.user.student.all())

    def test_student_cascade_delete(self):
        """Test that deleting user also deletes student."""
        student = Student.objects.create(user=self.user)
        student_id = student.id
        self.user.delete()
        self.assertFalse(Student.objects.filter(id=student_id).exists())
