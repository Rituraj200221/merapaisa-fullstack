from django.contrib import admin
from unfold.admin import ModelAdmin

# Register your models here.
from .models import Asset

@admin.register(Asset)
class AssetAdmin(ModelAdmin):
    list_display = ('symbol', 'name', 'asset_type', 'quantity', 'buy_price_avg', 'user')
    list_filter = ('asset_type',)