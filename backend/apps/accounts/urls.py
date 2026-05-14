from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.RegisterView.as_view(), name='register'),
    # Password reset
    path('forgot-password/', views.forgot_password, name='forgot-password'),
    path('reset-password/', views.reset_password, name='reset-password'),
    path('validate-reset-token/', views.validate_reset_token, name='validate-reset-token'),
    # User
    path('me/', views.me, name='me'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.change_password, name='change-password'),
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('evaluateurs/', views.evaluateurs_list, name='evaluateurs-list'),
    # Organizations
    path('organizations/', views.OrganizationListView.as_view(), name='org-list'),
    path('organizations/<int:pk>/', views.OrganizationDetailView.as_view(), name='org-detail'),
]
