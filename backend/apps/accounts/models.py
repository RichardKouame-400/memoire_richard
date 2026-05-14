from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    SUPER_ADMIN = 'super_admin', 'Super Administrateur'
    ACHETEUR = 'acheteur', 'Acheteur Public'
    EVALUATEUR = 'evaluateur', 'Évaluateur'
    SOUMISSIONNAIRE = 'soumissionnaire', 'Soumissionnaire'
    AUDITEUR = 'auditeur', 'Auditeur'


class Organization(models.Model):
    name = models.CharField(max_length=255)
    sigle = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Organisation"

    def __str__(self):
        return self.name


class User(AbstractUser):
    role = models.CharField(max_length=30, choices=Role.choices, default=Role.SOUMISSIONNAIRE)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    phone = models.CharField(max_length=20, blank=True)
    # For soumissionnaire (enterprise info)
    company_name = models.CharField(max_length=255, blank=True)
    rccm = models.CharField(max_length=100, blank=True, verbose_name='RCCM')
    nif = models.CharField(max_length=100, blank=True, verbose_name='NIF')
    is_verified = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    class Meta:
        verbose_name = "Utilisateur"

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"

    @property
    def display_name(self):
        if self.role == Role.SOUMISSIONNAIRE and self.company_name:
            return self.company_name
        return self.get_full_name() or self.username


import uuid
from django.utils import timezone
from datetime import timedelta


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def is_valid(self):
        return not self.used and (timezone.now() - self.created_at) < timedelta(hours=2)

    def __str__(self):
        return f"ResetToken({self.user.username}, valid={self.is_valid()})"
