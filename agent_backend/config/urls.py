from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/agents/", include("apps.agents.urls")),
    path("api/agents/<int:agent_id>/", include("apps.knowledge.urls")),
    path("api/agents/<int:agent_id>/", include("apps.chat.admin_urls")),
    path("api/agents/<int:agent_id>/", include("apps.channels.urls")),
    # Messenger webhooks (Telegram / Instagram / Facebook)
    path("hooks/", include("apps.channels.hook_urls")),
    # Public widget API (keyed by agent public_key, no JWT)
    path("w/<str:public_key>/", include("apps.chat.widget_urls")),
    # Callback from the RAG service
    path("internal/", include("apps.knowledge.internal_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
