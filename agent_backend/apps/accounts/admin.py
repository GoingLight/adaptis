from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Member, User, Workspace

admin.site.register(User, UserAdmin)
admin.site.register(Workspace)
admin.site.register(Member)
