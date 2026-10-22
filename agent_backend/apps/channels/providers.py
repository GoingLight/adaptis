"""
Thin adapters per messenger. Each knows how to (a) register our webhook, (b) parse an
incoming update into (sender_id, text), (c) send a reply. The chat pipeline is shared.
"""
import httpx
from django.conf import settings

from .models import Channel

TG = "https://api.telegram.org/bot{token}/{method}"
GRAPH = "https://graph.facebook.com/v19.0"


def webhook_url(channel: Channel) -> str:
    return f"{settings.PUBLIC_BASE_URL.rstrip('/')}/hooks/{channel.type}/{channel.webhook_secret}/"


# ---------------- Telegram ----------------

def telegram_connect(channel: Channel) -> str:
    token = channel.credentials.get("bot_token", "")
    me = httpx.get(TG.format(token=token, method="getMe"), timeout=15).json()
    if not me.get("ok"):
        raise ValueError(me.get("description", "Invalid bot token"))
    r = httpx.post(TG.format(token=token, method="setWebhook"), json={"url": webhook_url(channel), "allowed_updates": ["message"]}, timeout=15).json()
    if not r.get("ok"):
        raise ValueError(r.get("description", "Could not set webhook"))
    return "@" + me["result"]["username"]


def telegram_disconnect(channel: Channel):
    token = channel.credentials.get("bot_token", "")
    httpx.post(TG.format(token=token, method="deleteWebhook"), timeout=15)


def telegram_parse(update: dict):
    m = update.get("message") or {}
    if not m.get("text"):
        return None
    return str(m["chat"]["id"]), m["text"]


def telegram_send(channel: Channel, chat_id: str, text: str):
    httpx.post(TG.format(token=channel.credentials["bot_token"], method="sendMessage"), json={"chat_id": chat_id, "text": text}, timeout=15)


# ---------------- Meta (Instagram + Facebook Messenger) ----------------
# Requires a Meta app with pages_messaging / instagram_manage_messages, the Page subscribed to the app,
# and the app's webhook pointing at /hooks/<type>/<secret>/ with META_VERIFY_TOKEN.

def meta_connect(channel: Channel) -> str:
    c = channel.credentials
    token, page_id = c.get("page_access_token", ""), c.get("page_id", "")
    if not token or not page_id:
        raise ValueError("Page ID and Page access token are required")
    r = httpx.get(f"{GRAPH}/{page_id}", params={"fields": "name,username,instagram_business_account", "access_token": token}, timeout=15).json()
    if "error" in r:
        raise ValueError(r["error"].get("message", "Meta rejected the token"))
    if channel.type == Channel.Type.INSTAGRAM:
        ig = r.get("instagram_business_account", {}).get("id")
        if not ig:
            raise ValueError("This Page has no linked Instagram business account")
        c["ig_account_id"] = ig
    # subscribe the page to our app so messages are delivered
    httpx.post(f"{GRAPH}/{page_id}/subscribed_apps", params={"subscribed_fields": "messages", "access_token": token}, timeout=15)
    channel.credentials = c
    return "@" + (r.get("username") or r.get("name", page_id))


def meta_parse(body: dict):
    """Messenger and Instagram share the same envelope shape."""
    out = []
    for entry in body.get("entry", []):
        for ev in entry.get("messaging", []):
            msg = ev.get("message") or {}
            if msg.get("is_echo") or not msg.get("text"):
                continue
            out.append((ev["sender"]["id"], msg["text"]))
    return out


def meta_send(channel: Channel, recipient_id: str, text: str):
    c = channel.credentials
    target = c.get("ig_account_id") if channel.type == Channel.Type.INSTAGRAM else c.get("page_id")
    httpx.post(f"{GRAPH}/{target}/messages", params={"access_token": c["page_access_token"]},
               json={"recipient": {"id": recipient_id}, "message": {"text": text}}, timeout=15)


# ---------------- dispatch ----------------

def connect(channel: Channel) -> str:
    return telegram_connect(channel) if channel.type == Channel.Type.TELEGRAM else meta_connect(channel)


def disconnect(channel: Channel):
    if channel.type == Channel.Type.TELEGRAM:
        telegram_disconnect(channel)


def send(channel: Channel, to: str, text: str):
    (telegram_send if channel.type == Channel.Type.TELEGRAM else meta_send)(channel, to, text)
