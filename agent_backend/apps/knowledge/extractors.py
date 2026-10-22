"""
Turn any KnowledgeSource into plain text before it goes to the RAG service.
The RAG side only ever receives text; this keeps the service boundary clean.
"""
import io
import json

import httpx
from bs4 import BeautifulSoup


class ExtractionError(Exception):
    pass


def extract_file(django_file, filename: str) -> str:
    name = filename.lower()
    data = django_file.read()
    if name.endswith(".pdf"):
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        return "\n\n".join((p.extract_text() or "") for p in reader.pages)
    if name.endswith(".docx"):
        from docx import Document

        doc = Document(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs)
    if name.endswith((".txt", ".md", ".csv")):
        return data.decode("utf-8", errors="ignore")
    if name.endswith((".html", ".htm")):
        return _html_to_text(data.decode("utf-8", errors="ignore"))
    raise ExtractionError(f"Unsupported file type: {filename}")


def extract_url(url: str) -> str:
    try:
        r = httpx.get(url, follow_redirects=True, timeout=20, headers={"User-Agent": "AgentBot/1.0"})
        r.raise_for_status()
    except httpx.HTTPError as e:
        raise ExtractionError(f"Could not fetch URL: {e}") from e
    ctype = r.headers.get("content-type", "")
    if "text/html" in ctype:
        return _html_to_text(r.text)
    if "application/pdf" in ctype:
        return extract_file(io.BytesIO(r.content), "page.pdf")
    return r.text


def extract_faq(raw: str) -> str:
    """raw is JSON: [{"q": "...", "a": "..."}, ...]"""
    try:
        items = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ExtractionError("FAQ must be valid JSON list of {q, a}") from e
    return "\n\n".join(f"Q: {i.get('q','').strip()}\nA: {i.get('a','').strip()}" for i in items)


def _html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()
    text = soup.get_text("\n")
    lines = [ln.strip() for ln in text.splitlines()]
    return "\n".join(ln for ln in lines if ln)
