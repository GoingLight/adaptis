from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("id", "role", "content", "sources", "latency_ms", "created_at")


class ConversationSerializer(serializers.ModelSerializer):
    message_count = serializers.IntegerField(read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ("id", "channel", "visitor_id", "page_url", "started_at", "last_message_at", "message_count", "last_message")

    def get_last_message(self, c):
        m = c.messages.last()
        return m.content[:120] if m else ""


class ConversationDetailSerializer(ConversationSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + ("messages",)


class WidgetChatSerializer(serializers.Serializer):
    visitor_id = serializers.CharField(max_length=120)
    conversation_id = serializers.IntegerField(required=False)
    message = serializers.CharField(max_length=4000)
    page_url = serializers.URLField(required=False, allow_blank=True)
    stream = serializers.BooleanField(default=True)
