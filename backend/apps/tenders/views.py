from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Tender, Criterion, TenderStatus, EvaluatorAssignment
from .serializers import (
    TenderListSerializer, TenderDetailSerializer,
    TenderCreateSerializer, CriterionSerializer, EvaluatorAssignmentSerializer
)
from .permissions import IsAcheteurOrAdmin
from apps.accounts.models import Role, User


class TenderViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'tender_type', 'region', 'sector']
    search_fields = ['title', 'reference', 'description']
    ordering_fields = ['created_at', 'deadline', 'budget_estimated']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Tender.objects.select_related('organization', 'created_by', 'winner').prefetch_related(
            'criteria', 'evaluator_assignments__evaluator'
        )
        if user.role in [Role.SUPER_ADMIN, Role.AUDITEUR]:
            return qs
        if user.role == Role.ACHETEUR:
            return qs.filter(organization=user.organization)
        if user.role == Role.SOUMISSIONNAIRE:
            return qs.exclude(status=TenderStatus.DRAFT)
        if user.role == Role.EVALUATEUR:
            return qs.filter(evaluator_assignments__evaluator=user).distinct()
        return qs.exclude(status=TenderStatus.DRAFT)

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TenderCreateSerializer
        if self.action == 'list':
            return TenderListSerializer
        return TenderDetailSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAcheteurOrAdmin()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        """Override to return TenderDetailSerializer (with id) after creation."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tender = serializer.save()
        return Response(
            TenderDetailSerializer(tender, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def _audit(self, request, action_type, tender, desc=''):
        try:
            from apps.audit.models import AuditLog
            AuditLog.log(request.user, action_type, 'Tender', tender.id, str(tender), desc, request)
        except Exception:
            pass

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAcheteurOrAdmin])
    def publish(self, request, pk=None):
        tender = self.get_object()
        if tender.status != TenderStatus.DRAFT:
            return Response({'error': 'Seul un brouillon peut être publié.'}, status=400)
        if not tender.criteria.exists():
            return Response({'error': 'Ajoutez au moins un critère avant de publier.'}, status=400)
        total = sum(c.weight for c in tender.criteria.all())
        if abs(total - 100) > 0.5:
            return Response({'error': f'Poids total doit être 100%. Actuel: {total:.1f}%'}, status=400)
        tender.status = TenderStatus.PUBLISHED
        tender.published_at = timezone.now()
        tender.criteria.update(locked=True)
        tender.save()
        self._audit(request, 'publish', tender, f'AO {tender.reference} publié')
        return Response(TenderDetailSerializer(tender, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAcheteurOrAdmin])
    def close(self, request, pk=None):
        tender = self.get_object()
        if tender.status not in [TenderStatus.PUBLISHED, TenderStatus.EVALUATION]:
            return Response({'error': 'Impossible de clôturer dans cet état.'}, status=400)
        tender.status = TenderStatus.CLOSED
        tender.save()
        self._audit(request, 'update', tender, f'AO {tender.reference} clôturé')
        return Response({'message': 'AO clôturé.'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAcheteurOrAdmin])
    def start_evaluation(self, request, pk=None):
        tender = self.get_object()
        if tender.status != TenderStatus.CLOSED:
            return Response({'error': "L'AO doit être clôturé avant d'évaluer."}, status=400)
        tender.status = TenderStatus.EVALUATION
        tender.save()
        try:
            from apps.evaluation.tasks import auto_score_tender
            auto_score_tender.delay(tender.id)
        except Exception:
            pass
        self._audit(request, 'evaluate', tender, f'Évaluation lancée pour {tender.reference}')
        return Response({'message': 'Évaluation lancée.'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAcheteurOrAdmin])
    def attribute(self, request, pk=None):
        tender = self.get_object()
        winner_id = request.data.get('winner_id')
        if not winner_id:
            return Response({'error': 'Sélectionnez un gagnant.'}, status=400)
        from apps.submissions.models import Submission
        try:
            submission = Submission.objects.get(id=winner_id, tender=tender)
        except Submission.DoesNotExist:
            return Response({'error': 'Soumission introuvable.'}, status=404)
        tender.winner = submission.submitter
        tender.winner_score = submission.total_score
        tender.status = TenderStatus.ATTRIBUTED
        tender.attribution_date = timezone.now()
        tender.save()
        try:
            from apps.notifications.utils import send_attribution_notification
            send_attribution_notification(tender, submission)
        except Exception:
            pass
        self._audit(request, 'attribute', tender,
                    f'AO {tender.reference} attribué à {submission.submitter.display_name}')
        return Response({'message': f"Marché attribué à {submission.submitter.display_name}."})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAcheteurOrAdmin])
    def assign_evaluator(self, request, pk=None):
        tender = self.get_object()
        evaluator_id = request.data.get('evaluator_id')
        criteria_ids = request.data.get('criteria_ids', [])
        try:
            evaluator = User.objects.get(id=evaluator_id, role=Role.EVALUATEUR)
        except User.DoesNotExist:
            return Response({'error': 'Évaluateur introuvable.'}, status=404)
        assignment, _ = EvaluatorAssignment.objects.get_or_create(
            tender=tender, evaluator=evaluator,
            defaults={'assigned_by': request.user}
        )
        if criteria_ids:
            assignment.criteria.set(criteria_ids)
        return Response(EvaluatorAssignmentSerializer(assignment).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAcheteurOrAdmin])
    def remove_evaluator(self, request, pk=None):
        tender = self.get_object()
        evaluator_id = request.data.get('evaluator_id')
        EvaluatorAssignment.objects.filter(tender=tender, evaluator_id=evaluator_id).delete()
        return Response({'message': 'Évaluateur retiré.'})

    @action(detail=True, methods=['get', 'post'])
    def criteria_list(self, request, pk=None):
        tender = self.get_object()
        if request.method == 'GET':
            return Response(CriterionSerializer(tender.criteria.all(), many=True).data)
        if tender.status != TenderStatus.DRAFT:
            return Response({'error': 'Critères verrouillés après publication.'}, status=400)
        s = CriterionSerializer(data=request.data)
        if s.is_valid():
            c = s.save(tender=tender, order=tender.criteria.count())
            return Response(CriterionSerializer(c).data, status=201)
        return Response(s.errors, status=400)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = self.get_queryset()
        return Response({
            'total': qs.count(),
            'published': qs.filter(status=TenderStatus.PUBLISHED).count(),
            'closed': qs.filter(status=TenderStatus.CLOSED).count(),
            'evaluation': qs.filter(status=TenderStatus.EVALUATION).count(),
            'attributed': qs.filter(status=TenderStatus.ATTRIBUTED).count(),
            'draft': qs.filter(status=TenderStatus.DRAFT).count(),
        })


class CriterionViewSet(viewsets.ModelViewSet):
    serializer_class = CriterionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAcheteurOrAdmin]

    def get_queryset(self):
        tender_id = self.kwargs.get('tender_pk') or self.request.query_params.get('tender')
        if tender_id:
            return Criterion.objects.filter(tender_id=tender_id).order_by('order')
        return Criterion.objects.none()

    def perform_create(self, serializer):
        tender_id = self.kwargs.get('tender_pk') or self.request.data.get('tender')
        tender = Tender.objects.get(pk=tender_id)
        if tender.status != TenderStatus.DRAFT:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Critères verrouillés après publication.')
        serializer.save(tender=tender, order=tender.criteria.count())

    def perform_update(self, serializer):
        if serializer.instance.locked:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Ce critère est verrouillé.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.locked:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Ce critère est verrouillé.')
        instance.delete()
