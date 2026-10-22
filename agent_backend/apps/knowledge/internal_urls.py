from django.urls import path

from .views import RagCallbackView

urlpatterns = [path("rag-callback/", RagCallbackView.as_view())]
