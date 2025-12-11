from django.contrib import admin

# Register your models here.
from .models import Loan, Debt, EMIPayment

@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ('name', 'loan_type', 'total_principal', 'emi_amount', 'user')

@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = ('person_name', 'debt_type', 'amount', 'status', 'due_date', 'user')
    list_filter = ('debt_type', 'status')

@admin.register(EMIPayment)
class EMIPaymentAdmin(admin.ModelAdmin):
    list_display = ('loan', 'due_date', 'amount_due', 'is_paid', 'payment_date')
    list_filter = ('is_paid', 'due_date', 'loan')    