from rest_framework import serializers
from django.utils import timezone
from .models import Tender, Criterion, EvaluatorAssignment, TenderStatus
from apps.accounts.serializers import UserSerializer, OrganizationSerializer


class CriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Criterion
        fields = ['id', 'name', 'description', 'weight', 'evaluation_type',
                  'max_score', 'is_eliminating', 'min_threshold', 'order', 'locked']
        read_only_fields = ['locked']


class EvaluatorAssignmentSerializer(serializers.ModelSerializer):
    evaluator_detail = UserSerializer(source='evaluator', read_only=True)

    class Meta:
        model = EvaluatorAssignment
        fields = ['id', 'evaluator', 'evaluator_detail', 'criteria', 'assigned_at']


class TenderListSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.display_name', read_only=True)
    criteria_count = serializers.SerializerMethodField()
    submissions_count = serializers.SerializerMethodField()
    days_remaining = serializers.ReadOnlyField()
    is_open = serializers.ReadOnlyField()

    class Meta:
        model = Tender
        fields = [
            'id', 'reference', 'title', 'tender_type', 'status',
            'organization_name', 'created_by_name',
            'budget_estimated', 'budget_public',
            'deadline', 'published_at',
            'region', 'sector',
            'criteria_count', 'submissions_count',
            'days_remaining', 'is_open', 'created_at',
        ]

    def get_criteria_count(self, obj):
        return obj.criteria.count()

    def get_submissions_count(self, obj):
        return obj.submissions.count()


class TenderDetailSerializer(serializers.ModelSerializer):
    criteria = CriterionSerializer(many=True, read_only=True)
    organization_detail = OrganizationSerializer(source='organization', read_only=True)
    created_by_detail = UserSerializer(source='created_by', read_only=True)
    evaluator_assignments = EvaluatorAssignmentSerializer(many=True, read_only=True)
    winner_detail = UserSerializer(source='winner', read_only=True)
    submissions_count = serializers.SerializerMethodField()
    days_remaining = serializers.ReadOnlyField()
    is_open = serializers.ReadOnlyField()

    class Meta:
        model = Tender
        fields = '__all__'

    def get_submissions_count(self, obj):
        return obj.submissions.count()


class TenderCreateSerializer(serializers.ModelSerializer):
    criteria = CriterionSerializer(many=True, required=False)

    class Meta:
        model = Tender
        fields = [
            'title', 'description', 'tender_type',
            'budget_estimated', 'budget_public',
            'deadline', 'opening_date',
            'required_documents', 'eliminating_documents',
            'region', 'sector', 'criteria',
        ]

    def validate(self, data):
        deadline = data.get('deadline')
        if deadline and deadline <= timezone.now():
            raise serializers.ValidationError({'deadline': 'La date limite doit être dans le futur.'})
        return data

    def validate_criteria(self, criteria):
        if criteria:
            total_weight = sum(float(c.get('weight', 0)) for c in criteria)
            if abs(total_weight - 100) > 0.5:
                raise serializers.ValidationError(
                    f'La somme des poids doit être 100%. Actuel: {total_weight:.1f}%'
                )
        return criteria

    def create(self, validated_data):
        criteria_data = validated_data.pop('criteria', [])
        user = self.context['request'].user
        tender = Tender.objects.create(
            reference=Tender.generate_reference(),
            organization=user.organization,
            created_by=user,
            **validated_data
        )
        for i, cd in enumerate(criteria_data):
            Criterion.objects.create(tender=tender, order=i, **cd)
        from apps.audit.models import AuditLog
        request = self.context.get('request')
        AuditLog.log(user, 'create', 'Tender', tender.id, str(tender), f'AO {tender.reference} créé', request)
        return tender

    def update(self, instance, validated_data):
        validated_data.pop('criteria', None)
        if instance.status != 'draft':
            read_only = ['title', 'tender_type', 'deadline']
            for field in read_only:
                validated_data.pop(field, None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance
