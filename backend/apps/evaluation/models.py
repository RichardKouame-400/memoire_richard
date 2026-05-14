from django.db import models
from simple_history.models import HistoricalRecords
from apps.accounts.models import User
from apps.tenders.models import Criterion
from apps.submissions.models import Submission


class Score(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='scores')
    criterion = models.ForeignKey(Criterion, on_delete=models.CASCADE, related_name='scores')
    evaluator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    raw_score = models.FloatField(help_text="Score brut (0 à max_score du critère)")
    normalized_score = models.FloatField(help_text="Score normalisé (0 à 100)")
    weighted_score = models.FloatField(help_text="Score pondéré (normalisé × poids)")
    justification = models.TextField(blank=True)
    is_auto = models.BooleanField(default=False)
    history = HistoricalRecords()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['submission', 'criterion']

    def __str__(self):
        return f"{self.submission} - {self.criterion.name}: {self.weighted_score:.2f}"


class EvaluationSession(models.Model):
    """Tracks the overall evaluation session for a tender"""
    tender = models.OneToOneField('tenders.Tender', on_delete=models.CASCADE, related_name='evaluation_session')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    started_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='started_evaluations')
    auto_scoring_done = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Session évaluation - {self.tender.reference}"
