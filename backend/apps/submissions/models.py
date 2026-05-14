from django.db import models
from simple_history.models import HistoricalRecords
from apps.accounts.models import User
from apps.tenders.models import Tender


class SubmissionStatus(models.TextChoices):
    DRAFT = 'draft', 'Brouillon'
    SUBMITTED = 'submitted', 'Soumis'
    PROCESSING = 'processing', 'En traitement OCR'
    INCOMPLETE = 'incomplete', 'Dossier incomplet'
    COMPLETE = 'complete', 'Dossier complet'
    ELIMINE = 'elimine', 'Éliminé'
    EVALUATED = 'evaluated', 'Évalué'


class DocumentType(models.TextChoices):
    ATTESTATION_FISCALE = 'attestation_fiscale', 'Attestation fiscale'
    RCCM = 'rccm', 'RCCM'
    NON_FAILLITE = 'non_faillite', 'Attestation de non-faillite'
    BILAN = 'bilan', 'Bilan financier'
    OFFRE_TECHNIQUE = 'offre_technique', 'Offre technique'
    OFFRE_FINANCIERE = 'offre_financiere', 'Offre financière'
    REFERENCES = 'references', 'Références similaires'
    AUTRES = 'autres', 'Autres'


class Submission(models.Model):
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name='submissions')
    submitter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    status = models.CharField(max_length=30, choices=SubmissionStatus.choices, default=SubmissionStatus.DRAFT)
    # Financial offer
    price_ht = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name='Prix HT (FCFA)')
    price_ttc = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, verbose_name='Prix TTC (FCFA)')
    execution_delay = models.PositiveIntegerField(null=True, blank=True, verbose_name='Délai (jours)')
    # Scores
    total_score = models.FloatField(null=True, blank=True)
    rank = models.PositiveIntegerField(null=True, blank=True)
    is_eliminated = models.BooleanField(default=False)
    elimination_reason = models.TextField(blank=True)
    # Notes
    notes = models.TextField(blank=True)
    history = HistoricalRecords()
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['tender', 'submitter']
        ordering = ['-total_score', 'rank']

    def __str__(self):
        return f"{self.tender.reference} - {self.submitter.display_name}"

    @property
    def score_display(self):
        if self.total_score is not None:
            return f"{self.total_score:.2f}/100"
        return "N/A"


class SubmissionDocument(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=50, choices=DocumentType.choices)
    file = models.FileField(upload_to='submissions/%Y/%m/')
    original_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(default=0)
    # OCR Results
    ocr_processed = models.BooleanField(default=False)
    ocr_text = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.submission} - {self.get_doc_type_display()}"

    def save(self, *args, **kwargs):
        if self.file and hasattr(self.file, 'size'):
            self.file_size = self.file.size
        if self.file and hasattr(self.file, 'name'):
            self.original_name = self.file.name
        super().save(*args, **kwargs)


class ExtractedData(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='extracted_data')
    document = models.ForeignKey(SubmissionDocument, on_delete=models.CASCADE, null=True, blank=True)
    field_name = models.CharField(max_length=100)
    field_label = models.CharField(max_length=200)
    raw_value = models.TextField(blank=True)
    cleaned_value = models.TextField(blank=True)
    confidence = models.FloatField(default=0.0)
    manually_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['submission', 'field_name']

    def __str__(self):
        return f"{self.submission} - {self.field_label}: {self.cleaned_value}"
