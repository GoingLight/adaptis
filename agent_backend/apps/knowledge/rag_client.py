"""
The only place that talks to the colleague's RAG service.
Contract (agree with him, then adjust here only):

POST {RAG_SERVICE_URL}/index
  { "agent_id": 12,
    "callback_url": "https://.../internal/rag-callback/",
    "upsert": [ {"source_id": 5, "type": "file", "title": "...", "text": "...", "metadata": {...}} ],
    "delete": [3, 4] }
  -> { "job_id": "..." }   (async; service POSTs to callback_url when done)

POST {RAG_SERVICE_URL}/answer
  { "agent_id": 12, "question": "...", "history": [{"role": "user"|"assistant", "content": "..."}],
    "system_prompt": "...", "language": "uz", "stream": true }
  -> text/event-stream of  data: {"token": "..."}  …  data: {"done": true, "sources": [...]}
     (or, with stream=false, a single JSON {"answer": "...", "sources": [...]})
"""
from typing import Iterator

import httpx
from django.conf import settings


def _headers():
    return {"Authorization": f"Bearer {settings.RAG_SERVICE_TOKEN}"}


def index(agent_id: int, upsert: list[dict], delete: list[int]) -> str:
    payload = {
        "agent_id": agent_id,
        "callback_url": settings.PUBLIC_BASE_URL.rstrip("/") + "/internal/rag-callback/",
        "upsert": upsert,
        "delete": delete,
    }
    r = httpx.post(f"{settings.RAG_SERVICE_URL}/index", json=payload, headers=_headers(), timeout=60)
    r.raise_for_status()
    return r.json()["job_id"]


def answer(agent_id: int, question: str, history: list[dict], system_prompt: str, language: str) -> dict:
    payload = {
        "agent_id": agent_id,
        "question": question,
        "history": history,
        "system_prompt": system_prompt,
        "language": language,
        "stream": False,
    }
    r = httpx.post(f"{settings.RAG_SERVICE_URL}/answer", json=payload, headers=_headers(), timeout=90)
    r.raise_for_status()
    return r.json()


def answer_stream(agent_id: int, question: str, history: list[dict], system_prompt: str, language: str) -> Iterator[str]:
    """Yields raw SSE lines from the RAG service so the widget view can forward them."""
    payload = {
        "agent_id": agent_id,
        "question": question,
        "history": history,
        "system_prompt": system_prompt,
        "language": language,
        "stream": True,
    }
    with httpx.stream(
        "POST", f"{settings.RAG_SERVICE_URL}/answer", json=payload, headers=_headers(), timeout=120
    ) as r:
        r.raise_for_status()
        for line in r.iter_lines():
            if line:
                yield line
