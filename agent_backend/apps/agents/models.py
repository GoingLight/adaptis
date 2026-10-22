import secrets

from django.db import models

from apps.accounts.models import Workspace


def make_public_key():
    return "ag_" + secrets.token_urlsafe(18)


class Agent(models.Model):
    """One trained assistant. A workspace may own several."""

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="agents")
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    system_prompt = models.TextField(
        blank=True,
        help_text="Instructions prepended by the RAG service. Client edits this in the portal.",
    )
    language = models.CharField(max_length=10, default="uz", help_text="Default reply language: uz / ru / en")
    greeting = models.CharField(max_length=300, default="Assalomu alaykum! Qanday yordam bera olaman?")
    fallback_message = models.CharField(
        max_length=300, default="Kechirasiz, bu savolga javob topa olmadim."
    )
    is_active = models.BooleanField(default=True)
    public_key = models.CharField(max_length=40, unique=True, default=make_public_key, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.workspace})"

    @property
    def is_ready(self) -> bool:
        return self.sources.filter(status="indexed").exists()


class WidgetConfig(models.Model):
    """Appearance + embed rules for the floating launcher. One per agent."""

    class Position(models.TextChoices):
        BOTTOM_RIGHT = "bottom-right"
        BOTTOM_LEFT = "bottom-left"

    agent = models.OneToOneField(Agent, on_delete=models.CASCADE, related_name="widget")
    primary_color = models.CharField(max_length=9, default="#1E1633")
    position = models.CharField(max_length=20, choices=Position.choices, default=Position.BOTTOM_RIGHT)
    launcher_icon = models.CharField(max_length=30, default="dots")
    avatar = models.ImageField(upload_to="widget_avatars/", blank=True, null=True)
    title = models.CharField(max_length=80, default="AI yordamchi")
    placeholder = models.CharField(max_length=120, default="Savolingizni yozing…")
    allowed_origins = models.JSONField(
        default=list,
        help_text='Origins the widget may be served from, e.g. ["https://client.uz"]. Empty = any.',
    )
    show_branding = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def origin_allowed(self, origin: str | None) -> bool:
        if not self.allowed_origins:
            return True
        return bool(origin) and origin.rstrip("/") in [o.rstrip("/") for o in self.allowed_origins]
