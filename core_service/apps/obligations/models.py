from django.db import models

# Create your models here.
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from datetime import date

class Loan(models.Model):
    """
    Tracks Bank Loans and EMIs (e.g., Home Loan, Car Loan).
    """
    LOAN_TYPES = [
        ('HOME', 'Home Loan'),
        ('CAR', 'Car Loan'),
        ('PERSONAL', 'Personal Loan'),
        ('EDUCATION', 'Education Loan'),
        ('OTHER', 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='loans')
    name = models.CharField(max_length=100, help_text="e.g. HDFC Home Loan")
    loan_type = models.CharField(max_length=20, choices=LOAN_TYPES, default='PERSONAL')
    
    # Financials
    total_principal = models.DecimalField(max_digits=12, decimal_places=2, help_text="Total amount borrowed")
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text="Annual Interest Rate in %")
    start_date = models.DateField()
    tenure_months = models.PositiveIntegerField(help_text="Total duration in months")
    
    # Auto-calculated or Manual EMI
    emi_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Monthly EMI cost")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - ₹{self.total_principal}"

    def clean(self):
        if self.total_principal < 0:
            raise ValidationError("Loan amount cannot be negative.")


class Debt(models.Model):
    """
    Tracks informal borrowing and lending (The 'Khata' Book).
    Tracks: Who owes me? (Asset) vs Who do I owe? (Liability)
    """
    DEBT_TYPE = [
        ('GIVEN', 'I gave money (Asset)'),
        ('TAKEN', 'I borrowed money (Liability)'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PARTIAL', 'Partially Paid'),
        ('SETTLED', 'Settled / Paid'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debts')
    person_name = models.CharField(max_length=100, help_text="Name of the person involved")
    debt_type = models.CharField(max_length=10, choices=DEBT_TYPE)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, null=True, help_text="Reason for lending/borrowing")
    
    # Dates
    transaction_date = models.DateField(default=date.today)
    due_date = models.DateField(blank=True, null=True, help_text="When is it expected back?")
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')

    def __str__(self):
        direction = "to" if self.debt_type == 'GIVEN' else "from"
        return f"₹{self.amount} {direction} {self.person_name} ({self.status})"
    

class EMIPayment(models.Model):
    """
    Tracks individual monthly payments for a Loan.
    """
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='emi_payments')
    due_date = models.DateField(help_text="When is this EMI due?")
    amount_due = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment Status
    is_paid = models.BooleanField(default=False)
    payment_date = models.DateField(null=True, blank=True, help_text="Date actual payment was made")
    remarks = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        status = "PAID" if self.is_paid else "PENDING"
        return f"{self.loan.name} - {self.due_date} ({status})"    