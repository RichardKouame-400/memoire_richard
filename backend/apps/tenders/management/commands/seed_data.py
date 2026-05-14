"""
Management command to seed the database with demo data.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random


class Command(BaseCommand):
    help = 'Seed database with demo data for testing'

    def handle(self, *args, **kwargs):
        from apps.accounts.models import User, Organization, Role
        from apps.tenders.models import Tender, Criterion, EvaluationType, TenderType, TenderStatus
        from apps.submissions.models import Submission, SubmissionStatus

        self.stdout.write('Seeding database...')

        # Create organization
        org, _ = Organization.objects.get_or_create(
            name="Ministère des Infrastructures",
            defaults={'sigle': 'MININFRA', 'email': 'contact@mininfra.ci', 'phone': '+225 27 20 00 00 00'}
        )

        # Create users
        admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@dao.ci', 'role': Role.SUPER_ADMIN,
                'first_name': 'Super', 'last_name': 'Admin',
                'is_staff': True, 'is_superuser': True, 'organization': org
            }
        )
        if not admin.has_usable_password() or admin.password == '':
            admin.set_password('admin123')
            admin.save()

        acheteur, _ = User.objects.get_or_create(
            username='acheteur1',
            defaults={
                'email': 'acheteur@dao.ci', 'role': Role.ACHETEUR,
                'first_name': 'Koffi', 'last_name': 'Assamoi',
                'organization': org
            }
        )
        acheteur.set_password('password123')
        acheteur.save()

        evaluateur, _ = User.objects.get_or_create(
            username='evaluateur1',
            defaults={
                'email': 'evaluateur@dao.ci', 'role': Role.EVALUATEUR,
                'first_name': 'Aya', 'last_name': 'Kouassi',
                'organization': org
            }
        )
        evaluateur.set_password('password123')
        evaluateur.save()

        soumissionnaire1, _ = User.objects.get_or_create(
            username='btpsolutions',
            defaults={
                'email': 'btp@dao.ci', 'role': Role.SOUMISSIONNAIRE,
                'first_name': 'Directeur', 'last_name': 'BTP',
                'company_name': 'BTP Solutions CI',
                'rccm': 'CI-ABJ-2020-B-12345',
                'nif': '2020A1234567'
            }
        )
        soumissionnaire1.set_password('password123')
        soumissionnaire1.save()

        soumissionnaire2, _ = User.objects.get_or_create(
            username='constructafrique',
            defaults={
                'email': 'construct@dao.ci', 'role': Role.SOUMISSIONNAIRE,
                'first_name': 'DG', 'last_name': 'Construct',
                'company_name': 'Construct-Afrique SARL',
                'rccm': 'CI-ABJ-2018-B-98765',
                'nif': '2018B9876543'
            }
        )
        soumissionnaire2.set_password('password123')
        soumissionnaire2.save()

        soumissionnaire3, _ = User.objects.get_or_create(
            username='sogeci',
            defaults={
                'email': 'sogeci@dao.ci', 'role': Role.SOUMISSIONNAIRE,
                'first_name': 'PDG', 'last_name': 'SOGECI',
                'company_name': 'SOGECI SA',
                'rccm': 'CI-ABJ-2015-B-55432',
                'nif': '2015A5543278'
            }
        )
        soumissionnaire3.set_password('password123')
        soumissionnaire3.save()

        self.stdout.write(f'✓ Users created')

        # Create tenders
        tender1, created = Tender.objects.get_or_create(
            reference='AO-2026-0001',
            defaults={
                'title': 'Construction de la route Bassam-Aboisso (120 km)',
                'description': 'Travaux de construction et bitumage de la route nationale reliant Grand-Bassam à Aboisso, incluant ouvrages d\'art et signalisation routière.',
                'tender_type': TenderType.TRAVAUX,
                'status': TenderStatus.EVALUATION,
                'organization': org,
                'created_by': acheteur,
                'budget_estimated': 15000000000,
                'budget_public': True,
                'deadline': timezone.now() - timedelta(days=3),
                'region': 'Sud-Comoé',
                'sector': 'Infrastructures routières',
                'published_at': timezone.now() - timedelta(days=30),
            }
        )

        if created:
            criteria_data = [
                {'name': 'Prix de l\'offre', 'weight': 40, 'evaluation_type': EvaluationType.AUTO_PRICE},
                {'name': 'Délai d\'exécution', 'weight': 20, 'evaluation_type': EvaluationType.AUTO_DELAY},
                {'name': 'Expérience en travaux similaires', 'weight': 25, 'evaluation_type': EvaluationType.MANUAL, 'max_score': 25},
                {'name': 'Capacité financière', 'weight': 15, 'evaluation_type': EvaluationType.AUTO_FINANCIAL},
            ]
            for i, cd in enumerate(criteria_data):
                Criterion.objects.create(tender=tender1, order=i, locked=True, **cd)

            # Create submissions with scores
            subs_data = [
                (soumissionnaire1, 12500000000, 540, 22, 18000000000),
                (soumissionnaire2, 13200000000, 600, 20, 15000000000),
                (soumissionnaire3, 11800000000, 480, 18, 22000000000),
            ]

            from apps.evaluation.models import Score
            for user, price, delay, exp_score, ca in subs_data:
                sub = Submission.objects.create(
                    tender=tender1, submitter=user,
                    status=SubmissionStatus.EVALUATED,
                    price_ht=price, execution_delay=delay,
                    submitted_at=timezone.now() - timedelta(days=5)
                )
                from apps.submissions.models import ExtractedData
                ExtractedData.objects.create(
                    submission=sub, field_name='chiffre_affaires',
                    field_label="Chiffre d'affaires",
                    cleaned_value=str(ca), confidence=0.85
                )

            self.stdout.write('  → Running scoring engine...')
            from apps.evaluation.engine import compute_tender_scores
            result = compute_tender_scores(tender1.id)
            self.stdout.write(f'  → Scores: {result}')

        tender2, created2 = Tender.objects.get_or_create(
            reference='AO-2026-0002',
            defaults={
                'title': 'Fourniture d\'équipements informatiques pour 50 écoles',
                'description': 'Acquisition et installation de matériel informatique (ordinateurs, tablettes, serveurs, réseaux) dans 50 établissements scolaires de la région Abidjan.',
                'tender_type': TenderType.FOURNITURES,
                'status': TenderStatus.PUBLISHED,
                'organization': org,
                'created_by': acheteur,
                'budget_estimated': 850000000,
                'budget_public': True,
                'deadline': timezone.now() + timedelta(days=15),
                'region': 'Abidjan',
                'sector': 'Technologies de l\'information',
                'published_at': timezone.now() - timedelta(days=10),
            }
        )

        if created2:
            criteria_data2 = [
                {'name': 'Prix total HT', 'weight': 45, 'evaluation_type': EvaluationType.AUTO_PRICE},
                {'name': 'Délai de livraison', 'weight': 15, 'evaluation_type': EvaluationType.AUTO_DELAY},
                {'name': 'Qualité technique du matériel', 'weight': 30, 'evaluation_type': EvaluationType.MANUAL, 'max_score': 30},
                {'name': 'Garantie et SAV', 'weight': 10, 'evaluation_type': EvaluationType.MANUAL, 'max_score': 10},
            ]
            for i, cd in enumerate(criteria_data2):
                Criterion.objects.create(tender=tender2, order=i, locked=True, **cd)

        tender3, _ = Tender.objects.get_or_create(
            reference='AO-2026-0003',
            defaults={
                'title': 'Mission de contrôle et surveillance - Pont Henri Konan Bédié',
                'description': 'Prestation de services d\'ingénierie pour le contrôle et la surveillance des travaux de réhabilitation du Pont HKB.',
                'tender_type': TenderType.SERVICES,
                'status': TenderStatus.DRAFT,
                'organization': org,
                'created_by': acheteur,
                'budget_estimated': 200000000,
                'budget_public': False,
                'deadline': timezone.now() + timedelta(days=30),
                'region': 'Abidjan',
                'sector': 'Ingénierie',
            }
        )

        self.stdout.write('✓ Tenders created')
        self.stdout.write('')
        self.stdout.write('=' * 50)
        self.stdout.write('DEMO CREDENTIALS:')
        self.stdout.write('  Super Admin:      admin / admin123')
        self.stdout.write('  Acheteur:         acheteur1 / password123')
        self.stdout.write('  Evaluateur:       evaluateur1 / password123')
        self.stdout.write('  Soumissionnaire1: btpsolutions / password123')
        self.stdout.write('  Soumissionnaire2: constructafrique / password123')
        self.stdout.write('  Soumissionnaire3: sogeci / password123')
        self.stdout.write('=' * 50)
        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
