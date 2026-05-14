from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone

from .models import Submission, SubmissionDocument, ExtractedData, SubmissionStatus
from .serializers import (
    SubmissionListSerializer, SubmissionDetailSerializer,
    SubmissionCreateSerializer, SubmissionDocumentSerializer,
)
from apps.accounts.models import Role


class SubmissionViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        tender_id = self.request.query_params.get('tender')
        qs = Submission.objects.select_related('submitter', 'tender')

        if tender_id:
            qs = qs.filter(tender_id=tender_id)

        if user.role == Role.SOUMISSIONNAIRE:
            return qs.filter(submitter=user)
        if user.role == Role.ACHETEUR:
            return qs.filter(tender__organization=user.organization)
        if user.role == Role.EVALUATEUR:
            return qs.filter(tender__evaluator_assignments__evaluator=user).distinct()
        return qs  # admin, auditeur

    def get_serializer_class(self):
        if self.action == 'create':
            return SubmissionCreateSerializer
        if self.action == 'list':
            return SubmissionListSerializer
        return SubmissionDetailSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        submission = self.get_object()
        if submission.submitter_id != request.user.id:
            return Response({'error': 'Accès refusé.'}, status=403)
        if submission.status != SubmissionStatus.DRAFT:
            return Response({'error': 'Cette offre a déjà été soumise.'}, status=400)
        submission.status = SubmissionStatus.SUBMITTED
        submission.submitted_at = timezone.now()
        submission.save()
        try:
            from .tasks import process_submission_documents
            process_submission_documents.delay(submission.id)
        except Exception:
            pass
        try:
            from apps.audit.models import AuditLog
            AuditLog.log(request.user, 'submit', 'Submission', submission.id, str(submission),
                         f'Offre soumise pour {submission.tender.reference}', request)
        except Exception:
            pass
        return Response({'message': 'Offre soumise avec succès. Traitement OCR en cours...'})

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_document(self, request, pk=None):
        submission = self.get_object()
        if submission.submitter_id != request.user.id and request.user.role not in [Role.SUPER_ADMIN, Role.ACHETEUR]:
            return Response({'error': 'Accès refusé.'}, status=403)
        if submission.status not in [SubmissionStatus.DRAFT, SubmissionStatus.SUBMITTED]:
            return Response({'error': "Impossible d'ajouter des documents à ce stade."}, status=400)

        file = request.FILES.get('file')
        doc_type = request.data.get('doc_type', 'autres')

        if not file:
            return Response({'error': 'Aucun fichier fourni.'}, status=400)

        # Remove existing doc of same type
        SubmissionDocument.objects.filter(submission=submission, doc_type=doc_type).delete()

        doc = SubmissionDocument.objects.create(
            submission=submission,
            doc_type=doc_type,
            file=file,
            original_name=file.name,
            file_size=file.size,
        )
        return Response(
            SubmissionDocumentSerializer(doc, context={'request': request}).data,
            status=201
        )

    @action(detail=True, methods=['delete'])
    def remove_document(self, request, pk=None):
        submission = self.get_object()
        doc_id = request.data.get('document_id')
        try:
            doc = SubmissionDocument.objects.get(id=doc_id, submission=submission)
            doc.file.delete(save=False)
            doc.delete()
            return Response({'message': 'Document supprimé.'})
        except SubmissionDocument.DoesNotExist:
            return Response({'error': 'Document introuvable.'}, status=404)

    @action(detail=True, methods=['patch'])
    def update_extracted(self, request, pk=None):
        """Allow evaluateur to manually correct extracted data."""
        submission = self.get_object()
        field_name = request.data.get('field_name')
        cleaned_value = request.data.get('cleaned_value')
        try:
            ed = ExtractedData.objects.get(submission=submission, field_name=field_name)
            ed.cleaned_value = cleaned_value
            ed.manually_verified = True
            ed.verified_by = request.user
            ed.save()
            return Response({'message': 'Donnée corrigée.', 'field_name': field_name, 'value': cleaned_value})
        except ExtractedData.DoesNotExist:
            return Response({'error': 'Champ introuvable.'}, status=404)

    @action(detail=False, methods=['get'])
    def my_submissions(self, request):
        """Shortcut for soumissionnaire to see all their submissions."""
        subs = Submission.objects.filter(submitter=request.user).order_by('-created_at')
        return Response(SubmissionListSerializer(subs, many=True).data)
