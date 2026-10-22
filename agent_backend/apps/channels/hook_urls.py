from django.urls import path

from .views import WebhookView

urlpatterns = [path("<str:type>/<str:secret>/", WebhookView.as_view())]
