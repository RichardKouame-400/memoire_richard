from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_submission_documents(self, submission_id):
    """
    Process OCR on all documents of a submission.
    Extracts: price, delay, financial data, tax numbers, etc.
    """
    from .models import Submission, SubmissionDocument, ExtractedData, SubmissionStatus, DocumentType

    try:
        submission = Submission.objects.get(id=submission_id)
        submission.status = SubmissionStatus.PROCESSING
        submission.save()

        for doc in submission.documents.filter(ocr_processed=False):
            try:
                extracted = extract_from_document(doc)
                for field_name, data in extracted.items():
                    ExtractedData.objects.update_or_create(
                        submission=submission,
                        field_name=field_name,
                        defaults={
                            'document': doc,
                            'field_label': data['label'],
                            'raw_value': data['raw'],
                            'cleaned_value': data['value'],
                            'confidence': data['confidence'],
                        }
                    )
                doc.ocr_processed = True
                doc.save()

            except Exception as e:
                logger.error(f"OCR error for doc {doc.id}: {e}")

        # Sync price/delay from extracted data to submission
        _sync_extracted_to_submission(submission)

        submission.status = SubmissionStatus.COMPLETE
        submission.save()

        logger.info(f"Submission {submission_id} processed successfully.")

    except Submission.DoesNotExist:
        logger.error(f"Submission {submission_id} not found.")
    except Exception as exc:
        logger.error(f"Task failed for submission {submission_id}: {exc}")
        self.retry(exc=exc, countdown=60)


def extract_from_document(doc):
    """
    Extract structured data from a document.
    Uses pdfplumber for native PDFs, simulates OCR for images.
    Returns dict of {field_name: {label, raw, value, confidence}}
    """
    extracted = {}
    file_path = doc.file.path

    try:
        if file_path.lower().endswith('.pdf'):
            extracted.update(_extract_from_pdf(doc, file_path))
    except Exception as e:
        logger.warning(f"Extraction failed for {doc.id}: {e}")

    return extracted


def _extract_from_pdf(doc, file_path):
    """Extract data from PDF using pdfplumber."""
    from .models import DocumentType
    import re

    results = {}
    text = ""

    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
    except Exception:
        return results

    doc.ocr_text = text[:5000]
    doc.save(update_fields=['ocr_text'])

    # Extract based on document type
    if doc.doc_type == DocumentType.OFFRE_FINANCIERE:
        # Try to find price
        price_patterns = [
            r'(?:montant|total|prix)\s*(?:ht|ttc)?\s*[:\=]\s*([\d\s\.,]+)',
            r'([\d\s]+)\s*(?:fcfa|f\.cfa|cfa|xof)',
        ]
        for pattern in price_patterns:
            match = re.search(pattern, text.lower())
            if match:
                raw = match.group(1).strip()
                cleaned = re.sub(r'[\s]', '', raw).replace(',', '')
                try:
                    float(cleaned)
                    results['price_ht'] = {
                        'label': 'Prix HT (FCFA)',
                        'raw': raw,
                        'value': cleaned,
                        'confidence': 0.75
                    }
                    break
                except ValueError:
                    pass

        # Try to find delay
        delay_match = re.search(r'(?:délai|delai|durée)\s*[:\=]?\s*(\d+)\s*(?:jours?|mois)', text.lower())
        if delay_match:
            results['execution_delay'] = {
                'label': "Délai d'exécution (jours)",
                'raw': delay_match.group(0),
                'value': delay_match.group(1),
                'confidence': 0.80
            }

    elif doc.doc_type == DocumentType.BILAN:
        # Extract CA
        ca_match = re.search(r'(?:chiffre\s+d.affaires|ca)\s*[:\=]?\s*([\d\s\.,]+)', text.lower())
        if ca_match:
            raw = ca_match.group(1).strip()
            cleaned = re.sub(r'[\s]', '', raw).replace(',', '')
            results['chiffre_affaires'] = {
                'label': "Chiffre d'affaires",
                'raw': raw,
                'value': cleaned,
                'confidence': 0.70
            }

    elif doc.doc_type == DocumentType.ATTESTATION_FISCALE:
        # Extract NIF
        nif_match = re.search(r'(?:nif|numéro\s+identif)\s*[:\=]?\s*([A-Z0-9]+)', text.upper())
        if nif_match:
            results['nif'] = {
                'label': 'Numéro NIF',
                'raw': nif_match.group(1),
                'value': nif_match.group(1),
                'confidence': 0.85
            }

    return results


def _sync_extracted_to_submission(submission):
    """Sync extracted data values back to submission fields."""
    from .models import ExtractedData

    try:
        price_data = ExtractedData.objects.get(submission=submission, field_name='price_ht')
        val = float(price_data.cleaned_value)
        if not submission.price_ht:
            submission.price_ht = val
    except (ExtractedData.DoesNotExist, ValueError):
        pass

    try:
        delay_data = ExtractedData.objects.get(submission=submission, field_name='execution_delay')
        val = int(delay_data.cleaned_value)
        if not submission.execution_delay:
            submission.execution_delay = val
    except (ExtractedData.DoesNotExist, ValueError):
        pass

    submission.save()
