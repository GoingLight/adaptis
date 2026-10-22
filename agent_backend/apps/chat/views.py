from django.db.models import Count
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from apps.accounts.permissions import get_user_agent
from apps.agents.models import Agent
from apps.agents.serializers import WidgetConfigSerializer

from . import services
from .models import Conversation
from .serializers import ConversationDetailSerializer, ConversationSerializer, MessageSerializer, WidgetChatSerializer

# ---------- admin side ----------


class ConversationViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/agents/{agent_id}/conversations/  and  /conversations/{id}/"""

    def get_queryset(self):
        agent = get_user_agent(self.request.user, self.kwargs["agent_id"])
        return agent.conversations.annotate(message_count=Count("messages"))

    def get_serializer_class(self):
        return ConversationDetailSerializer if self.action == "retrieve" else ConversationSerializer


# ---------- public widget side ----------


class WidgetThrottle(AnonRateThrottle):
    scope = "widget"


class WidgetMixin:
    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()
    throttle_classes = (WidgetThrottle,)

    def get_agent(self, request, public_key) -> Agent:
        agent = get_object_or_404(Agent.objects.select_related("widget"), public_key=public_key, is_active=True)
        origin = request.headers.get("Origin") or request.headers.get("Referer")
        if not agent.widget.origin_allowed(origin):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Origin not allowed for this agent.")
        return agent

    @staticmethod
    def cors(response, request):
        origin = request.headers.get("Origin")
        if origin:
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Headers"] = "Content-Type"
            response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        return response

    def options(self, request, *args, **kwargs):
        return self.cors(Response(status=204), request)


class WidgetConfigView(WidgetMixin, APIView):
    """GET /w/{public_key}/config/ — what the launcher needs to render."""

    def get(self, request, public_key):
        agent = self.get_agent(request, public_key)
        data = WidgetConfigSerializer(agent.widget, context={"request": request}).data
        data.update(
            {
                "agent_name": agent.name,
                "greeting": agent.greeting,
                "language": agent.language,
                "is_ready": agent.is_ready,
            }
        )
        return self.cors(Response(data), request)


class WidgetChatView(WidgetMixin, APIView):
    """
    POST /w/{public_key}/chat/
      { visitor_id, conversation_id?, message, page_url?, stream? }
    stream=true  → text/event-stream (see services.reply_stream)
    stream=false → { conversation_id, message }
    """

    def post(self, request, public_key):
        agent = self.get_agent(request, public_key)
        s = WidgetChatSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        if not agent.is_ready:
            return self.cors(Response({"detail": "Agent has no indexed knowledge yet."}, status=409), request)

        conv = services.get_or_create_conversation(
            agent, d["visitor_id"], Conversation.Channel.WEB, d.get("conversation_id"), d.get("page_url", "")
        )
        if d["stream"]:
            resp = StreamingHttpResponse(services.reply_stream(conv, d["message"]), content_type="text/event-stream")
            resp["Cache-Control"] = "no-cache"
            resp["X-Accel-Buffering"] = "no"
            return self.cors(resp, request)
        msg = services.reply(conv, d["message"])
        return self.cors(Response({"conversation_id": conv.id, "message": MessageSerializer(msg).data}), request)


class WidgetHistoryView(WidgetMixin, APIView):
    """GET /w/{public_key}/history/?visitor_id=…&conversation_id=… — restore a session."""

    def get(self, request, public_key):
        agent = self.get_agent(request, public_key)
        conv = get_object_or_404(
            Conversation, agent=agent, pk=request.query_params.get("conversation_id"),
            visitor_id=request.query_params.get("visitor_id"),
        )
        return self.cors(Response(MessageSerializer(conv.messages.all(), many=True).data), request)
