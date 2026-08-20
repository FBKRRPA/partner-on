from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from accounts.views import AgentSchemaView, AgentSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("accounts.urls")),
    # OpenAPI 3.0 & Swagger UI Specifications (Global & Dedicated Agent UI)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/schema/agent/", AgentSchemaView.as_view(), name="agent-schema"),
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/schema/swagger-ui/agent/", AgentSwaggerView.as_view(), name="agent-swagger-ui"),
    path("api/schema/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # Convenient Shortcut Routes for User
    path("agent/", AgentSwaggerView.as_view(), name="agent-shortcut-swagger"),
]
