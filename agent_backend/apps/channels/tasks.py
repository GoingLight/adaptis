import logging

from celery import shared_task
from django.utils import timezone

from apps.chat import services
from apps.chat.models import Conversation

from . import providers
from .models import Channel

log = logging.getLogger(__name__)


@shared_task
def handle_incoming(channel_id: int, sender_id: str, text: str):
    """Shared path for every messenger: find the sender's conversation, ask the agent, send the reply back."""
    ch = Channel.objects.select_related("agent").get(pk=channel_id)
    agent = ch.agent
    if not agent.is_active or not agent.is_ready:
        providers.send(ch, sender_id, agent.fallback_message)
        return
    visitor = f"{ch.type}:{sender_id}"
    conv = Conversation.objects.filter(agent=agent, channel=ch.type, visitor_id=visitor).order_by("-last_message_at").first()
    if conv is None:
        conv = services.get_or_create_conversation(agent, visitor, ch.type)
    msg = services.reply(conv, text)
    try:
        providers.send(ch, sender_id, msg.content)
    except Exception:  # noqa: BLE001
        log.exception("send failed on channel %s", channel_id)
    ch.last_message_at = timezone.now()
    ch.save(update_fields=["last_message_at"])
