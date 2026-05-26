"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
""" from django.contrib import admin
from django.urls import path

urlpatterns = [
    path('admin/', admin.site.urls),
] """

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.api import (
    LoanViewSet, DebtViewSet, AssetViewSet, TransactionViewSet, EMIPaymentViewSet, CategoryViewSet,
    BudgetViewSet, NotificationViewSet, ActiveMarketingCampaignView, AIFinancialAuditView,
    RecycleBinViewSet, FinancialExportView, SchedulerTriggerView,
    CustomTokenObtainPairView, RegisterView, VerifyEmailView, ForgotPasswordView, ResetPasswordView
)
from rest_framework_simplejwt.views import TokenRefreshView

# Create the Router
router = DefaultRouter()
router.register(r'loans', LoanViewSet)
router.register(r'debts', DebtViewSet)
router.register(r'assets', AssetViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'emi-payments', EMIPaymentViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'budgets', BudgetViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'recycle-bin', RecycleBinViewSet, basename='recycle-bin')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)), # <--- Access via /api/loans/
    
    # Active Marketing Campaigns View
    path('api/marketing/active/', ActiveMarketingCampaignView.as_view(), name='active_marketing'),
    
    # AI Financial Advisor Audit Endpoint
    path('api/ai/audit/', AIFinancialAuditView.as_view(), name='ai_audit'),
    
    # Financial Statement Exporter Endpoint (PDF/CSV)
    path('api/export/<str:format_type>/', FinancialExportView.as_view(), name='financial_export'),
    
    # Background Scheduler Trigger Endpoint
    path('api/scheduler/trigger/', SchedulerTriggerView.as_view(), name='scheduler_trigger'),
    
    # Auth endpoints
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('api/auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('api/auth/reset-password/', ResetPasswordView.as_view(), name='reset_password'),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

