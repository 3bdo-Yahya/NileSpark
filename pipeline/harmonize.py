"""MODIS/VIIRS harmonization — pure functions, no I/O.

Unit: S-NPP-equivalent fire cell-days on a 1 km equal-area grid. Each day uses the
best sensor available: S-NPP as-is, else NOAA-20 x k_n20, else MODIS (Terra+Aqua)
x k_modis, else Terra-only x k_terra.
"""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Callable, Iterator, Mapping
from dataclasses import dataclass, field
from datetime import date, timedelta
from statistics import median

from pipeline.factors import Ratio, fit_ratio, leave_one_year_out

METHOD_VERSION = "v2"
UNIT = "S-NPP-equivalent fire cell-days (1 km equal-area grid)"
ANOMALY_BASIS = "median of the same calendar month in all other years of the record"

SOURCES = ("snpp", "n20", "modis", "terra")
SOURCE_SENSOR = {"snpp": "viirs-snpp", "n20": "viirs-jpss1", "modis": "modis", "terra": "modis"}
SOURCE_LABEL = {"snpp": "viirs-snpp", "n20": "viirs-jpss1", "modis": "modis", "terra": "modis-terra"}
SOURCE_START = {
    "terra": date(2000, 11, 1),
    "modis": date(2002, 7, 4),
    "snpp": date(2012, 1, 20),
    "n20": date(2018, 4, 1),
}
DAY_PRIORITY = ("snpp", "n20", "modis", "terra")

EARLY_WINDOW = (2012, 2017)
EARLY_LABEL = f"{EARLY_WINDOW[0]}-{EARLY_WINDOW[1]}"
ALL_LABEL = "all-overlap"
MIN_CALIBRATION_DENOMINATOR = 100
MIN_BASELINE_YEARS = 3

# VIIRS-vs-VIIRS daily ratios sit near 1; VIIRS-vs-MODIS ratios swing several-fold day to day,
# so against MODIS only a near-total collapse counts as an outage.
OUTAGE_THRESHOLD = {"viirs": 0.4, "modis": 0.1}
OUTAGE_MIN_EXPECTED = 100
# Fire activity is seasonal, so a MODIS day is judged against the +-30 days around it
# (wide enough that an 18-day gap cannot drag the local median down).
DEAD_DAY_WINDOW = 30
DEAD_DAY_FRACTION = 0.05
VIIRS_SENSORS = ("viirs-snpp", "viirs-jpss1")

PriorFn = Callable[[str, str], "Ratio | float | None"]


@dataclass(frozen=True)
class DayCounts:
    snpp: int = 0
    n20: int = 0
    modis: int = 0
    terra: int = 0

    def get(self, source: str) -> int:
        return getattr(self, source)


EMPTY_DAY = DayCounts()


@dataclass(frozen=True)
class Coverage:
    sensor_years: frozenset[tuple[str, int]]
    last_day: date
    outage_days: frozenset[tuple[str, date]] = frozenset()

    def available(self, source: str, day: date) -> bool:
        sensor = SOURCE_SENSOR[source]
        return (
            SOURCE_START[source] <= day <= self.last_day
            and (sensor, day.year) in self.sensor_years
            and (sensor, day) not in self.outage_days
        )

    def first_day(self) -> date | None:
        starts = [
            max(SOURCE_START[s], date(y, 1, 1))
            for s in SOURCES
            for (sensor, y) in self.sensor_years
            if sensor == SOURCE_SENSOR[s] and max(SOURCE_START[s], date(y, 1, 1)).year == y
        ]
        return min(starts) if starts else None


@dataclass(frozen=True)
class Factors:
    modis: Ratio | None
    terra: Ratio | None
    n20: Ratio | None

    def for_source(self, source: str) -> Ratio | None:
        return None if source == "snpp" else getattr(self, source)

    def as_dict(self) -> dict:
        return {s: (r.as_dict() if r else None) for s, r in (("modis", self.modis), ("terra", self.terra), ("n20", self.n20))}


@dataclass(frozen=True)
class MonthValue:
    year: int
    month: int
    value: float | None
    low: float | None
    high: float | None
    source: str | None
    raw: dict[str, int] = field(default_factory=dict)
    days_by_source: dict[str, int] = field(default_factory=dict)


def _days(start: date, end: date) -> Iterator[date]:
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)


def calibration_pairs(
    daily: Mapping[date, DayCounts],
    coverage: Coverage,
    numerator: str,
    denominator: str,
    years: tuple[int, int] | None = None,
) -> dict[int, list[tuple[int, int]]]:
    """Monthly (numerator, denominator) sums over days where both sources are usable, keyed by year."""
    sums: dict[tuple[int, int], list[int]] = defaultdict(lambda: [0, 0])
    start = max(SOURCE_START[numerator], SOURCE_START[denominator])
    first = coverage.first_day()
    if first is None:
        return {}
    for d in _days(max(start, first), coverage.last_day):
        if years and not (years[0] <= d.year <= years[1]):
            continue
        if not (coverage.available(numerator, d) and coverage.available(denominator, d)):
            continue
        c = daily.get(d, EMPTY_DAY)
        cell = sums[(d.year, d.month)]
        cell[0] += c.get(numerator)
        cell[1] += c.get(denominator)
    by_year: dict[int, list[tuple[int, int]]] = defaultdict(list)
    for (y, _m), (n, k) in sorted(sums.items()):
        by_year[y].append((n, k))
    return dict(by_year)


def _flatten(by_year: Mapping[int, list[tuple[int, int]]]) -> list[tuple[int, int]]:
    return [p for y in sorted(by_year) for p in by_year[y]]


def _fit_modis_like(daily, coverage, source: str, prior: PriorFn) -> Ratio | None:
    """MODIS x k is only applied to pre-2018 days, so fit on 2012-2017 (before orbit drift)
    whenever there is enough local early data or an early prior to shrink toward."""
    early = _flatten(calibration_pairs(daily, coverage, "snpp", source, EARLY_WINDOW))
    early_prior = prior(source, EARLY_LABEL)
    if early_prior is not None or sum(p[1] for p in early) >= MIN_CALIBRATION_DENOMINATOR:
        return fit_ratio(early, prior=early_prior, window=EARLY_LABEL)
    overlap = calibration_pairs(daily, coverage, "snpp", source)
    return fit_ratio(_flatten(overlap), prior=prior(source, ALL_LABEL), window=ALL_LABEL)


def fit_factors(daily: Mapping[date, DayCounts], coverage: Coverage, prior: PriorFn) -> Factors:
    n20_pairs = _flatten(calibration_pairs(daily, coverage, "snpp", "n20"))
    return Factors(
        modis=_fit_modis_like(daily, coverage, "modis", prior),
        terra=_fit_modis_like(daily, coverage, "terra", prior),
        n20=fit_ratio(n20_pairs, prior=prior("n20", ALL_LABEL), window=ALL_LABEL),
    )


def per_year_ratio(
    daily: Mapping[date, DayCounts], coverage: Coverage, denominator: str = "modis"
) -> dict[int, float]:
    out = {}
    for year, pairs in calibration_pairs(daily, coverage, "snpp", denominator).items():
        den = sum(p[1] for p in pairs)
        if den > 0:
            out[year] = round(sum(p[0] for p in pairs) / den, 3)
    return out


def validate_modis_factor(daily: Mapping[date, DayCounts], coverage: Coverage) -> dict | None:
    return leave_one_year_out(calibration_pairs(daily, coverage, "snpp", "modis", EARLY_WINDOW))


def _day_value(c: DayCounts, d: date, coverage: Coverage, factors: Factors):
    for source in DAY_PRIORITY:
        if not coverage.available(source, d):
            continue
        raw = c.get(source)
        if source == "snpp":
            return source, float(raw), float(raw), float(raw)
        r = factors.for_source(source)
        if r is None:
            continue
        return source, raw * r.k, raw * r.low, raw * r.high
    return None


def _month_ends(first: date, last: date) -> Iterator[tuple[int, int, date, date]]:
    y, m = first.year, first.month
    while (y, m) <= (last.year, last.month):
        start = date(y, m, 1)
        nxt = date(y + (m == 12), m % 12 + 1, 1)
        yield y, m, start, nxt - timedelta(days=1)
        y, m = nxt.year, nxt.month


def harmonize_days(daily: Mapping[date, DayCounts], coverage: Coverage, factors: Factors) -> list[MonthValue]:
    first = coverage.first_day()
    if first is None:
        return []
    months = []
    for y, m, start, end in _month_ends(first, coverage.last_day):
        total = low = high = 0.0
        complete = start >= first and end <= coverage.last_day
        raw = dict.fromkeys(SOURCES, 0)
        used: dict[str, int] = defaultdict(int)
        for d in _days(start, min(end, coverage.last_day)):
            c = daily.get(d, EMPTY_DAY)
            for s in SOURCES:
                raw[s] += c.get(s)
            picked = _day_value(c, d, coverage, factors)
            if picked is None:
                complete = False
                continue
            source, v, lo, hi = picked
            used[SOURCE_LABEL[source]] += 1
            total, low, high = total + v, low + lo, high + hi
        dominant = max(used, key=used.get) if used else None
        months.append(
            MonthValue(
                year=y,
                month=m,
                value=total if complete else None,
                low=low if complete else None,
                high=high if complete else None,
                source=dominant,
                raw=raw,
                days_by_source=dict(used),
            )
        )
    return months


def month_anomaly(value: float, historical_same_month: list[float]) -> tuple[float, float | None]:
    """(anomaly, anomaly_pct) of `value` against the median of `historical_same_month`.

    anomaly_pct is None when the median is 0 (any fire would be an infinite % change)."""
    if not historical_same_month:
        return 0.0, 0.0
    base = float(median(historical_same_month))
    anomaly = value - base
    return anomaly, (None if base == 0 else anomaly / base * 100.0)


def with_baseline(months: list[MonthValue]) -> list[dict]:
    by_month: dict[int, list[tuple[int, float]]] = defaultdict(list)
    for mv in months:
        if mv.value is not None:
            by_month[mv.month].append((mv.year, mv.value))
    rows = []
    for mv in months:
        others = [(y, v) for y, v in by_month[mv.month] if y != mv.year]
        base = med = anomaly = pct = None
        if mv.value is not None and len(others) >= MIN_BASELINE_YEARS:
            base = sorted(y for y, _ in others)
            med = float(median(v for _, v in others))
            a, p = month_anomaly(mv.value, [v for _, v in others])
            anomaly, pct = round(a, 2), (None if p is None else round(p, 2))
        rows.append(
            {
                "year": mv.year,
                "month": mv.month,
                "value": mv.value,
                "low": mv.low,
                "high": mv.high,
                "source": mv.source,
                "raw": mv.raw,
                "days_by_source": mv.days_by_source,
                "median": med,
                "anomaly": anomaly,
                "anomaly_pct": pct,
                "baseline_years": base or [],
            }
        )
    return rows


def detect_outages(
    counts: Mapping[tuple[str, str, date], int],
    sensor_years: Mapping[str, frozenset[tuple[str, int]]],
) -> frozenset[tuple[str, date]]:
    """Flag VIIRS sensor-days whose detections collapse versus a companion sensor,
    and MODIS days with (almost) no detections anywhere.

    Companion is the other VIIRS satellite when both cover the same countries that
    year, else MODIS. Expected = companion x that year's median daily ratio.
    MODIS has no companion before VIIRS, so a MODIS day is dead when the pooled count
    falls below 5% of the median of the surrounding days (e.g. Terra safe mode, June 2001).
    """
    if not counts:
        return frozenset()
    last = max(d for _, _, d in counts)
    by_year: dict[int, set[str]] = defaultdict(set)
    for country, sy in sensor_years.items():
        for sensor, year in sy:
            by_year[year].add(country)
    counts_by_year: dict[int, list[tuple[str, str, date, int]]] = defaultdict(list)
    for (s, c, d), n in counts.items():
        counts_by_year[d.year].append((s, c, d, n))
    flagged = set()
    for year, countries in by_year.items():
        with_modis = {c for c in countries if ("modis", year) in sensor_years[c]}
        flagged |= _dead_days(counts_by_year[year], "modis", with_modis, year, last)
        for sensor in VIIRS_SENSORS:
            for companion in (s for s in VIIRS_SENSORS + ("modis",) if s != sensor):
                shared = {c for c in countries if {(sensor, year), (companion, year)} <= sensor_years[c]}
                if not shared:
                    continue
                flagged |= _collapsed_days(counts_by_year[year], sensor, companion, shared)
                break
    return frozenset(flagged)


def _sensor_start(sensor: str) -> date:
    return min(SOURCE_START[s] for s, name in SOURCE_SENSOR.items() if name == sensor)


def _dead_days(rows, sensor: str, countries: set[str], year: int, last: date) -> set[tuple[str, date]]:
    if not countries:
        return set()
    totals: dict[date, int] = defaultdict(int)
    for s, c, d, n in rows:
        if s == sensor and c in countries:
            totals[d] += n
    span = list(_days(max(date(year, 1, 1), _sensor_start(sensor)), min(date(year, 12, 31), last)))
    values = [totals.get(d, 0) for d in span]
    dead = set()
    for i, d in enumerate(span):
        around = values[max(0, i - DEAD_DAY_WINDOW) : i] + values[i + 1 : i + 1 + DEAD_DAY_WINDOW]
        local = median(around) if around else 0
        if local >= OUTAGE_MIN_EXPECTED and values[i] < DEAD_DAY_FRACTION * local:
            dead.add((sensor, d))
    return dead


def _collapsed_days(rows, sensor: str, companion: str, countries: set[str]) -> set[tuple[str, date]]:
    mine: dict[date, int] = defaultdict(int)
    theirs: dict[date, int] = defaultdict(int)
    for s, c, d, n in rows:
        if c not in countries:
            continue
        if s == sensor:
            mine[d] += n
        elif s == companion:
            theirs[d] += n
    ratios = [mine[d] / theirs[d] for d in theirs if mine.get(d, 0) > 0 and theirs[d] > 0]
    if not ratios:
        return set()
    typical = median(ratios)
    threshold = OUTAGE_THRESHOLD["modis" if companion == "modis" else "viirs"]
    start = _sensor_start(sensor)
    return {
        (sensor, d)
        for d, n in theirs.items()
        if d >= start and n * typical >= OUTAGE_MIN_EXPECTED and mine.get(d, 0) < threshold * n * typical
    }














