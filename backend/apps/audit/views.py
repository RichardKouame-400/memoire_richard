from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers
from .models import AuditLog
from apps.accounts.models import Role


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = '__all__'

    def get_user_name(self, obj):
        return obj.user.display_name if obj.user else 'Système'


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['action', 'model_name']
    search_fields = ['object_repr', 'description', 'user__username']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']

    def get_queryset(self):
        user = self.request.user
        # Only admin, auditeur, acheteur can access audit logs
        if user.role not in [Role.SUPER_ADMIN, Role.AUDITEUR, Role.ACHETEUR]:
            raise PermissionDenied("Accès non autorisé à la piste d'audit.")
        qs = AuditLog.objects.all().order_by('-timestamp')
        if user.role == Role.ACHETEUR:
            # Acheteur sees only their org's logs
            return qs.filter(user__organization=user.organization)
        return qs
