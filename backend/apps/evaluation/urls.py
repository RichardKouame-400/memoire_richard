from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvaluationViewSet
from .reports import generate_evaluation_report

router = DefaultRouter()
router.register(r'', EvaluationViewSet, basename='evaluation')

urlpatterns = [
    path('', include(router.urls)),
    path('report/<int:tender_id>/', generate_evaluation_report, name='evaluation-report'),
]
