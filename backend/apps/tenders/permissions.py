from rest_framework.permissions import BasePermission
from apps.accounts.models import Role


class IsAcheteurOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Role.ACHETEUR, Role.SUPER_ADMIN]


class IsEvaluateurOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Role.EVALUATEUR, Role.SUPER_ADMIN, Role.ACHETEUR]


class IsSoumissionnaire(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == Role.SOUMISSIONNAIRE


class CanViewTender(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role in [Role.SUPER_ADMIN, Role.AUDITEUR]:
            return True
        if user.role == Role.ACHETEUR:
            return obj.organization == user.organization
        if user.role == Role.SOUMISSIONNAIRE:
            return obj.status not in ['draft']
        if user.role == Role.EVALUATEUR:
            return obj.evaluator_assignments.filter(evaluator=user).exists()
        return False
