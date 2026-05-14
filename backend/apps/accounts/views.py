from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Organization, Role
from .serializers import (
    UserSerializer, RegisterSerializer,
    OrganizationSerializer, CustomTokenObtainPairSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        allowed = ['first_name', 'last_name', 'email', 'phone', 'company_name', 'rccm', 'nif']
        data = {k: v for k, v in request.data.items() if k in allowed}
        for field, value in data.items():
            setattr(user, field, value)
        user.save()
        return Response(UserSerializer(user).data)


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == Role.SUPER_ADMIN:
            return User.objects.all().order_by('-date_joined')
        return User.objects.filter(organization=user.organization).order_by('-date_joined')


class OrganizationListView(generics.ListCreateAPIView):
    queryset = Organization.objects.filter(is_active=True).order_by("name")
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]


class OrganizationDetailView(generics.RetrieveUpdateAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    user = request.user
    old_password = request.data.get('old_password', '')
    new_password = request.data.get('new_password', '')
    if not user.check_password(old_password):
        return Response({'error': 'Ancien mot de passe incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
    if len(new_password) < 8:
        return Response({'error': 'Minimum 8 caractères.'}, status=status.HTTP_400_BAD_REQUEST)
    user.set_password(new_password)
    user.save()
    return Response({'message': 'Mot de passe modifié avec succès.'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def evaluateurs_list(request):
    evaluateurs = User.objects.filter(role=Role.EVALUATEUR, is_active=True)
    return Response(UserSerializer(evaluateurs, many=True).data)


# ─── Password Reset ───────────────────────────────────────────

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def forgot_password(request):
    """Send password reset email."""
    email = request.data.get('email', '').strip()
    if not email:
        return Response({'error': 'Email requis.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email, is_active=True)
    except User.DoesNotExist:
        # Security: don't reveal if email exists
        return Response({'message': 'Si cet email existe, un lien de réinitialisation a été envoyé.'})
    
    from .tokens import PasswordResetToken
    # Invalidate old tokens
    PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
    token_obj = PasswordResetToken.objects.create(user=user)
    
    # Send email
    from django.core.mail import send_mail
    from django.conf import settings
    reset_url = f"{request.data.get('frontend_url', 'http://localhost:5173')}/reset-password?token={token_obj.token}"
    
    try:
        send_mail(
            subject="[DAO Platform] Réinitialisation de votre mot de passe",
            message=f"""Bonjour {user.display_name},

Vous avez demandé la réinitialisation de votre mot de passe sur la plateforme DAO.

Cliquez sur ce lien pour créer un nouveau mot de passe (valable 2 heures) :
{reset_url}

Si vous n'avez pas effectué cette demande, ignorez cet email.

Cordialement,
La plateforme DAO — Institut Ivoirien de Technologie""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Email send error: {e}")
    
    return Response({'message': 'Si cet email existe, un lien de réinitialisation a été envoyé.'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password(request):
    """Reset password with token."""
    token_str = request.data.get('token', '')
    new_password = request.data.get('new_password', '')
    
    if not token_str or not new_password:
        return Response({'error': 'Token et nouveau mot de passe requis.'}, status=400)
    
    if len(new_password) < 8:
        return Response({'error': 'Le mot de passe doit avoir au moins 8 caractères.'}, status=400)
    
    from .tokens import PasswordResetToken
    import uuid as _uuid
    try:
        token_uuid = _uuid.UUID(str(token_str))
        token_obj = PasswordResetToken.objects.select_related('user').get(token=token_uuid)
    except (ValueError, PasswordResetToken.DoesNotExist):
        return Response({'error': 'Token invalide ou expiré.'}, status=400)
    
    if not token_obj.is_valid():
        return Response({'error': 'Ce lien de réinitialisation a expiré. Faites une nouvelle demande.'}, status=400)
    
    user = token_obj.user
    user.set_password(new_password)
    user.save()
    token_obj.used = True
    token_obj.save()
    
    try:
        from apps.audit.models import AuditLog
        AuditLog.log(user, 'update', 'User', user.id, str(user), 'Mot de passe réinitialisé via token', request)
    except Exception:
        pass
    
    return Response({'message': 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.'})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def validate_reset_token(request):
    """Check if a reset token is still valid."""
    token_str = request.query_params.get('token', '')
    from .tokens import PasswordResetToken
    import uuid as _uuid
    try:
        token_uuid = _uuid.UUID(str(token_str))
        token_obj = PasswordResetToken.objects.get(token=token_uuid)
        if token_obj.is_valid():
            return Response({'valid': True, 'email': token_obj.user.email})
        return Response({'valid': False, 'error': 'Token expiré.'})
    except Exception:
        return Response({'valid': False, 'error': 'Token invalide.'})
