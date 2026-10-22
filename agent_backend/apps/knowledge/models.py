from django.db import models

from apps.agents.models import Agent


def source_upload_path(instance, filename):
    return f"sources/agent_{instance.agent_id}/{filename}"


class KnowledgeSource(models.Model):
    """One thing the client gave us: a file, a URL, pasted text or a FAQ list."""

    class Type(models.TextChoices):
        FILE = "file"
        URL = "url"
        TEXT = "text"
        FAQ = "faq"

    class Status(models.TextChoices):
        PENDING = "pending"        # saved, not yet extracted
        EXTRACTING = "extracting"  # Celery is pulling text out
        READY = "ready"            # text extracted, waiting for /train
        INDEXING = "indexing"      # sent to RAG service
        INDEXED = "indexed"        # RAG confirmed
        FAILED = "failed"

    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="sources")
    type = models.CharField(max_length=10, choices=Type.choices)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to=source_upload_path, blank=True, null=True)
    url = models.URLField(blank=True, max_length=2000)
    raw_text = models.TextField(blank=True, help_text="Pasted text, or FAQ as JSON [{q,a}]")
    extracted_text = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    error = models.TextField(blank=True)
    size_bytes = models.PositiveBigIntegerField(default=0)
    char_count = models.PositiveIntegerField(default=0)
    content_hash = models.CharField(max_length=64, blank=True, db_index=True)
    last_indexed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"[{self.type}] {self.title}"


class IngestionJob(models.Model):
    """One call to the RAG service's /index. Tracks upserts + deletes together."""

    class Status(models.TextChoices):
        QUEUED = "queued"
        RUNNING = "running"
        DONE = "done"
        FAILED = "failed"

    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="jobs")
    sources = models.ManyToManyField(KnowledgeSource, related_name="jobs", blank=True)
    deleted_source_ids = models.JSONField(default=list)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.QUEUED)
    rag_job_id = models.CharField(max_length=100, blank=True, db_index=True)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
