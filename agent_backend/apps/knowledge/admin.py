from django.contrib import admin

from .models import IngestionJob, KnowledgeSource

admin.site.register(KnowledgeSource)
admin.site.register(IngestionJob)
