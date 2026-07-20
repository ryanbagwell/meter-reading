from datetime import datetime
from typing import Literal

from ninja import Schema
from pydantic import ConfigDict
from pydantic.alias_generators import to_camel


class _CamelSchema(Schema):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class MeterReadingIn(_CamelSchema):
    timestamp: datetime
    endpoint_id: int
    protocol: str
    endpoint_type: str | None = None
    consumption: int
    tamper: int | None = None


class MeterReadingOut(_CamelSchema):
    id: int
    timestamp: datetime
    endpoint_id: int
    protocol: str
    endpoint_type: str | None
    consumption: int
    tamper: int | None


class SolarReadingIn(_CamelSchema):
    timestamp: datetime
    power_watts: float
    energy_wh: float
    period_minutes: int


class SolarReadingOut(_CamelSchema):
    id: int
    timestamp: datetime
    power_watts: float
    energy_wh: float
    period_minutes: int


class AggregateBucket(_CamelSchema):
    bucket_start: datetime
    meter_consumption_delta: int | None
    solar_energy_wh: float | None
    net_import_wh: float | None


BucketSize = Literal["hour", "day"]
