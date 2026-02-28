from django.urls import include, path
from rest_framework.routers import SimpleRouter

from admin_panel.views import AdminPanelViewSet

router = SimpleRouter()
router.register("", AdminPanelViewSet, basename="admin")

urlpatterns = [path("", include(router.urls))]
