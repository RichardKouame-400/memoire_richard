from rest_framework import viewsets, serializers, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Score, EvaluationSession
from apps.submissions.models import Submission, SubmissionStatus
from apps.tenders.models import Criterion


# ─── Serializers ──────────────────────────────────────────────

class ScoreSerializer(serializers.ModelSerializer):
    criterion_name = serializers.CharField(source='criterion.name', read_only=True)
    criterion_weight = serializers.FloatField(source='criterion.weight', read_only=True)
    evaluator_name = serializers.SerializerMethodField()

    class Meta:
        model = Score
        fields = ['id', 'submission', 'criterion', 'criterion_name', 'criterion_weight',
                  'raw_score', 'normalized_score', 'weighted_score',
                  'justification', 'is_auto', 'evaluator_name', 'created_at', 'updated_at']
        read_only_fields = ['normalized_score', 'weighted_score', 'is_auto', 'created_at', 'updated_at']

    def get_evaluator_name(self, obj):
        return obj.evaluator.display_name if obj.evaluator else 'Automatique'


class EvaluationSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationSession
        fields = '__all__'


# ─── Views ────────────────────────────────────────────────────

class EvaluationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def submit_manual_score(self, request):
        """Submit or update a manual score for one criterion on one submission."""
        submission_id = request.data.get('submission_id')
        criterion_id = request.data.get('criterion_id')
        raw_score = request.data.get('raw_score')
        justification = request.data.get('justification', '')

        if not all([submission_id, criterion_id, raw_score is not None]):
            return Response({'error': 'submission_id, criterion_id et raw_score sont requis.'}, status=400)

        try:
            submission = Submission.objects.get(id=submission_id)
            criterion = Criterion.objects.get(id=criterion_id)
        except (Submission.DoesNotExist, Criterion.DoesNotExist) as e:
            return Response({'error': str(e)}, status=404)

        raw_score = float(raw_score)
        if raw_score < 0 or raw_score > criterion.max_score:
            return Response({'error': f'Score doit être entre 0 et {criterion.max_score}.'}, status=400)

        norm = (raw_score / criterion.max_score) * 100
        weighted = norm * criterion.weight / 100

        score, _ = Score.objects.update_or_create(
            submission=submission,
            criterion=criterion,
            defaults={
                'raw_score': raw_score,
                'normalized_score': round(norm, 2),
                'weighted_score': round(weighted, 4),
                'justification': justification,
                'evaluator': request.user,
                'is_auto': False,
            }
        )

        # Recompute submission total
        _recompute_total(submission)

        try:
            from apps.audit.models import AuditLog
            AuditLog.log(request.user, 'evaluate', 'Score', score.id,
                         f'{submission.tender.reference} - {criterion.name}',
                         f'Note {raw_score}/{criterion.max_score}', request)
        except Exception:
            pass

        return Response(ScoreSerializer(score).data)

    @action(detail=False, methods=['get'])
    def submission_scores(self, request):
        submission_id = request.query_params.get('submission_id')
        if not submission_id:
            return Response({'error': 'submission_id requis.'}, status=400)
        scores = Score.objects.filter(submission_id=submission_id).select_related('criterion', 'evaluator')
        return Response(ScoreSerializer(scores, many=True).data)

    @action(detail=False, methods=['post'])
    def run_auto_scoring(self, request):
        tender_id = request.data.get('tender_id')
        if not tender_id:
            return Response({'error': 'tender_id requis.'}, status=400)
        try:
            from .tasks import auto_score_tender
            task = auto_score_tender.delay(int(tender_id))
            return Response({'message': 'Calcul lancé en arrière-plan.', 'task_id': str(task.id)})
        except Exception:
            # Fallback: run synchronously
            from .engine import compute_tender_scores
            result = compute_tender_scores(int(tender_id))
            return Response({'message': 'Calcul terminé.', 'result': result})

    @action(detail=False, methods=['get'])
    def tender_ranking(self, request):
        tender_id = request.query_params.get('tender_id')
        if not tender_id:
            return Response({'error': 'tender_id requis.'}, status=400)
        submissions = Submission.objects.filter(
            tender_id=tender_id
        ).exclude(status=SubmissionStatus.DRAFT).select_related(
            'submitter', 'tender'
        ).order_by('-total_score', 'rank')

        from apps.submissions.serializers import SubmissionDetailSerializer
        return Response(SubmissionDetailSerializer(
            submissions, many=True, context={'request': request}
        ).data)

    @action(detail=False, methods=['get'])
    def criteria_scores(self, request):
        tender_id = request.query_params.get('tender_id')
        if not tender_id:
            return Response({'error': 'tender_id requis.'}, status=400)
        scores = Score.objects.filter(
            submission__tender_id=tender_id
        ).select_related('submission__submitter', 'criterion', 'evaluator')
        return Response(ScoreSerializer(scores, many=True).data)

    @action(detail=False, methods=['get'])
    def session(self, request):
        tender_id = request.query_params.get('tender_id')
        if not tender_id:
            return Response({'error': 'tender_id requis.'}, status=400)
        try:
            session = EvaluationSession.objects.get(tender_id=tender_id)
            return Response(EvaluationSessionSerializer(session).data)
        except EvaluationSession.DoesNotExist:
            return Response({})


def _recompute_total(submission):
    """Recompute submission.total_score from all scored criteria."""
    criteria = submission.tender.criteria.all()
    scores = Score.objects.filter(submission=submission)

    if not criteria.exists():
        return

    scored_count = scores.count()
    total_weight = sum(c.weight for c in criteria)

    if scored_count == 0 or total_weight == 0:
        return

    total_weighted = sum(s.weighted_score for s in scores)
    # Score = total_weighted / total_weight * 100
    final = (total_weighted / total_weight) * 100
    submission.total_score = round(final, 2)

    if scored_count >= criteria.count():
        submission.status = SubmissionStatus.EVALUATED

    submission.save()
