from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TenderViewSet, CriterionViewSet

router = DefaultRouter()
router.register(r'', TenderViewSet, basename='tender')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:tender_pk>/criteria/', CriterionViewSet.as_view({
        'get': 'list', 'post': 'create'
    }), name='tender-criteria'),
    path('<int:tender_pk>/criteria/<int:pk>/', CriterionViewSet.as_view({
        'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'
    }), name='tender-criterion-detail'),
]
