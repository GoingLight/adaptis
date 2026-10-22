from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import get_user_agent
from apps.chat import services
from apps.chat.models import Conversation

from . import providers
from .models import Channel
from .tasks import handle_incoming


class ChannelSerializer(serializers.ModelSerializer):
    # write-only secrets; never echoed back
    bot_token = serializers.CharField(write_only=True, required=False, allow_blank=True)
    page_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    page_access_token = serializers.CharField(write_only=True, required=False, allow_blank=True)
    webhook_url = serializers.SerializerMethodField()

    class Meta:
        model = Channel
        fields = ("id", "type", "username", "status", "error", "is_active", "created_at", "last_message_at",
                  "bot_token", "page_id", "page_access_token", "webhook_url")
        read_only_fields = ("status", "error", "created_at", "last_message_at")

    def get_webhook_url(self, ch):
        return providers.webhook_url(ch)

    def create(self, validated):
        creds = {k: validated.pop(k) for k in ("bot_token", "page_id", "page_access_token") if k in validated}
        validated["credentials"] = {k: v for k, v in creds.items() if v}
        return super().create(validated)

    def update(self, inst, validated):
        creds = dict(inst.credentials)
        for k in ("bot_token", "page_id", "page_access_token"):
            if validated.get(k):
                creds[k] = validated.pop(k)
            else:
                validated.pop(k, None)
        inst.credentials = creds
        return super().update(inst, validated)


class ChannelViewSet(viewsets.ModelViewSet):
    """
    /api/agents/{agent_id}/channels/            GET, POST {type, username?, bot_token | page_id+page_access_token}
    /api/agents/{agent_id}/channels/{id}/       PATCH, DELETE
    /api/agents/{agent_id}/channels/{id}/connect/   POST — verifies credentials and registers the webhook
    """

    serializer_class = ChannelSerializer

    def get_queryset(self):
        return get_user_agent(self.request.user, self.kwargs["agent_id"]).channels.all()

    def perform_create(self, serializer):
        agent = get_user_agent(self.request.user, self.kwargs["agent_id"], edit=True)
        serializer.save(agent=agent)

    def perform_update(self, serializer):
        get_user_agent(self.request.user, self.kwargs["agent_id"], edit=True)
        serializer.save()

    def perform_destroy(self, instance):
        get_user_agent(self.request.user, self.kwargs["agent_id"], edit=True)
        try:
            providers.disconnect(instance)
        except Exception:  # noqa: BLE001
            pass
        instance.delete()

    @action(detail=True, methods=["post"])
    def connect(self, request, agent_id=None, pk=None):
        get_user_agent(request.user, agent_id, edit=True)
        ch = self.get_object()
        try:
            ch.username = providers.connect(ch)
            ch.status, ch.error = Channel.Status.CONNECTED, ""
        except Exception as e:  # noqa: BLE001
            ch.status, ch.error = Channel.Status.ERROR, str(e)[:500]
        ch.save()
        s = self.get_serializer(ch)
        return Response(s.data, status=status.HTTP_200_OK if ch.status == "connected" else status.HTTP_400_BAD_REQUEST)


# ---------------- public webhooks ----------------

class WebhookView(APIView):
    """GET  /hooks/{type}/{secret}/  — Meta verification handshake
       POST /hooks/{type}/{secret}/  — incoming messages (Telegram or Meta)"""

    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def get(self, request, type, secret):
        get_object_or_404(Channel, type=type, webhook_secret=secret)
        if request.GET.get("hub.mode") == "subscribe" and request.GET.get("hub.verify_token") == settings.META_VERIFY_TOKEN:
            return HttpResponse(request.GET.get("hub.challenge"))
        return HttpResponse(status=403)

    def post(self, request, type, secret):
        ch = get_object_or_404(Channel, type=type, webhook_secret=secret, is_active=True)
        body = request.data
        items = []
        if type == Channel.Type.TELEGRAM:
            p = providers.telegram_parse(body)
            if p:
                items.append(p)
        else:
            items = providers.meta_parse(body)
        for sender, text in items:
            handle_incoming.delay(ch.id, sender, text)
        return Response({"ok": True})
