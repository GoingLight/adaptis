import secrets

from django.db import models

from apps.agents.models import Agent


def make_secret():
    return secrets.token_urlsafe(24)


class Channel(models.Model):
    """A messaging account connected to an agent (Telegram bot, Instagram / Facebook page)."""

    class Type(models.TextChoices):
        TELEGRAM = "telegram"
        INSTAGRAM = "instagram"
        FACEBOOK = "facebook"

    class Status(models.TextChoices):
        PENDING = "pending"      # saved, webhook not yet confirmed
        CONNECTED = "connected"  # webhook set / verified
        ERROR = "error"

    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="channels")
    type = models.CharField(max_length=12, choices=Type.choices)
    username = models.CharField(max_length=120, blank=True, help_text="@bot, @page or page name — display only")
    # telegram: {"bot_token": "..."}   instagram/facebook: {"page_id": "...", "page_access_token": "...", "ig_account_id": "..."}
    credentials = models.JSONField(default=dict)
    webhook_secret = models.CharField(max_length=48, default=make_secret, unique=True, editable=False)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    error = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("agent", "type")

    def __str__(self):
        return f"{self.type}:{self.username or self.id} → {self.agent}"
