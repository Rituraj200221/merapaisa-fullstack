from django.db import models

# Create your models here.
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

class Asset(models.Model):
    """
    Represents a Stock or Mutual Fund holding.
    """
    ASSET_TYPES = [
        ('STOCK', 'Stock / Share'),
        ('MF', 'Mutual Fund'),
        ('GOLD', 'Digital Gold / SGB'),
        ('CRYPTO', 'Cryptocurrency'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assets')
    name = models.CharField(max_length=100, help_text="e.g. Tata Motors")
    symbol = models.CharField(max_length=50, help_text="e.g. TATAMOTORS.NS or 112093 (MF Code)")
    asset_type = models.CharField(max_length=10, choices=ASSET_TYPES, default='STOCK')
    
    # Purchase Details
    quantity = models.DecimalField(max_digits=10, decimal_places=4, help_text="Number of units/shares")
    buy_price_avg = models.DecimalField(max_digits=12, decimal_places=2, help_text="Average buying price per unit")
    
    # Live Value (Updated by our FastAPI later)
    current_market_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.symbol} ({self.quantity} units)"

    @property
    def total_invested_value(self):
        return self.quantity * self.buy_price_avg

    @property
    def current_value(self):
        if self.current_market_price:
            return self.quantity * self.current_market_price
        return 0