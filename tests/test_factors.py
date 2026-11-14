import pytest

from pipeline.factors import Ratio, fit_ratio, leave_one_year_out


def test_ratio_of_sums_without_prior():
    r = fit_ratio([(80, 10), (120, 10), (100, 10)], window="2012-2017")
    assert r.k == pytest.approx(10.0)
    assert r.low <= r.k <= r.high
    assert (r.numerator, r.denominator, r.n_months, r.window) == (300, 30, 3, "2012-2017")


def test_bootstrap_is_deterministic():
    pairs = [(80, 10), (130, 10), (95, 12), (60, 9)]
    assert fit_ratio(pairs) == fit_ratio(pairs)


def test_small_sample_shrinks_toward_prior():
    r = fit_ratio([(20, 1)], prior=5.0, strength=200)
    assert r.k == pytest.approx((20 + 5.0 * 200) / (1 + 200))
    assert r.k < 6


def test_large_sample_dominates_prior():
    r = fit_ratio([(80_000, 10_000)], prior=2.0, strength=200)
    assert r.k == pytest.approx(7.9, abs=0.15)


def test_no_denominator_returns_prior_or_none():
    assert fit_ratio([(5, 0)]) is None
    r = fit_ratio([(5, 0)], prior=3.0)
    assert r.k == 3.0 and r.window == "prior"


BANDED_PRIOR = Ratio(k=8.0, low=6.0, high=10.0, numerator=0, denominator=0, n_months=0, window="2012-2017")


def test_prior_only_fit_carries_prior_band():
    r = fit_ratio([], prior=BANDED_PRIOR)
    assert (r.k, r.low, r.high, r.window) == (8.0, 6.0, 10.0, "prior")


def test_prior_band_widens_shrunk_ci():
    pairs = [(16, 2), (24, 3), (8, 1)]
    point = fit_ratio(pairs, prior=8.0)
    banded = fit_ratio(pairs, prior=BANDED_PRIOR)
    assert banded.k == pytest.approx(point.k)
    assert banded.low < point.low <= point.high < banded.high


def test_leave_one_year_out_perfect_proportional_data():
    pairs_by_year = {y: [(10 * m, m) for m in range(1, 13)] for y in (2012, 2013, 2014)}
    v = leave_one_year_out(pairs_by_year)
    assert v["mape_pct"] == pytest.approx(0.0)
    assert set(v["years"]) == {2012, 2013, 2014}


def test_leave_one_year_out_needs_two_years():
    assert leave_one_year_out({2012: [(10, 1)]}) is None


def test_ratio_is_frozen():
    r = Ratio(k=1, low=1, high=1, numerator=1, denominator=1, n_months=1, window="x")
    with pytest.raises(AttributeError):
        r.k = 2  # type: ignore[misc]

