from rest_framework import serializers
from .models import Submission, SubmissionDocument, ExtractedData, SubmissionStatus
from apps.accounts.serializers import UserSerializer


class SubmissionDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    doc_type_label = serializers.SerializerMethodField()

    class Meta:
        model = SubmissionDocument
        fields = ['id', 'doc_type', 'doc_type_label', 'file', 'file_url',
                  'original_name', 'file_size', 'ocr_processed', 'uploaded_at']
        read_only_fields = ['ocr_processed', 'original_name', 'file_size']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            try:
                return request.build_absolute_uri(obj.file.url)
            except Exception:
                return None
        return None

    def get_doc_type_label(self, obj):
        return obj.get_doc_type_display()


class ExtractedDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtractedData
        fields = ['id', 'field_name', 'field_label', 'raw_value', 'cleaned_value',
                  'confidence', 'manually_verified', 'created_at']


class ScoreInlineSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    criterion = serializers.IntegerField()
    criterion_name = serializers.CharField()
    criterion_weight = serializers.FloatField()
    raw_score = serializers.FloatField(allow_null=True)
    normalized_score = serializers.FloatField(allow_null=True)
    weighted_score = serializers.FloatField(allow_null=True)
    justification = serializers.CharField()
    is_auto = serializers.BooleanField()


class SubmissionListSerializer(serializers.ModelSerializer):
    submitter_name = serializers.CharField(source='submitter.display_name', read_only=True)
    tender_reference = serializers.CharField(source='tender.reference', read_only=True)
    tender_title = serializers.CharField(source='tender.title', read_only=True)
    documents_count = serializers.SerializerMethodField()
    score_display = serializers.ReadOnlyField()

    class Meta:
        model = Submission
        fields = [
            'id', 'tender', 'tender_reference', 'tender_title',
            'submitter', 'submitter_name', 'status',
            'price_ht', 'price_ttc', 'execution_delay',
            'total_score', 'rank', 'score_display', 'is_eliminated',
            'documents_count', 'submitted_at', 'created_at',
        ]

    def get_documents_count(self, obj):
        return obj.documents.count()


class SubmissionDetailSerializer(serializers.ModelSerializer):
    submitter_detail = UserSerializer(source='submitter', read_only=True)
    documents = SubmissionDocumentSerializer(many=True, read_only=True)
    extracted_data = ExtractedDataSerializer(many=True, read_only=True)
    score_display = serializers.ReadOnlyField()
    tender_reference = serializers.CharField(source='tender.reference', read_only=True)
    tender_title = serializers.CharField(source='tender.title', read_only=True)
    scores = serializers.SerializerMethodField()

    class Meta:
        model = Submission
        fields = '__all__'
        read_only_fields = ['total_score', 'rank', 'is_eliminated', 'submitted_at']

    def get_scores(self, obj):
        from apps.evaluation.models import Score
        scores = Score.objects.filter(submission=obj).select_related('criterion')
        return [{
            'id': s.id,
            'criterion': s.criterion_id,
            'criterion_name': s.criterion.name,
            'criterion_weight': s.criterion.weight,
            'raw_score': s.raw_score,
            'normalized_score': s.normalized_score,
            'weighted_score': s.weighted_score,
            'justification': s.justification,
            'is_auto': s.is_auto,
        } for s in scores]


class SubmissionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = ['tender', 'price_ht', 'price_ttc', 'execution_delay', 'notes']

    def validate(self, data):
        user = self.context['request'].user
        tender = data.get('tender')
        if Submission.objects.filter(tender=tender, submitter=user).exists():
            raise serializers.ValidationError('Vous avez déjà soumis une offre pour cet AO.')
        if not tender.is_open:
            raise serializers.ValidationError("Cet appel d'offres n'est plus ouvert aux soumissions.")
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        sub = Submission.objects.create(submitter=user, **validated_data)
        try:
            from apps.audit.models import AuditLog
            AuditLog.log(user, 'create', 'Submission', sub.id, str(sub),
                         f'Soumission créée pour {sub.tender.reference}',
                         self.context.get('request'))
        except Exception:
            pass
        return sub
