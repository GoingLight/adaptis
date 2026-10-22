from rest_framework.routers import SimpleRouter

from .views import AgentViewSet

router = SimpleRouter()
router.register("", AgentViewSet, basename="agent")

urlpatterns = router.urls
