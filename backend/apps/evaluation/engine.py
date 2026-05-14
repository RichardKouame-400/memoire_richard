"""
Scoring Engine for Appels d'Offres
====================================
Formula: Score_final = Σ (Score_normalisé_i × Poids_i / 100)

Auto criteria:
- auto_price:    Score = (Price_min / Price_j) × 100  (least cost = best)
- auto_delay:    Score = (Delay_min / Delay_j) × 100  (shortest = best)
- auto_financial: Score based on extracted chiffre_affaires

Manual criteria: Set by evaluator (0 to max_score)
"""
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


def compute_tender_scores(tender_id: int) -> Dict:
    """
    Main entry point: compute all scores for all submissions of a tender.
    Returns a dict with results and ranking.
    """
    from apps.tenders.models import Tender, Criterion, EvaluationType
    from apps.submissions.models import Submission, SubmissionStatus, ExtractedData
    from apps.evaluation.models import Score

    try:
        tender = Tender.objects.prefetch_related('criteria', 'submissions').get(id=tender_id)
    except Tender.DoesNotExist:
        logger.error(f"Tender {tender_id} not found")
        return {'error': 'Tender not found'}

    submissions = tender.submissions.exclude(
        status__in=[SubmissionStatus.DRAFT, SubmissionStatus.ELIMINE]
    )

    if not submissions.exists():
        return {'message': 'No submissions to score'}

    criteria = tender.criteria.all()
    auto_criteria = criteria.filter(evaluation_type__in=[
        EvaluationType.AUTO_PRICE,
        EvaluationType.AUTO_DELAY,
        EvaluationType.AUTO_FINANCIAL
    ])

    # Collect raw values for auto criteria
    raw_values = _collect_raw_values(submissions, auto_criteria)

    # Compute scores for each submission
    results = []
    for submission in submissions:
        total_weighted = 0.0
        scored_criteria = 0
        total_weight = 0.0

        for criterion in criteria:
            score_obj = _compute_criterion_score(
                submission, criterion, raw_values, EvaluationType
            )
            if score_obj is not None:
                raw_s, norm_s, weighted_s, is_auto = score_obj

                # Save or update Score
                Score.objects.update_or_create(
                    submission=submission,
                    criterion=criterion,
                    defaults={
                        'raw_score': raw_s,
                        'normalized_score': norm_s,
                        'weighted_score': weighted_s,
                        'is_auto': is_auto,
                    }
                )

                total_weighted += weighted_s
                total_weight += criterion.weight
                scored_criteria += 1

                # Check eliminating threshold
                if criterion.is_eliminating and criterion.min_threshold:
                    if norm_s < criterion.min_threshold:
                        submission.is_eliminated = True
                        submission.elimination_reason = (
                            f"Score insuffisant sur critère éliminatoire '{criterion.name}': "
                            f"{norm_s:.1f} < {criterion.min_threshold}"
                        )
                        submission.save()

        if not submission.is_eliminated:
            # Normalize total score to 100
            final_score = (total_weighted / total_weight * 100) if total_weight > 0 else total_weighted
            submission.total_score = round(final_score, 2)
            submission.status = SubmissionStatus.EVALUATED
            submission.save()

        results.append({
            'submission_id': submission.id,
            'submitter': submission.submitter.display_name,
            'total_score': submission.total_score,
            'is_eliminated': submission.is_eliminated,
        })

    # Assign ranks
    valid = sorted(
        [r for r in results if not r['is_eliminated'] and r['total_score'] is not None],
        key=lambda x: x['total_score'],
        reverse=True
    )
    for rank, r in enumerate(valid, 1):
        Submission.objects.filter(id=r['submission_id']).update(rank=rank)
        r['rank'] = rank

    return {
        'tender': tender.reference,
        'results': results,
        'ranked': valid,
    }


def _collect_raw_values(submissions, auto_criteria):
    """Collect raw values needed for relative scoring."""
    from apps.tenders.models import EvaluationType
    from apps.submissions.models import ExtractedData

    raw = {}

    for criterion in auto_criteria:
        values = {}
        for sub in submissions:
            if criterion.evaluation_type == EvaluationType.AUTO_PRICE:
                val = float(sub.price_ht or 0)
            elif criterion.evaluation_type == EvaluationType.AUTO_DELAY:
                val = float(sub.execution_delay or 0)
            elif criterion.evaluation_type == EvaluationType.AUTO_FINANCIAL:
                try:
                    ed = ExtractedData.objects.get(submission=sub, field_name='chiffre_affaires')
                    val = float(ed.cleaned_value or 0)
                except (ExtractedData.DoesNotExist, ValueError):
                    val = 0.0
            else:
                val = 0.0

            values[sub.id] = val

        raw[criterion.id] = values

    return raw


def _compute_criterion_score(submission, criterion, raw_values, EvaluationType):
    """
    Compute the score for one criterion.
    Returns (raw_score, normalized_score, weighted_score, is_auto) or None.
    """
    from apps.evaluation.models import Score

    ctype = criterion.evaluation_type
    weight = criterion.weight

    if ctype == EvaluationType.AUTO_PRICE:
        values = raw_values.get(criterion.id, {})
        my_val = values.get(submission.id, 0)
        if my_val <= 0:
            return (0, 0, 0, True)
        min_val = min((v for v in values.values() if v > 0), default=my_val)
        norm = (min_val / my_val) * 100
        norm = min(100, max(0, norm))
        weighted = norm * weight / 100
        return (my_val, round(norm, 2), round(weighted, 4), True)

    elif ctype == EvaluationType.AUTO_DELAY:
        values = raw_values.get(criterion.id, {})
        my_val = values.get(submission.id, 0)
        if my_val <= 0:
            return (0, 0, 0, True)
        min_val = min((v for v in values.values() if v > 0), default=my_val)
        norm = (min_val / my_val) * 100
        norm = min(100, max(0, norm))
        weighted = norm * weight / 100
        return (my_val, round(norm, 2), round(weighted, 4), True)

    elif ctype == EvaluationType.AUTO_FINANCIAL:
        values = raw_values.get(criterion.id, {})
        my_val = values.get(submission.id, 0)
        max_val = max(values.values(), default=1) or 1
        norm = (my_val / max_val) * 100
        norm = min(100, max(0, norm))
        weighted = norm * weight / 100
        return (my_val, round(norm, 2), round(weighted, 4), True)

    elif ctype == EvaluationType.MANUAL:
        # Check if a manual score has been submitted
        try:
            existing = Score.objects.get(submission=submission, criterion=criterion)
            if existing.raw_score is not None:
                norm = (existing.raw_score / criterion.max_score) * 100
                weighted = norm * weight / 100
                return (existing.raw_score, round(norm, 2), round(weighted, 4), False)
        except Score.DoesNotExist:
            pass
        return None  # Not yet scored

    return None
