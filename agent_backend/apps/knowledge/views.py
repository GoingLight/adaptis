from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import get_user_agent

from .models import IngestionJob, KnowledgeSource
from .serializers import IngestionJobSerializer, KnowledgeSourceSerializer
from .tasks import extract_source, run_ingestion_job


class SourceViewSet(viewsets.ModelViewSet):
    """
    /api/agents/{agent_id}/sources/         GET list, POST (multipart file | json url/text/faq)
    /api/agents/{agent_id}/sources/{id}/    GET, PATCH (title / raw_text / url → re-extract), DELETE
    """

    serializer_class = KnowledgeSourceSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        agent = get_user_agent(self.request.user, self.kwargs["agent_id"])
        return agent.sources.all()

    def perform_create(self, serializer):
        agent = get_user_agent(self.request.user, self.kwargs["agent_id"], edit=True)
        src = serializer.save(agent=agent)
        transaction.on_commit(lambda: extract_source.delay(src.id))

    def perform_update(self, serializer):
        get_user_agent(self.request.user, self.kwargs["agent_id"], edit=True)
        content_changed = any(k in serializer.validated_data for k in ("file", "url", "raw_text"))
        src = serializer.save()
        if content_changed:
            src.status = KnowledgeSource.Status.PENDING
            src.save(update_fields=["status"])
            transaction.on_commit(lambda: extract_source.delay(src.id))

    def perform_destroy(self, instance):
        """Delete locally; the RAG side forgets it on the next /train (deleted_source_ids)."""
        get_user_agent(self.request.user, self.kwargs["agent_id"], edit=True)
        agent = instance.agent
        was_indexed = instance.status == KnowledgeSource.Status.INDEXED
        sid = instance.id
        instance.delete()
        if was_indexed:
            PendingDeletion.add(agent.id, sid)


class PendingDeletion:
    """Tiny helper: remember indexed sources deleted since the last train. Stored on the agent via cache."""

    @staticmethod
    def _key(agent_id):
        return f"pending_del:{agent_id}"

    @classmethod
    def add(cls, agent_id, source_id):
        from django.core.cache import cache

        ids = cache.get(cls._key(agent_id), [])
        ids.append(source_id)
        cache.set(cls._key(agent_id), ids, None)

    @classmethod
    def pop(cls, agent_id):
        from django.core.cache import cache

        ids = cache.get(cls._key(agent_id), [])
        cache.delete(cls._key(agent_id))
        return ids


class TrainView(APIView):
    """POST /api/agents/{agent_id}/train/ — enqueue an IngestionJob for all READY sources."""

    def post(self, request, agent_id):
        agent = get_user_agent(request.user, agent_id, edit=True)
        ready = agent.sources.filter(status=KnowledgeSource.Status.READY)
        deletions = PendingDeletion.pop(agent.id)
        if not ready.exists() and not deletions:
            return Response({"detail": "Nothing to train: no new or changed sources."}, status=400)
        if agent.jobs.filter(status__in=["queued", "running"]).exists():
            return Response({"detail": "A training job is already running."}, status=409)
        job = IngestionJob.objects.create(agent=agent, deleted_source_ids=deletions)
        job.sources.set(ready)
        transaction.on_commit(lambda: run_ingestion_job.delay(job.id))
        return Response(IngestionJobSerializer(job).data, status=status.HTTP_202_ACCEPTED)


class JobViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/agents/{agent_id}/jobs/  and  /jobs/{id}/  — poll training status."""

    serializer_class = IngestionJobSerializer

    def get_queryset(self):
        agent = get_user_agent(self.request.user, self.kwargs["agent_id"])
        return agent.jobs.all()


class RagCallbackView(APIView):
    """
    POST /internal/rag-callback/   (from the RAG service)
    { "job_id": "<rag_job_id>", "status": "done" | "failed",
      "errors": [ {"source_id": 5, "message": "..."} ] }
    """

    permission_classes = (permissions.AllowAny,)
    authentication_classes = ()

    def post(self, request):
        if request.headers.get("X-Callback-Secret") != settings.RAG_CALLBACK_SECRET:
            return Response(status=403)
        job = get_object_or_404(IngestionJob, rag_job_id=request.data.get("job_id"))
        errors = {e["source_id"]: e.get("message", "") for e in request.data.get("errors", [])}
        now = timezone.now()
        for src in job.sources.all():
            if src.id in errors:
                src.status, src.error = KnowledgeSource.Status.FAILED, errors[src.id]
            else:
                src.status, src.error, src.last_indexed_at = KnowledgeSource.Status.INDEXED, "", now
            src.save(update_fields=["status", "error", "last_indexed_at"])
        job.status = (
            IngestionJob.Status.DONE if request.data.get("status") == "done" else IngestionJob.Status.FAILED
        )
        job.error = request.data.get("message", "")
        job.finished_at = now
        job.save()
        return Response({"ok": True})
