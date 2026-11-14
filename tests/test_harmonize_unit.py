"""Harmonization: coverage, per-day sensor choice, monthly series, baseline."""

from datetime import date, timedelta

import pytest

from pipeline.factors import Ratio
from pipeline.harmonize import (
    Coverage,
    DayCounts,
    Factors,
    detect_outages,
    fit_factors,
    harmonize_days,
    month_anomaly,
    per_year_ratio,
    with_baseline,
)


def ratio(k: float) -> Ratio:
    return Ratio(k=k, low=k * 0.9, high=k * 1.1, numerator=0, denominator=0, n_months=0, window="t")


FACTORS = Factors(modis=ratio(8.0), terra=ratio(14.0), n20=ratio(1.0))


def days(start: date, end: date):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)


def coverage(years_by_sensor: dict[str, range], last: date, outages=frozenset()) -> Coverage:
    sy = frozenset((s, y) for s, ys in years_by_sensor.items() for y in ys)
    return Coverage(sensor_years=sy, last_day=last, outage_days=outages)


def test_availability_respects_mission_start_and_coverage():
    cov = coverage({"modis": range(2000, 2026), "viirs-snpp": range(2012, 2026)}, date(2025, 12, 31))
    assert not cov.available("terra", date(2000, 10, 31))
    assert cov.available("terra", date(2000, 11, 1))
    assert not cov.available("modis", date(2002, 7, 1))
    assert cov.available("modis", date(2002, 8, 1))
    assert not cov.available("snpp", date(2012, 1, 19))
    assert cov.available("snpp", date(2012, 1, 20))
    assert not cov.available("n20", date(2020, 1, 1))
    assert not cov.available("snpp", date(2026, 1, 1))


def test_outage_day_is_unavailable():
    out = frozenset({("viirs-snpp", date(2025, 7, 5))})
    cov = coverage({"viirs-snpp": range(2025, 2026)}, date(2025, 12, 31), out)
    assert not cov.available("snpp", date(2025, 7, 5))
    assert cov.available("snpp", date(2025, 7, 6))


def test_zero_fire_month_with_viirs_is_zero_not_modis_fallback():
    cov = coverage({"modis": range(2025, 2026), "viirs-snpp": range(2025, 2026)}, date(2025, 1, 31))
    daily = {date(2025, 1, 3): DayCounts(modis=5)}
    [m] = harmonize_days(daily, cov, FACTORS)
    assert m.value == 0
    assert m.source == "viirs-snpp"
    assert m.raw["modis"] == 5


def test_pre_viirs_month_uses_modis_times_k_with_band():
    cov = coverage({"modis": range(2005, 2006)}, date(2005, 1, 31))
    daily = {date(2005, 1, 2): DayCounts(modis=3, terra=2), date(2005, 1, 9): DayCounts(modis=2, terra=1)}
    [m] = harmonize_days(daily, cov, FACTORS)
    assert m.value == pytest.approx(5 * 8.0)
    assert (m.low, m.high) == pytest.approx((5 * 7.2, 5 * 8.8))
    assert m.source == "modis"


def test_terra_only_era_uses_terra_factor():
    cov = coverage({"modis": range(2001, 2002)}, date(2001, 3, 31))
    daily = {date(2001, 3, 5): DayCounts(modis=4, terra=4)}
    months = harmonize_days(daily, cov, FACTORS)
    march = next(m for m in months if m.month == 3)
    assert march.value == pytest.approx(4 * 14.0)
    assert march.source == "modis-terra"


def test_snpp_outage_day_filled_by_noaa20():
    out = frozenset({("viirs-snpp", date(2025, 7, 5))})
    cov = coverage({"viirs-snpp": range(2025, 2026), "viirs-jpss1": range(2025, 2026)}, date(2025, 7, 31), out)
    f = Factors(modis=ratio(8.0), terra=ratio(14.0), n20=ratio(0.9))
    daily = {date(2025, 7, 5): DayCounts(snpp=1, n20=100), date(2025, 7, 6): DayCounts(snpp=50, n20=60)}
    july = harmonize_days(daily, cov, f)[-1]
    assert july.value == pytest.approx(100 * 0.9 + 50)
    assert july.days_by_source == {"viirs-snpp": 30, "viirs-jpss1": 1}


def test_month_with_uncovered_days_is_unavailable():
    cov = coverage({"viirs-snpp": range(2025, 2026)}, date(2025, 1, 15))
    [m] = harmonize_days({}, cov, FACTORS)
    assert m.value is None


def test_fit_factors_prefers_early_window_and_falls_back_to_all_overlap():
    cov = coverage({"modis": range(2012, 2026), "viirs-snpp": range(2012, 2026)}, date(2025, 12, 31))
    daily = {}
    for d in days(date(2012, 2, 1), date(2017, 12, 31)):
        if d.day == 1:
            daily[d] = DayCounts(snpp=80, modis=10, terra=6)
    for d in days(date(2018, 1, 1), date(2025, 12, 31)):
        if d.day == 1:
            daily[d] = DayCounts(snpp=40, modis=10, terra=6)
    f = fit_factors(daily, cov, prior=lambda source, window: None)
    assert f.modis.window == "2012-2017"
    assert f.modis.k == pytest.approx(8.0)

    late_only = {d: c for d, c in daily.items() if d.year == 2025}
    cov25 = coverage({"modis": range(2025, 2026), "viirs-snpp": range(2025, 2026)}, date(2025, 12, 31))
    f25 = fit_factors(late_only, cov25, prior=lambda source, window: None)
    assert f25.modis.window == "all-overlap"
    assert f25.modis.k == pytest.approx(4.0)


def test_early_prior_beats_drift_era_overlap():
    late_only = {d: DayCounts(snpp=40, modis=10, terra=6) for d in days(date(2025, 1, 1), date(2025, 12, 31))}
    cov25 = coverage({"modis": range(2025, 2026), "viirs-snpp": range(2025, 2026)}, date(2025, 12, 31))
    early_prior = ratio(8.0)
    f = fit_factors(late_only, cov25, prior=lambda source, window: early_prior if window == "2012-2017" else None)
    assert f.modis.window == "prior"
    assert (f.modis.k, f.modis.low, f.modis.high) == (early_prior.k, early_prior.low, early_prior.high)


def test_per_year_ratio():
    cov = coverage({"modis": range(2012, 2014), "viirs-snpp": range(2012, 2014)}, date(2013, 12, 31))
    daily = {date(2012, 3, 1): DayCounts(snpp=90, modis=10), date(2013, 3, 1): DayCounts(snpp=50, modis=10)}
    assert per_year_ratio(daily, cov) == {2012: 9.0, 2013: 5.0}


def test_detect_outages_flags_collapsed_sensor_day():
    counts = {}
    for d in days(date(2025, 7, 1), date(2025, 7, 10)):
        counts[("viirs-jpss1", "A", d)] = 1000
        counts[("viirs-snpp", "A", d)] = 30 if d == date(2025, 7, 5) else 1000
    sy = {"A": frozenset({("viirs-snpp", 2025), ("viirs-jpss1", 2025)})}
    assert detect_outages(counts, sy) == frozenset({("viirs-snpp", date(2025, 7, 5))})


def test_detect_outages_vs_modis_ignores_low_ratio_days():
    counts = {}
    for d in days(date(2014, 10, 1), date(2014, 10, 20)):
        counts[("modis", "A", d)] = 100
        counts[("viirs-snpp", "A", d)] = 800
    counts[("viirs-snpp", "A", date(2014, 10, 5))] = 200
    counts[("viirs-snpp", "A", date(2014, 10, 9))] = 20
    sy = {"A": frozenset({("viirs-snpp", 2014), ("modis", 2014)})}
    assert detect_outages(counts, sy) == frozenset({("viirs-snpp", date(2014, 10, 9))})


def test_detect_outages_flags_dead_modis_days():
    gap = set(days(date(2001, 6, 16), date(2001, 7, 3)))
    counts = {("modis", "A", d): 150 if d.month <= 2 else 2000 for d in days(date(2001, 1, 1), date(2001, 7, 10)) if d not in gap}
    counts[("modis", "A", date(2001, 6, 5))] = 300
    sy = {"A": frozenset({("modis", 2001)})}
    assert detect_outages(counts, sy) == frozenset(("modis", d) for d in gap)


def test_detect_outages_ignores_days_before_mission_start():
    counts = {("modis", "A", d): 100 for d in days(date(2012, 1, 1), date(2012, 1, 31))}
    counts |= {("viirs-snpp", "A", d): 800 for d in days(date(2012, 1, 20), date(2012, 1, 31))}
    sy = {"A": frozenset({("viirs-snpp", 2012), ("modis", 2012)})}
    assert detect_outages(counts, sy) == frozenset()


def test_baseline_median_of_other_years_same_month():
    from pipeline.harmonize import MonthValue

    def mv(y, v):
        return MonthValue(year=y, month=3, value=v, low=v, high=v, source="viirs-snpp", raw={}, days_by_source={})

    rows = with_baseline([mv(2012, 60.0), mv(2013, 90.0), mv(2014, 100.0), mv(2015, 120.0)])
    last = rows[-1]
    assert last["median"] == 90.0
    assert last["anomaly"] == 30.0
    assert last["anomaly_pct"] == pytest.approx(33.33, abs=0.01)
    assert last["baseline_years"] == [2012, 2013, 2014]


def test_baseline_needs_three_years():
    from pipeline.harmonize import MonthValue

    rows = with_baseline(
        [MonthValue(year=y, month=1, value=1.0, low=1, high=1, source="x", raw={}, days_by_source={}) for y in (2024, 2025)]
    )
    assert rows[-1]["median"] is None


def test_month_anomaly_vs_median():
    anomaly, pct = month_anomaly(120, [60, 90, 100])
    assert anomaly == 30.0
    assert pct == pytest.approx(33.3333, abs=0.01)


def test_month_anomaly_pct_undefined_on_zero_median():
    assert month_anomaly(12, [0, 0, 5]) == (12.0, None)







