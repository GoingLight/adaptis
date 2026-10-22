from rest_framework import serializers

from .models import Agent, WidgetConfig


class WidgetConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = WidgetConfig
        exclude = ("agent",)
        read_only_fields = ("updated_at",)


class AgentSerializer(serializers.ModelSerializer):
    is_ready = serializers.BooleanField(read_only=True)
    sources_count = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = (
            "id", "workspace", "name", "description", "system_prompt", "language",
            "greeting", "fallback_message", "is_active", "public_key", "is_ready",
            "sources_count", "created_at", "updated_at",
        )
        read_only_fields = ("public_key", "created_at", "updated_at")

    def get_sources_count(self, agent):
        return agent.sources.count()


class AgentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ("workspace", "name", "description", "language", "greeting", "system_prompt")

    def create(self, validated):
        agent = super().create(validated)
        WidgetConfig.objects.create(agent=agent)
        return agent
