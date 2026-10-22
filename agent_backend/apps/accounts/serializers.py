from django.db import transaction
from rest_framework import serializers

from .models import Member, User, Workspace


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    company_name = serializers.CharField(max_length=200)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value.lower()

    @transaction.atomic
    def create(self, validated):
        user = User.objects.create_user(
            username=validated["email"], email=validated["email"], password=validated["password"]
        )
        ws = Workspace.objects.create(name=validated["company_name"], owner=user)
        Member.objects.create(workspace=ws, user=user, role=Member.Role.OWNER)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name")


class WorkspaceSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = ("id", "name", "plan", "created_at", "role")

    def get_role(self, ws):
        user = self.context["request"].user
        m = ws.members.filter(user=user).first()
        return m.role if m else None
