from django.contrib import admin
from unfold.admin import ModelAdmin

# Register your models here.
from .models import Loan, Debt, EMIPayment

@admin.register(Loan)
class LoanAdmin(ModelAdmin):
    list_display = ('name', 'loan_type', 'total_principal', 'emi_amount', 'user')

@admin.register(Debt)
class DebtAdmin(ModelAdmin):
    list_display = ('person_name', 'debt_type', 'amount', 'status', 'due_date', 'user')
    list_filter = ('debt_type', 'status')

@admin.register(EMIPayment)
class EMIPaymentAdmin(ModelAdmin):
    list_display = ('loan', 'due_date', 'amount_due', 'is_paid', 'payment_date')
    list_filter = ('is_paid', 'due_date', 'loan')    