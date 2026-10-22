from django.urls import path

from .views import WidgetChatView, WidgetConfigView, WidgetHistoryView

urlpatterns = [
    path("config/", WidgetConfigView.as_view()),
    path("chat/", WidgetChatView.as_view()),
    path("history/", WidgetHistoryView.as_view()),
]
