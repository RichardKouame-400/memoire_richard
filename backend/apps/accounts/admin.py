from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Organization

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'sigle', 'email', 'is_active']

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'organization', 'is_verified', 'is_active']
    list_filter = ['role', 'is_verified', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Infos DAO', {'fields': ('role', 'organization', 'phone', 'company_name', 'rccm', 'nif', 'is_verified')}),
    )
