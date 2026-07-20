from django.db import models


class MeterReading(models.Model):
    timestamp = models.DateTimeField(db_index=True)
    endpoint_id = models.PositiveIntegerField(db_index=True)
    protocol = models.CharField(max_length=16)
    endpoint_type = models.CharField(max_length=32, null=True, blank=True)
    consumption = models.PositiveBigIntegerField()
    tamper = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["endpoint_id", "timestamp"]),
        ]

    def __str__(self):
        return f"MeterReading({self.endpoint_id}, {self.timestamp}, {self.consumption})"


class SolarReading(models.Model):
    timestamp = models.DateTimeField(db_index=True)
    power_watts = models.FloatField()
    energy_wh = models.FloatField()
    period_minutes = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"SolarReading({self.timestamp}, {self.energy_wh}Wh)"
