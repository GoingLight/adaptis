from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied

from .models import Member


def workspace_ids_for(user):
    return Member.objects.filter(user=user).values_list("workspace_id", flat=True)


def require_editor(user, workspace_id):
    """Raise unless the user can edit this workspace."""
    ok = Member.objects.filter(
        user=user, workspace_id=workspace_id, role__in=[Member.Role.OWNER, Member.Role.EDITOR]
    ).exists()
    if not ok:
        raise PermissionDenied("You cannot edit this workspace.")


def get_user_agent(user, agent_id, edit=False):
    """Fetch an agent the user belongs to; optionally enforce editor role."""
    from apps.agents.models import Agent

    agent = get_object_or_404(Agent, pk=agent_id, workspace_id__in=workspace_ids_for(user))
    if edit:
        require_editor(user, agent.workspace_id)
    return agent
