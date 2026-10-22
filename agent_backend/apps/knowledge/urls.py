from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import JobViewSet, SourceViewSet, TrainView

router = SimpleRouter()
router.register("sources", SourceViewSet, basename="source")
router.register("jobs", JobViewSet, basename="job")

urlpatterns = [path("train/", TrainView.as_view())] + router.urls
