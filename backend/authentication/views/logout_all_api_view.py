from drf_spectacular.utils import (
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)
from knox.views import (
    LogoutAllView as KnoxLogoutAllView,
)

@extend_schema_view(
    post=extend_schema(
        request=None,
        responses={
            204: OpenApiResponse(
                description="Successfully logged out from all sessions."
            )
        },
    )
)
class LogoutAllAPIView(KnoxLogoutAllView):
    """Log out the user from all active authenticated sessions."""
    pass