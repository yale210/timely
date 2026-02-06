from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models.push_subscription import PushSubscription
from django.db import IntegrityError

User = get_user_model()

class PushSubscriptionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password')

    def test_push_subscription_creation(self):
        subscription = PushSubscription.objects.create(
            user=self.user,
            endpoint='https://fcm.googleapis.com/fcm/send/test-endpoint',
            p256dh='test-p256dh',
            auth='test-auth'
        )
        self.assertEqual(subscription.user, self.user)
        self.assertEqual(subscription.endpoint, 'https://fcm.googleapis.com/fcm/send/test-endpoint')
        self.assertEqual(subscription.p256dh, 'test-p256dh')
        self.assertEqual(subscription.auth, 'test-auth')
        self.assertIsNotNone(subscription.created_at)

    def test_unique_together_constraint(self):
        endpoint = 'https://fcm.googleapis.com/fcm/send/test-endpoint'
        PushSubscription.objects.create(
            user=self.user,
            endpoint=endpoint,
            p256dh='test-p256dh-1',
            auth='test-auth-1'
        )
        with self.assertRaises(IntegrityError):
            PushSubscription.objects.create(
                user=self.user,
                endpoint=endpoint,
                p256dh='test-p256dh-2',
                auth='test-auth-2'
            )

    def test_cascade_delete_user(self):
        PushSubscription.objects.create(
            user=self.user,
            endpoint='https://fcm.googleapis.com/fcm/send/test-endpoint',
            p256dh='test-p256dh',
            auth='test-auth'
        )
        self.user.delete()
        self.assertEqual(PushSubscription.objects.count(), 0)
