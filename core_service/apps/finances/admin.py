from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from unfold.admin import ModelAdmin

# Register your models here.
from .models import Category, Transaction, Budget, UserProfile, UserDevice, MarketingCampaign, Notification

# Unregister standard User & Group models to replace them with beautiful Unfold versions
admin.site.unregister(User)
admin.site.unregister(Group)

@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    pass

@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass

@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ('name', 'type', 'user')
    list_filter = ('type',)

@admin.register(Transaction)
class TransactionAdmin(ModelAdmin):
    list_display = ('date', 'category', 'amount', 'user')
    list_filter = ('date', 'category__type')

@admin.register(Budget)
class BudgetAdmin(ModelAdmin):
    list_display = ('category', 'amount_limit', 'month', 'user')

@admin.register(UserProfile)
class UserProfileAdmin(ModelAdmin):
    list_display = ('user', 'is_verified', 'verification_code', 'reset_code')

@admin.register(UserDevice)
class UserDeviceAdmin(ModelAdmin):
    list_display = ('user', 'device_token', 'device_type', 'last_active')

@admin.register(MarketingCampaign)
class MarketingCampaignAdmin(ModelAdmin):
    list_display = ('title', 'subtitle', 'start_date', 'end_date', 'is_active', 'target_filter')
    list_filter = ('is_active', 'target_filter', 'start_date')

@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display = ('user', 'title', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')