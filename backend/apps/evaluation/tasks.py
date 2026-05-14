from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def auto_score_tender(self, tender_id):
    """Run automatic scoring for all auto-criteria in a tender."""
    from .engine import compute_tender_scores
    from apps.evaluation.models import EvaluationSession
    from apps.tenders.models import Tender
    from django.utils import timezone

    try:
        logger.info(f"Starting auto-scoring for tender {tender_id}")
        result = compute_tender_scores(tender_id)

        # Mark session as auto-done
        tender = Tender.objects.get(id=tender_id)
        session, _ = EvaluationSession.objects.get_or_create(tender=tender)
        session.auto_scoring_done = True
        session.save()

        logger.info(f"Auto-scoring complete for tender {tender_id}: {result}")
        return result

    except Exception as exc:
        logger.error(f"Auto-scoring failed for tender {tender_id}: {exc}")
        self.retry(exc=exc, countdown=30)
