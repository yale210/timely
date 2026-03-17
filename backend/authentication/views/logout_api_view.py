from drf_spectacular.utils import (
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)
from knox.views import (
    LogoutView as KnoxLogoutView,
)


@extend_schema_view(
    post=extend_schema(
        request=None,
        responses={204: OpenApiResponse(description="Successfully logged out.")},
    )
)
class LogoutAPIView(KnoxLogoutView):
    """Log out the current authenticated session."""

    pass
