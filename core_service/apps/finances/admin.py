from django.contrib import admin

# Register your models here.
from .models import Category, Transaction, Budget

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'user')
    list_filter = ('type',)

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('date', 'category', 'amount', 'user')
    list_filter = ('date', 'category__type')

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('category', 'amount_limit', 'month', 'user')