from django.db import models

from apps.agents.models import Agent


class Conversation(models.Model):
    class Channel(models.TextChoices):
        WEB = "web"
        TELEGRAM = "telegram"
        INSTAGRAM = "instagram"
        FACEBOOK = "facebook"
        VOICE = "voice"

    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="conversations")
    channel = models.CharField(max_length=12, choices=Channel.choices, default=Channel.WEB)
    visitor_id = models.CharField(max_length=120, db_index=True, help_text="Widget-generated UUID or social user id")
    page_url = models.URLField(blank=True, max_length=2000)
    metadata = models.JSONField(default=dict, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-last_message_at",)


class Message(models.Model):
    class Role(models.TextChoices):
        USER = "user"
        ASSISTANT = "assistant"

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField()
    sources = models.JSONField(default=list, blank=True, help_text="[{source_id, title, score}] cited by RAG")
    latency_ms = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at",)
