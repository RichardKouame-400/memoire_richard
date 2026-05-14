from django.db import models
from apps.accounts.models import User


class AuditLog(models.Model):
    class ActionType(models.TextChoices):
        CREATE = 'create', 'Création'
        UPDATE = 'update', 'Modification'
        DELETE = 'delete', 'Suppression'
        PUBLISH = 'publish', 'Publication'
        SUBMIT = 'submit', 'Soumission'
        EVALUATE = 'evaluate', 'Évaluation'
        ATTRIBUTE = 'attribute', 'Attribution'
        LOGIN = 'login', 'Connexion'
        LOGOUT = 'logout', 'Déconnexion'

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=30, choices=ActionType.choices)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, blank=True)
    object_repr = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp} - {self.user} - {self.action} - {self.model_name}"

    @classmethod
    def log(cls, user, action, model_name, object_id='', object_repr='', description='', request=None):
        ip = None
        ua = ''
        if request:
            ip = request.META.get('REMOTE_ADDR')
            ua = request.META.get('HTTP_USER_AGENT', '')[:500]
        return cls.objects.create(
            user=user, action=action, model_name=model_name,
            object_id=str(object_id), object_repr=object_repr,
            description=description, ip_address=ip, user_agent=ua
        )
