from django.contrib import admin
from .models import Score, EvaluationSession

@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display = ['submission', 'criterion', 'raw_score', 'normalized_score', 'weighted_score', 'is_auto']
    list_filter = ['is_auto']

@admin.register(EvaluationSession)
class EvaluationSessionAdmin(admin.ModelAdmin):
    list_display = ['tender', 'started_at', 'auto_scoring_done']
