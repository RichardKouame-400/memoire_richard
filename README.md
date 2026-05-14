# 🏛️ DAO Platform — Système Numérique d'Évaluation des Appels d'Offres
**Mémoire de fin de cycle — Kouame Aka Richard Emmanuel — IIT Grand-Bassam 2025-2026**

## 🚀 Lancer la plateforme (Docker)

```bash
# Cloner/extraire le projet
cd dao_platform

# Démarrer tous les services
docker-compose up --build

# L'application est disponible sur :
# Frontend : http://localhost:5173
# Backend API : http://localhost:8000/api/
# Admin Django : http://localhost:8000/admin/
```

## 🔑 Comptes de démonstration

| Rôle | Username | Password |
|------|----------|----------|
| Super Admin | `admin` | `admin123` |
| Acheteur Public | `acheteur1` | `password123` |
| Évaluateur | `evaluateur1` | `password123` |
| Soumissionnaire 1 | `btpsolutions` | `password123` |
| Soumissionnaire 2 | `constructafrique` | `password123` |
| Soumissionnaire 3 | `sogeci` | `password123` |

## 📐 Stack technique

| Couche | Technologies |
|--------|-------------|
| **Backend** | Django 4.2 + Django REST Framework + JWT |
| **Auth** | djangorestframework-simplejwt + RBAC |
| **Async** | Celery 5 + Redis 7 |
| **OCR** | pdfplumber (PDF natifs) |
| **Scoring** | Algorithme pondéré maison (engine.py) |
| **Base de données** | PostgreSQL 15 |
| **Audit** | django-simple-history |
| **Frontend** | React 18 + Vite + Framer Motion |
| **UI** | Tailwind CSS + Radix UI |
| **State** | TanStack Query (React Query) |
| **Déploiement** | Docker Compose + Gunicorn |

## 🗂️ Structure du projet

```
dao_platform/
├── backend/
│   ├── apps/
│   │   ├── accounts/     # Auth, utilisateurs, rôles RBAC
│   │   ├── tenders/      # Appels d'offres, critères
│   │   ├── submissions/  # Soumissions, documents, OCR
│   │   ├── evaluation/   # Moteur de scoring, scores
│   │   ├── audit/        # Piste d'audit complète
│   │   └── notifications/# Emails attribution
│   ├── config/           # Settings, URLs, Celery
│   └── manage.py
└── frontend/
    └── src/
        ├── pages/        # Dashboard, AO, Soumissions, Évaluation
        ├── components/   # UI components avec Framer Motion
        ├── hooks/        # useAuth
        └── api/          # Client axios avec auto-refresh JWT
```

## 🔄 Algorithme de scoring

```
Score_final = Σ (Score_normalisé_i × Poids_i / 100)

Auto_prix   : (Prix_min / Prix_j) × 100
Auto_délai  : (Délai_min / Délai_j) × 100
Auto_fin    : (CA_j / CA_max) × 100
Manuel      : Note_évaluateur / Score_max × 100
```

## 🌍 API Endpoints principaux

```
POST   /api/auth/login/
POST   /api/auth/register/
GET    /api/auth/me/

GET    /api/tenders/
POST   /api/tenders/
GET    /api/tenders/{id}/
POST   /api/tenders/{id}/publish/
POST   /api/tenders/{id}/start_evaluation/
POST   /api/tenders/{id}/attribute/

GET    /api/submissions/
POST   /api/submissions/
POST   /api/submissions/{id}/submit/
POST   /api/submissions/{id}/upload_document/

POST   /api/evaluation/submit_manual_score/
GET    /api/evaluation/tender_ranking/
POST   /api/evaluation/run_auto_scoring/

GET    /api/audit/
```
