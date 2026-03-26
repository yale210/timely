from django.test import SimpleTestCase

from courses import urls


class CourseUrlsTests(SimpleTestCase):
    def test_course_urls_module_exposes_router_urlpatterns(self):
        self.assertEqual(len(urls.urlpatterns), 1)
        self.assertTrue(urls.urlpatterns[0])
