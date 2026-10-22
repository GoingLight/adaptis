"""
Channel-agnostic chat pipeline. The widget, and later Telegram / Instagram / Facebook
webhooks, all call these — only delivery differs.
"""
import json
import time
from typing import Iterator

from apps.agents.models import Agent
from apps.knowledge import rag_client

from .models import Conversation, Message

HISTORY_WINDOW = 10


def get_or_create_conversation(agent: Agent, visitor_id: str, channel: str, conversation_id=None, page_url=""):
    if conversation_id:
        conv = Conversation.objects.filter(pk=conversation_id, agent=agent, visitor_id=visitor_id).first()
        if conv:
            return conv
    return Conversation.objects.create(agent=agent, visitor_id=visitor_id, channel=channel, page_url=page_url)


def _history(conv: Conversation) -> list[dict]:
    msgs = conv.messages.order_by("-created_at")[:HISTORY_WINDOW]
    return [{"role": m.role, "content": m.content} for m in reversed(list(msgs))]


def reply(conv: Conversation, text: str) -> Message:
    """Non-streaming: used by social-media channels."""
    agent = conv.agent
    history = _history(conv)
    Message.objects.create(conversation=conv, role=Message.Role.USER, content=text)
    t0 = time.monotonic()
    try:
        data = rag_client.answer(agent.id, text, history, agent.system_prompt, agent.language)
        content, sources = data.get("answer") or agent.fallback_message, data.get("sources", [])
    except Exception:  # noqa: BLE001
        content, sources = agent.fallback_message, []
    return Message.objects.create(
        conversation=conv, role=Message.Role.ASSISTANT, content=content, sources=sources,
        latency_ms=int((time.monotonic() - t0) * 1000),
    )


def reply_stream(conv: Conversation, text: str) -> Iterator[str]:
    """
    Streaming: yields SSE frames for the widget.
    Frames:  data: {"conversation_id": N}   first
             data: {"token": "..."}         many
             data: {"done": true, "message_id": N, "sources": [...]}
    """
    agent = conv.agent
    history = _history(conv)
    Message.objects.create(conversation=conv, role=Message.Role.USER, content=text)
    yield _frame({"conversation_id": conv.id})

    t0 = time.monotonic()
    buf, sources = [], []
    try:
        for line in rag_client.answer_stream(agent.id, text, history, agent.system_prompt, agent.language):
            if not line.startswith("data:"):
                continue
            payload = json.loads(line[5:].strip())
            if "token" in payload:
                buf.append(payload["token"])
                yield _frame({"token": payload["token"]})
            elif payload.get("done"):
                sources = payload.get("sources", [])
    except Exception:  # noqa: BLE001
        if not buf:
            buf.append(agent.fallback_message)
            yield _frame({"token": agent.fallback_message})

    msg = Message.objects.create(
        conversation=conv, role=Message.Role.ASSISTANT, content="".join(buf), sources=sources,
        latency_ms=int((time.monotonic() - t0) * 1000),
    )
    yield _frame({"done": True, "message_id": msg.id, "sources": sources})


def _frame(obj: dict) -> str:
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"
