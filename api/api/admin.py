from django.contrib import admin
from .models import MeterReading, SolarReading


@admin.register(MeterReading)
class MeterReadingAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "endpoint_id", "protocol", "consumption", "endpoint_type")
    list_filter = ("protocol", "endpoint_id")
    search_fields = ("endpoint_id",)
    ordering = ("-timestamp",)


@admin.register(SolarReading)
class SolarReadingAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "power_watts", "energy_wh", "period_minutes")
    ordering = ("-timestamp",)
