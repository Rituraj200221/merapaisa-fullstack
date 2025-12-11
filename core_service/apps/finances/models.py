from django.db import models

# Create your models here.
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from datetime import date

class Category(models.Model):
    """
    e.g. 'Food', 'Travel', 'Salary', 'Freelance'
    """
    TYPE_CHOICES = [
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
    ]
    name = models.CharField(max_length=50)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='EXPENSE')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')

    class Meta:
        unique_together = ('name', 'user', 'type') # Prevent duplicate names for same user

    def __str__(self):
        return f"{self.name} ({self.type})"

class Transaction(models.Model):
    """
    Actual money movement.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='transactions')
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(default=date.today)
    description = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} - ₹{self.amount} - {self.category.name if self.category else 'Uncategorized'}"

class Budget(models.Model):
    """
    Monthly limit for a category (e.g., Max ₹5000 for Food).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    amount_limit = models.DecimalField(max_digits=12, decimal_places=2)
    month = models.DateField(help_text="Pick any day of the month. Applies to the whole month.")

    def __str__(self):
        return f"{self.category.name}: Limit ₹{self.amount_limit}"