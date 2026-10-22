from rest_framework.routers import SimpleRouter

from .views import ChannelViewSet

router = SimpleRouter()
router.register("channels", ChannelViewSet, basename="channel")
urlpatterns = router.urls
