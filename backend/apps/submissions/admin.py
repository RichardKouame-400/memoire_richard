from django.contrib import admin
from .models import Submission, SubmissionDocument, ExtractedData

class DocumentInline(admin.TabularInline):
    model = SubmissionDocument
    extra = 0

class ExtractedDataInline(admin.TabularInline):
    model = ExtractedData
    extra = 0

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['tender', 'submitter', 'status', 'price_ht', 'total_score', 'rank', 'submitted_at']
    list_filter = ['status']
    inlines = [DocumentInline, ExtractedDataInline]
