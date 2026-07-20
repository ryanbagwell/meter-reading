from datetime import datetime, timezone
from typing import Any, Optional

from django.conf import settings
from django.db.models import Max, Min, Sum
from ninja import NinjaAPI, Router
from ninja.renderers import JSONRenderer
from ninja.responses import NinjaJSONEncoder
from ninja.security import APIKeyHeader
from pydantic import BaseModel

from .models import MeterReading, SolarReading
from .schemas import (
    AggregateBucket,
    BucketSize,
    MeterReadingIn,
    MeterReadingOut,
    SolarReadingIn,
    SolarReadingOut,
)


class _CamelCaseEncoder(NinjaJSONEncoder):
    def default(self, o: Any) -> Any:
        if isinstance(o, BaseModel):
            return o.model_dump(by_alias=True)
        return super().default(o)


class _CamelCaseRenderer(JSONRenderer):
    encoder_class = _CamelCaseEncoder


class ConditionalApiKeyAuth(APIKeyHeader):
    param_name = "X-API-Key"

    def authenticate(self, request, key):
        if not getattr(settings, "METER_API_REQUIRE_AUTH", False):
            return "anonymous"
        expected = getattr(settings, "METER_API_KEY", "")
        if expected and key == expected:
            return key
        return None


auth = ConditionalApiKeyAuth()

api_instance = NinjaAPI(
    title="Meter Reader API",
    version="0.1.0",
    auth=auth,
    docs_url="/docs",
    openapi_url="/openapi.json",
    renderer=_CamelCaseRenderer(),
)

meter_router = Router(by_alias=True)
solar_router = Router(by_alias=True)


# ── Meter readings ─────────────────────────────────────────────────────────────


@meter_router.post("/readings/", response=MeterReadingOut)
def create_meter_reading(request, payload: MeterReadingIn):
    reading = MeterReading.objects.create(**payload.dict())
    return reading


@meter_router.get("/readings/", response=list[MeterReadingOut])
def list_meter_readings(
    request,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    meter_id: Optional[int] = None,
    protocol: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
):
    qs = MeterReading.objects.all()
    if start:
        qs = qs.filter(timestamp__gte=start)
    if end:
        qs = qs.filter(timestamp__lte=end)
    if meter_id is not None:
        qs = qs.filter(endpoint_id=meter_id)
    if protocol:
        qs = qs.filter(protocol=protocol)

    if limit:
        return list(qs[offset : offset + limit])
    
    return list(qs[offset:])
    


@meter_router.get("/endpoints/", response=list[int])
def list_meter_endpoints(request):
    return list(
        MeterReading.objects.values_list("endpoint_id", flat=True)
        .distinct()
        .order_by("endpoint_id")
    )


# ── Solar readings ─────────────────────────────────────────────────────────────


@solar_router.post("/readings/", response=SolarReadingOut)
def create_solar_reading(request, payload: SolarReadingIn):
    reading = SolarReading.objects.create(**payload.dict())
    return reading


@solar_router.get("/readings/", response=list[SolarReadingOut])
def list_solar_readings(
    request,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    limit: int = 100,
    offset: int = 0,
):
    qs = SolarReading.objects.all()
    if start:
        qs = qs.filter(timestamp__gte=start)
    if end:
        qs = qs.filter(timestamp__lte=end)
    return list(qs[offset : offset + limit])


# ── Aggregate ──────────────────────────────────────────────────────────────────


@api_instance.get("/aggregate/", response=list[AggregateBucket], by_alias=True)
def aggregate(
    request,
    start: datetime,
    end: datetime,
    bucket: BucketSize = "hour",
):
    from django.db.models.functions import TruncDay, TruncHour

    trunc_fn = TruncHour if bucket == "hour" else TruncDay

    meter_qs = (
        MeterReading.objects.filter(timestamp__gte=start, timestamp__lte=end)
        .annotate(bucket_start=trunc_fn("timestamp"))
        .values("bucket_start")
        .annotate(
            min_consumption=Min("consumption"),
            max_consumption=Max("consumption"),
        )
        .order_by("bucket_start")
    )

    solar_qs = (
        SolarReading.objects.filter(timestamp__gte=start, timestamp__lte=end)
        .annotate(bucket_start=trunc_fn("timestamp"))
        .values("bucket_start")
        .annotate(total_energy_wh=Sum("energy_wh"))
        .order_by("bucket_start")
    )

    meter_by_bucket = {row["bucket_start"]: row for row in meter_qs}
    solar_by_bucket = {row["bucket_start"]: row["total_energy_wh"] for row in solar_qs}

    all_buckets = sorted(set(meter_by_bucket) | set(solar_by_bucket))

    results = []
    for bucket_start in all_buckets:
        meter_row = meter_by_bucket.get(bucket_start)
        solar_wh = solar_by_bucket.get(bucket_start)

        meter_delta = None
        if meter_row is not None:
            meter_delta = meter_row["max_consumption"] - meter_row["min_consumption"]

        net_import_wh = None
        if meter_delta is not None and solar_wh is not None:
            # Positive = imported from grid; negative = exported to grid
            net_import_wh = (meter_delta * 1000) - solar_wh

        results.append(
            AggregateBucket(
                bucket_start=bucket_start,
                meter_consumption_delta=meter_delta,
                solar_energy_wh=solar_wh,
                net_import_wh=net_import_wh,
            )
        )

    return results


api_instance.add_router("/meter", meter_router)
api_instance.add_router("/solar", solar_router)
