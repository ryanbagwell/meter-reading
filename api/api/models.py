from django.db import models


class Endpoint(models.Model):
    id = models.PositiveIntegerField(primary_key=True)
    endpoint_type = models.CharField(max_length=32, null=True, blank=True)

    def __str__(self):
        return f"Endpoint({self.id})"


class MeterReading(models.Model):
    timestamp = models.DateTimeField(db_index=True)
    endpoint = models.ForeignKey(Endpoint, on_delete=models.PROTECT, related_name="readings")
    protocol = models.CharField(max_length=16)
    endpoint_type = models.CharField(max_length=32, null=True, blank=True)
    consumption = models.PositiveBigIntegerField()
    tamper = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["endpoint", "timestamp"], name="api_meterre_endpoin_2c0cac_idx"),
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
