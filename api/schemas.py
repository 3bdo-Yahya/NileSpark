"""Pydantic request/response models — keep in sync with docs/API_CONTRACT.md."""

from __future__ import annotations

from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


class Envelope(BaseModel):
    success: bool
    data: Any | None = None
    error: str | None = None
    meta: dict[str, Any] = Field(default_factory=dict)


class BBoxAoi(BaseModel):
    bbox: list[float] = Field(
        ...,
        min_length=4,
        max_length=4,
        description="[minLon, minLat, maxLon, maxLat]",
    )

    @model_validator(mode="after")
    def validate_bbox(self) -> BBoxAoi:
        min_lon, min_lat, max_lon, max_lat = self.bbox
        if min_lon >= max_lon or min_lat >= max_lat:
            raise ValueError("bbox requires min < max for lon and lat")
        if not (-180 <= min_lon <= 180 and -180 <= max_lon <= 180):
            raise ValueError("longitude out of range")
        if not (-90 <= min_lat <= 90 and -90 <= max_lat <= 90):
            raise ValueError("latitude out of range")
        return self


class PolygonAoi(BaseModel):
    polygon: dict[str, Any] = Field(..., description="GeoJSON Polygon")


class CalendarRequest(BaseModel):
    aoi: BBoxAoi | PolygonAoi
    start: date
    end: date
    include_static: bool = False

    @model_validator(mode="after")
    def validate_range(self) -> CalendarRequest:
        if self.start > self.end:
            raise ValueError("start must be on or before end")
        return self


class MonthStat(BaseModel):
    year: int
    month: int
    value: float
    raw_by_sensor: dict[str, float] = Field(default_factory=dict)
    median: float | None = None
    anomaly: float | None = None
    anomaly_pct: float | None = None


class YearStat(BaseModel):
    year: int
    value: float


class CalendarData(BaseModel):
    months: list[MonthStat]
    years: list[YearStat]


SensorName = Literal["modis", "viirs-snpp", "viirs-jpss1", "viirs"]
