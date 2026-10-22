from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import require_editor, workspace_ids_for

from .models import Agent, WidgetConfig
from .serializers import AgentCreateSerializer, AgentSerializer, WidgetConfigSerializer


class AgentViewSet(viewsets.ModelViewSet):
    """
    /api/agents/                 GET list, POST create
    /api/agents/{id}/            GET, PATCH, DELETE
    /api/agents/{id}/widget/     GET, PATCH appearance + allowed_origins
    /api/agents/{id}/embed/      GET the <script> snippet
    """

    def get_queryset(self):
        return Agent.objects.filter(workspace_id__in=workspace_ids_for(self.request.user)).select_related(
            "workspace"
        )

    def get_serializer_class(self):
        return AgentCreateSerializer if self.action == "create" else AgentSerializer

    def perform_create(self, serializer):
        require_editor(self.request.user, serializer.validated_data["workspace"].id)
        serializer.save()

    def perform_update(self, serializer):
        require_editor(self.request.user, serializer.instance.workspace_id)
        serializer.save()

    def perform_destroy(self, instance):
        require_editor(self.request.user, instance.workspace_id)
        instance.delete()

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        self.perform_create(s)
        return Response(AgentSerializer(s.instance).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "patch"])
    def widget(self, request, pk=None):
        agent = self.get_object()
        cfg, _ = WidgetConfig.objects.get_or_create(agent=agent)
        if request.method == "PATCH":
            require_editor(request.user, agent.workspace_id)
            s = WidgetConfigSerializer(cfg, data=request.data, partial=True)
            s.is_valid(raise_exception=True)
            s.save()
            return Response(s.data)
        return Response(WidgetConfigSerializer(cfg).data)

    @action(detail=True, methods=["get"])
    def embed(self, request, pk=None):
        agent = self.get_object()
        base = settings.PUBLIC_BASE_URL.rstrip("/")
        snippet = (
            f'<script src="{base}/static/widget/agent.js" '
            f'data-agent-key="{agent.public_key}" async></script>'
        )
        return Response({"public_key": agent.public_key, "snippet": snippet})
