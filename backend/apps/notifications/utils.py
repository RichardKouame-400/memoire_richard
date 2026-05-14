from django.core.mail import send_mail
from django.conf import settings


def send_attribution_notification(tender, winning_submission):
    """Notify winner and other bidders of attribution result."""
    winner = winning_submission.submitter
    subject = f"[DAO Platform] Attribution - {tender.reference}"
    body = f"""
Bonjour {winner.display_name},

Nous avons le plaisir de vous informer que votre offre pour l'appel d'offres
{tender.reference} - "{tender.title}" a été retenue.

Score obtenu : {winning_submission.total_score:.2f}/100
Rang : 1er

Cordialement,
La plateforme DAO
"""
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [winner.email], fail_silently=True)
    except Exception:
        pass

    # Notify losers
    from apps.submissions.models import Submission
    others = Submission.objects.filter(tender=tender).exclude(id=winning_submission.id)
    for sub in others:
        try:
            send_mail(
                f"[DAO Platform] Résultat - {tender.reference}",
                f"Bonjour {sub.submitter.display_name},\n\nL'appel d'offres {tender.reference} a été attribué.\nMerci de votre participation.\n\nCordialement,\nLa plateforme DAO",
                settings.DEFAULT_FROM_EMAIL,
                [sub.submitter.email],
                fail_silently=True
            )
        except Exception:
            pass
