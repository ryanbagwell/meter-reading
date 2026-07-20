import django.db.models.deletion
from django.db import migrations, models


def populate_endpoints(apps, schema_editor):
    MeterReading = apps.get_model("api", "MeterReading")
    Endpoint = apps.get_model("api", "Endpoint")

    latest_type_by_endpoint = {}
    for endpoint_id, endpoint_type in (
        MeterReading.objects.order_by("endpoint_id", "-timestamp").values_list(
            "endpoint_id", "endpoint_type"
        )
    ):
        latest_type_by_endpoint.setdefault(endpoint_id, endpoint_type)

    Endpoint.objects.bulk_create(
        Endpoint(id=endpoint_id, endpoint_type=endpoint_type)
        for endpoint_id, endpoint_type in latest_type_by_endpoint.items()
    )


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_alter_meterreading_endpoint_type"),
    ]

    operations = [
        migrations.CreateModel(
            name="Endpoint",
            fields=[
                ("id", models.PositiveIntegerField(primary_key=True, serialize=False)),
                ("endpoint_type", models.CharField(blank=True, max_length=32, null=True)),
            ],
        ),
        migrations.RunPython(populate_endpoints, migrations.RunPython.noop),
        migrations.RemoveIndex(
            model_name="meterreading",
            name="api_meterre_endpoin_2c0cac_idx",
        ),
        migrations.AlterField(
            model_name="meterreading",
            name="endpoint_id",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="readings",
                to="api.endpoint",
            ),
        ),
        migrations.RenameField(
            model_name="meterreading",
            old_name="endpoint_id",
            new_name="endpoint",
        ),
        migrations.AddIndex(
            model_name="meterreading",
            index=models.Index(fields=["endpoint", "timestamp"], name="api_meterre_endpoin_2c0cac_idx"),
        ),
    ]
