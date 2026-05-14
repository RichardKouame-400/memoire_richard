"""
Report generation module.
Generates PDF evaluation reports using ReportLab.
"""
import io
from django.http import FileResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_evaluation_report(request, tender_id):
    """Generate a PDF report for a tender's evaluation results."""
    from apps.tenders.models import Tender
    from apps.submissions.models import Submission, SubmissionStatus
    from apps.evaluation.models import Score

    try:
        tender = Tender.objects.prefetch_related('criteria').get(id=tender_id)
    except Tender.DoesNotExist:
        return Response({'error': 'AO introuvable.'}, status=404)

    submissions = Submission.objects.filter(
        tender=tender
    ).exclude(status=SubmissionStatus.DRAFT).order_by('-total_score')

    buffer = io.BytesIO()
    _build_pdf(buffer, tender, submissions)
    buffer.seek(0)

    filename = f'PV_Evaluation_{tender.reference}_{timezone.now().strftime("%Y%m%d")}.pdf'
    return FileResponse(buffer, as_attachment=True, filename=filename, content_type='application/pdf')


def _build_pdf(buffer, tender, submissions):
    """Build PDF using ReportLab."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=2*cm, leftMargin=2*cm,
            topMargin=2*cm, bottomMargin=2*cm
        )
        styles = getSampleStyleSheet()
        story = []

        # Header
        title_style = ParagraphStyle('Title', parent=styles['Heading1'],
                                      fontSize=16, spaceAfter=6, alignment=TA_CENTER,
                                      textColor=colors.HexColor('#0f2444'))
        subtitle_style = ParagraphStyle('Sub', parent=styles['Normal'],
                                         fontSize=10, alignment=TA_CENTER,
                                         textColor=colors.grey)
        body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9, spaceAfter=4)

        story.append(Paragraph("PROCÈS-VERBAL D'ÉVALUATION DES OFFRES", title_style))
        story.append(Paragraph("Plateforme DAO — Institut Ivoirien de Technologie", subtitle_style))
        story.append(Spacer(1, 0.4*cm))
        story.append(HRFlowable(width='100%', thickness=2, color=colors.HexColor('#16a34a')))
        story.append(Spacer(1, 0.4*cm))

        # Tender info
        info_data = [
            ['Référence AO', tender.reference],
            ['Objet', tender.title],
            ['Type', tender.get_tender_type_display() if hasattr(tender, 'get_tender_type_display') else tender.tender_type],
            ['Organisme', tender.organization.name if tender.organization else '—'],
            ['Date de clôture', tender.deadline.strftime('%d/%m/%Y %H:%M') if tender.deadline else '—'],
            ['Statut', tender.get_status_display() if hasattr(tender, 'get_status_display') else tender.status],
            ["Date du rapport", timezone.now().strftime('%d/%m/%Y %H:%M')],
        ]
        if tender.budget_public and tender.budget_estimated:
            info_data.append(['Budget estimatif', f"{int(tender.budget_estimated):,} FCFA".replace(',', ' ')])

        info_table = Table(info_data, colWidths=[5*cm, 12*cm])
        info_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f1f5f9')),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.5*cm))

        # Criteria grid
        story.append(Paragraph('GRILLE D\'ÉVALUATION', ParagraphStyle('H2', parent=styles['Heading2'],
                                                                        fontSize=12, textColor=colors.HexColor('#0f2444'),
                                                                        spaceAfter=4)))
        crit_headers = ['N°', 'Critère', 'Type', 'Poids']
        crit_data = [crit_headers]
        for i, c in enumerate(tender.criteria.all(), 1):
            type_label = {'auto_price': 'Auto (Prix)', 'auto_delay': 'Auto (Délai)',
                          'auto_financial': 'Auto (Fin.)', 'manual': 'Manuel'}.get(c.evaluation_type, c.evaluation_type)
            crit_data.append([str(i), c.name, type_label, f'{c.weight:.0f}%'])

        crit_table = Table(crit_data, colWidths=[1*cm, 9*cm, 4*cm, 2.5*cm])
        crit_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f2444')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(crit_table)
        story.append(Spacer(1, 0.5*cm))

        # Results ranking
        story.append(Paragraph('CLASSEMENT DES OFFRES', ParagraphStyle('H2', parent=styles['Heading2'],
                                                                         fontSize=12, textColor=colors.HexColor('#0f2444'),
                                                                         spaceAfter=4)))

        rank_headers = ['Rang', 'Soumissionnaire', 'Prix HT (FCFA)', 'Délai (j)', 'Score Total', 'Statut']
        rank_data = [rank_headers]
        for i, s in enumerate(submissions, 1):
            if s.is_eliminated:
                rank_str = 'ÉLIM.'
            else:
                rank_str = f'#{s.rank}' if s.rank else str(i)
            price = f"{int(s.price_ht):,}".replace(',', ' ') if s.price_ht else '—'
            score = f"{s.total_score:.2f}/100" if s.total_score is not None else '—'
            stat = 'Éliminé' if s.is_eliminated else 'Valide'
            rank_data.append([rank_str, s.submitter.display_name, price,
                               str(s.execution_delay) if s.execution_delay else '—', score, stat])

        rank_table = Table(rank_data, colWidths=[1.5*cm, 5.5*cm, 4*cm, 2*cm, 2.5*cm, 2*cm])
        rank_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#16a34a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        # Highlight winner
        if len(rank_data) > 1:
            rank_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#fef9c3')),
                ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ]))
        story.append(rank_table)
        story.append(Spacer(1, 0.6*cm))

        # Winner banner
        if tender.winner:
            winner_style = ParagraphStyle('Winner', parent=styles['Normal'], fontSize=10,
                                           textColor=colors.HexColor('#0f2444'),
                                           borderColor=colors.HexColor('#16a34a'),
                                           borderWidth=1, borderPadding=8, backColor=colors.HexColor('#f0fdf4'))
            story.append(Paragraph(
                f"<b>LAURÉAT :</b> {tender.winner.display_name}"
                + (f" — Score : {tender.winner_score:.2f}/100" if tender.winner_score else ""),
                winner_style
            ))
            story.append(Spacer(1, 0.4*cm))

        # Signature block
        story.append(Spacer(1, cm))
        story.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#e2e8f0')))
        story.append(Spacer(1, 0.3*cm))
        sig_data = [
            ['L\'Acheteur Public', '', 'Le Soumissionnaire Retenu'],
            ['', '', ''],
            ['Signature & Cachet', '', 'Signature & Cachet'],
        ]
        sig_table = Table(sig_data, colWidths=[6*cm, 5*cm, 6*cm])
        sig_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TEXTCOLOR', (1, 0), (1, 0), colors.white),
        ]))
        story.append(sig_table)

        doc.build(story)

    except ImportError:
        # ReportLab not installed - write minimal text
        buffer.write(b'PDF generation requires reportlab. Install with: pip install reportlab')
