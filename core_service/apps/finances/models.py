from django.db import models

# Create your models here.
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
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
    is_deleted = models.BooleanField(default=False)
    
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
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.category.name}: Limit ₹{self.amount_limit}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    is_verified = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    reset_code = models.CharField(max_length=6, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class UserDevice(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    device_token = models.CharField(max_length=255, unique=True)
    device_type = models.CharField(max_length=50, blank=True, null=True)
    last_active = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.device_token[:10]}"


# --- Signals to auto-create profiles ---
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if not hasattr(instance, 'profile'):
        UserProfile.objects.create(user=instance)
    instance.profile.save()


class MarketingCampaign(models.Model):
    TARGET_FILTER_CHOICES = [
        ('ALL', 'All Users'),
        ('NO_INVESTMENTS', 'No Investments'),
        ('DEBTORS', 'Debtors (Has Loans/Debts)'),
    ]
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=200, blank=True, null=True)
    content = models.TextField(help_text="Markdown or plain text description")
    image = models.ImageField(
        upload_to='campaigns/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'avif'])],
        help_text="Upload campaign banner image (JPG, JPEG, PNG, AVIF supported)"
    )
    cta_text = models.CharField(max_length=50, default='Explore')
    cta_link = models.CharField(max_length=255, default='/')
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    target_filter = models.CharField(max_length=20, choices=TARGET_FILTER_CHOICES, default='ALL')

    def __str__(self):
        return self.title


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('BUDGET_ALERT', 'Budget Alert'),
        ('INFO', 'Info'),
        ('SYSTEM', 'System'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='INFO')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Fields to track budget thresholds to avoid spamming
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    threshold = models.IntegerField(null=True, blank=True) # 80 or 100
    alert_month = models.DateField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.title} ({'Read' if self.is_read else 'Unread'})"


@receiver(post_save, sender=Transaction)
def check_budget_on_transaction(sender, instance, created, **kwargs):
    if not instance.category or instance.category.type != 'EXPENSE':
        return

    first_day_of_month = date(instance.date.year, instance.date.month, 1)

    # Check if a budget exists for this category/month
    budget = Budget.objects.filter(
        user=instance.user,
        category=instance.category,
        month__year=instance.date.year,
        month__month=instance.date.month
    ).first()

    if not budget:
        return

    # Calculate current category monthly totals
    total_spent = Transaction.objects.filter(
        user=instance.user,
        category=instance.category,
        date__year=instance.date.year,
        date__month=instance.date.month
    ).aggregate(total=models.Sum('amount'))['total'] or 0

    limit = budget.amount_limit
    if limit <= 0:
        return

    percentage = (total_spent / limit) * 100

    if percentage >= 100:
        # Trigger a 100% notification if not already sent
        exists = Notification.objects.filter(
            user=instance.user,
            category=instance.category,
            threshold=100,
            alert_month=first_day_of_month
        ).exists()
        if not exists:
            Notification.objects.create(
                user=instance.user,
                category=instance.category,
                threshold=100,
                alert_month=first_day_of_month,
                title=f"🚨 Budget Exceeded for {instance.category.name}",
                message=f"You have spent ₹{total_spent:,.2f} of your ₹{limit:,.2f} budget for {instance.category.name}.",
                notification_type='BUDGET_ALERT'
            )
    elif percentage >= 80:
        # Trigger an 80% notification if not already sent
        exists = Notification.objects.filter(
            user=instance.user,
            category=instance.category,
            threshold=80,
            alert_month=first_day_of_month
        ).exists()
        if not exists:
            Notification.objects.create(
                user=instance.user,
                category=instance.category,
                threshold=80,
                alert_month=first_day_of_month,
                title=f"⚠️ Budget Warning for {instance.category.name}",
                message=f"You have spent ₹{total_spent:,.2f} (80%+) of your ₹{limit:,.2f} budget for {instance.category.name}.",
                notification_type='BUDGET_ALERT'
            )