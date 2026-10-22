from django.conf import settings
from rest_framework import serializers

from .models import IngestionJob, KnowledgeSource

ALLOWED_EXT = (".pdf", ".docx", ".txt", ".md", ".csv", ".html", ".htm")


class KnowledgeSourceSerializer(serializers.ModelSerializer):
    preview = serializers.SerializerMethodField()

    class Meta:
        model = KnowledgeSource
        fields = (
            "id", "type", "title", "file", "url", "raw_text", "status", "error",
            "size_bytes", "char_count", "last_indexed_at", "created_at", "updated_at", "preview",
        )
        read_only_fields = ("status", "error", "size_bytes", "char_count", "last_indexed_at")
        extra_kwargs = {"raw_text": {"write_only": True}, "title": {"required": False, "allow_blank": True}}

    def get_preview(self, src):
        return src.extracted_text[:500]

    def validate(self, data):
        t = data.get("type", getattr(self.instance, "type", None))
        if t == KnowledgeSource.Type.FILE:
            f = data.get("file")
            if not f and not self.instance:
                raise serializers.ValidationError({"file": "File is required."})
            if f:
                if not f.name.lower().endswith(ALLOWED_EXT):
                    raise serializers.ValidationError({"file": f"Allowed: {', '.join(ALLOWED_EXT)}"})
                if f.size > settings.MAX_UPLOAD_MB * 1024 * 1024:
                    raise serializers.ValidationError({"file": f"Max {settings.MAX_UPLOAD_MB} MB."})
                data.setdefault("title", f.name)
        elif t == KnowledgeSource.Type.URL and not data.get("url") and not self.instance:
            raise serializers.ValidationError({"url": "URL is required."})
        elif t in (KnowledgeSource.Type.TEXT, KnowledgeSource.Type.FAQ) and not data.get("raw_text") and not self.instance:
            raise serializers.ValidationError({"raw_text": "Text is required."})
        if not data.get("title") and not self.instance:
            data["title"] = data.get("url") or f"{t} source"
        return data


class IngestionJobSerializer(serializers.ModelSerializer):
    source_ids = serializers.PrimaryKeyRelatedField(source="sources", many=True, read_only=True)

    class Meta:
        model = IngestionJob
        fields = ("id", "status", "source_ids", "deleted_source_ids", "error", "created_at", "started_at", "finished_at")
