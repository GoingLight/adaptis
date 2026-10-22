import hashlib
import logging

from celery import shared_task
from django.utils import timezone

from . import extractors, rag_client
from .models import IngestionJob, KnowledgeSource

log = logging.getLogger(__name__)


@shared_task
def extract_source(source_id: int):
    """Pull plain text out of a freshly saved source."""
    src = KnowledgeSource.objects.get(pk=source_id)
    src.status = KnowledgeSource.Status.EXTRACTING
    src.save(update_fields=["status"])
    try:
        if src.type == KnowledgeSource.Type.FILE:
            src.file.open("rb")
            text = extractors.extract_file(src.file, src.file.name)
            src.size_bytes = src.file.size
        elif src.type == KnowledgeSource.Type.URL:
            text = extractors.extract_url(src.url)
        elif src.type == KnowledgeSource.Type.FAQ:
            text = extractors.extract_faq(src.raw_text)
        else:
            text = src.raw_text
        text = text.strip()
        if not text:
            raise extractors.ExtractionError("No text could be extracted.")
        src.extracted_text = text
        src.char_count = len(text)
        src.content_hash = hashlib.sha256(text.encode()).hexdigest()
        src.status = KnowledgeSource.Status.READY
        src.error = ""
    except Exception as e:  # noqa: BLE001
        log.exception("extract failed for source %s", source_id)
        src.status = KnowledgeSource.Status.FAILED
        src.error = str(e)[:2000]
    src.save()


@shared_task
def run_ingestion_job(job_id: int):
    """Send READY sources (+ deletions) to the RAG service."""
    job = IngestionJob.objects.select_related("agent").get(pk=job_id)
    job.status = IngestionJob.Status.RUNNING
    job.started_at = timezone.now()
    job.save(update_fields=["status", "started_at"])

    sources = list(job.sources.filter(status=KnowledgeSource.Status.READY))
    upsert = [
        {
            "source_id": s.id,
            "type": s.type,
            "title": s.title,
            "text": s.extracted_text,
            "metadata": {"url": s.url, "hash": s.content_hash},
        }
        for s in sources
    ]
    try:
        rag_job_id = rag_client.index(job.agent_id, upsert, job.deleted_source_ids)
        job.rag_job_id = rag_job_id
        job.save(update_fields=["rag_job_id"])
        KnowledgeSource.objects.filter(pk__in=[s.id for s in sources]).update(
            status=KnowledgeSource.Status.INDEXING
        )
    except Exception as e:  # noqa: BLE001
        log.exception("ingestion job %s failed", job_id)
        job.status = IngestionJob.Status.FAILED
        job.error = str(e)[:2000]
        job.finished_at = timezone.now()
        job.save()
