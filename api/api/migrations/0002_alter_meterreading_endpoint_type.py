from django.db import migrations, models


def backfill_endpoint_type(apps, schema_editor):
    MeterReading = apps.get_model("api", "MeterReading")
    for r in MeterReading.objects.filter(endpoint_type__isnull=True):
        r.endpoint_type = r.protocol
        r.save(update_fields=["endpoint_type"])


class Migration(migrations.Migration):
    dependencies = [("api", "0001_initial")]

    operations = [
        migrations.AlterField(
            model_name="meterreading",
            name="endpoint_type",
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.RunPython(backfill_endpoint_type, migrations.RunPython.noop),
    ]
