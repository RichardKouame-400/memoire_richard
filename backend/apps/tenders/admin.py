from django.contrib import admin
from .models import Tender, Criterion, EvaluatorAssignment

class CriterionInline(admin.TabularInline):
    model = Criterion
    extra = 1

@admin.register(Tender)
class TenderAdmin(admin.ModelAdmin):
    list_display = ['reference', 'title', 'tender_type', 'status', 'organization', 'deadline']
    list_filter = ['status', 'tender_type']
    search_fields = ['reference', 'title']
    inlines = [CriterionInline]

@admin.register(EvaluatorAssignment)
class EvaluatorAssignmentAdmin(admin.ModelAdmin):
    list_display = ['tender', 'evaluator', 'assigned_at']
