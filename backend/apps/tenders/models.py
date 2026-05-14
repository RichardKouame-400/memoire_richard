from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords
from apps.accounts.models import User, Organization


class TenderType(models.TextChoices):
    TRAVAUX = 'travaux', 'Travaux'
    FOURNITURES = 'fournitures', 'Fournitures'
    SERVICES = 'services', 'Services intellectuels'
    PRESTATIONS = 'prestations', 'Prestations de services'


class TenderStatus(models.TextChoices):
    DRAFT = 'draft', 'Brouillon'
    PUBLISHED = 'published', 'Publié'
    CLOSED = 'closed', 'Clôturé'
    EVALUATION = 'evaluation', 'En évaluation'
    ATTRIBUTED = 'attributed', 'Attribué'
    CANCELLED = 'cancelled', 'Annulé'


class EvaluationType(models.TextChoices):
    AUTO_PRICE = 'auto_price', 'Automatique (Prix)'
    AUTO_DELAY = 'auto_delay', 'Automatique (Délai)'
    AUTO_FINANCIAL = 'auto_financial', 'Automatique (Capacité financière)'
    MANUAL = 'manual', 'Manuel (Évaluateur)'


class Tender(models.Model):
    reference = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=500)
    description = models.TextField()
    tender_type = models.CharField(max_length=30, choices=TenderType.choices)
    status = models.CharField(max_length=30, choices=TenderStatus.choices, default=TenderStatus.DRAFT)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='tenders')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tenders')
    budget_estimated = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    budget_public = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    deadline = models.DateTimeField(help_text="Date limite de soumission")
    opening_date = models.DateTimeField(null=True, blank=True)
    attribution_date = models.DateTimeField(null=True, blank=True)
    # Requirements
    required_documents = models.JSONField(default=list)
    eliminating_documents = models.JSONField(default=list)
    # Localization
    region = models.CharField(max_length=100, blank=True)
    sector = models.CharField(max_length=100, blank=True)
    # Results
    winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_tenders')
    winner_score = models.FloatField(null=True, blank=True)
    # Docs
    dao_file = models.FileField(upload_to='dao_files/', null=True, blank=True)
    history = HistoricalRecords()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Appel d'offres"

    def __str__(self):
        return f"{self.reference} - {self.title}"

    @property
    def is_open(self):
        return self.status == TenderStatus.PUBLISHED and timezone.now() < self.deadline

    @property
    def days_remaining(self):
        if self.deadline:
            delta = self.deadline - timezone.now()
            return max(0, delta.days)
        return 0

    def auto_close(self):
        if self.status == TenderStatus.PUBLISHED and timezone.now() >= self.deadline:
            self.status = TenderStatus.CLOSED
            self.save()

    @classmethod
    def generate_reference(cls):
        import datetime
        year = datetime.datetime.now().year
        count = cls.objects.filter(created_at__year=year).count() + 1
        return f"AO-{year}-{count:04d}"


class Criterion(models.Model):
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name='criteria')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    weight = models.FloatField(help_text="Poids en pourcentage (0-100)")
    evaluation_type = models.CharField(max_length=30, choices=EvaluationType.choices, default=EvaluationType.MANUAL)
    max_score = models.FloatField(default=100)
    is_eliminating = models.BooleanField(default=False)
    min_threshold = models.FloatField(null=True, blank=True, help_text="Score minimum pour ne pas être éliminé")
    order = models.PositiveIntegerField(default=0)
    locked = models.BooleanField(default=False, help_text="Verrouillé après publication")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.tender.reference} - {self.name} ({self.weight}%)"


class EvaluatorAssignment(models.Model):
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name='evaluator_assignments')
    evaluator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignments')
    criteria = models.ManyToManyField(Criterion, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='given_assignments')

    class Meta:
        unique_together = ['tender', 'evaluator']
