"""Sensor conversion factors: ratio of sums, month-block bootstrap CI, shrinkage, validation."""

from __future__ import annotations

import random
from collections.abc import Mapping, Sequence
from dataclasses import dataclass

PRIOR_STRENGTH = 50.0
BOOTSTRAP_SAMPLES = 1000
CI_LEVEL = 0.95

MonthPair = tuple[int, int]


@dataclass(frozen=True)
class Ratio:
    k: float
    low: float
    high: float
    numerator: int
    denominator: int
    n_months: int
    window: str

    def as_dict(self) -> dict:
        return {
            "k": round(self.k, 4),
            "ci95": [round(self.low, 4), round(self.high, 4)],
            "numerator_celldays": self.numerator,
            "denominator_celldays": self.denominator,
            "n_months": self.n_months,
            "window": self.window,
        }


def _shrunk(num: float, den: float, prior: float | None, strength: float) -> float | None:
    if prior is None:
        return num / den if den > 0 else None
    return (num + strength * prior) / (den + strength)


def _prior_band(prior: float | Ratio | None) -> tuple[float | None, float | None, float | None]:
    if isinstance(prior, Ratio):
        return prior.k, prior.low, prior.high
    return prior, prior, prior


def fit_ratio(
    pairs: Sequence[MonthPair],
    prior: float | Ratio | None = None,
    strength: float = PRIOR_STRENGTH,
    window: str = "",
    seed: int = 42,
) -> Ratio | None:
    """k = sum(numerator) / sum(denominator), optionally shrunk toward a prior k.

    `strength` is in denominator cell-days: a region with far fewer calibration
    cell-days than `strength` ends up close to the prior. A Ratio prior also
    carries its CI: the low/high bounds shrink toward the prior's low/high.
    """
    num = sum(p[0] for p in pairs)
    den = sum(p[1] for p in pairs)
    prior_k, prior_low, prior_high = _prior_band(prior)
    if den <= 0:
        if prior_k is None:
            return None
        return Ratio(k=prior_k, low=prior_low, high=prior_high, numerator=num, denominator=0, n_months=0, window="prior")

    k = _shrunk(num, den, prior_k, strength)
    rng = random.Random(seed)
    n = len(pairs)
    lows, highs = [], []
    for _ in range(BOOTSTRAP_SAMPLES):
        sample = [pairs[rng.randrange(n)] for _ in range(n)]
        s_num, s_den = sum(p[0] for p in sample), sum(p[1] for p in sample)
        low = _shrunk(s_num, s_den, prior_low, strength)
        if low is not None:
            lows.append(low)
            highs.append(_shrunk(s_num, s_den, prior_high, strength))
    lows.sort()
    highs.sort()
    tail = (1 - CI_LEVEL) / 2
    low = lows[int(tail * (len(lows) - 1))] if lows else k
    high = highs[int((1 - tail) * (len(highs) - 1))] if highs else k
    return Ratio(k=k, low=low, high=high, numerator=num, denominator=den, n_months=n, window=window)


def leave_one_year_out(pairs_by_year: Mapping[int, Sequence[MonthPair]]) -> dict | None:
    """Predict each year's VIIRS total from MODIS x k fitted on the other years."""
    years = [y for y, pairs in pairs_by_year.items() if sum(p[1] for p in pairs) > 0]
    if len(years) < 2:
        return None
    result = {}
    errors = []
    for year in sorted(years):
        others = [p for y in years if y != year for p in pairs_by_year[y]]
        k = sum(p[0] for p in others) / sum(p[1] for p in others)
        observed = sum(p[0] for p in pairs_by_year[year])
        predicted = k * sum(p[1] for p in pairs_by_year[year])
        error_pct = (predicted - observed) / observed * 100 if observed else None
        result[year] = {
            "observed": observed,
            "predicted": round(predicted, 1),
            "k_without_year": round(k, 4),
            "error_pct": None if error_pct is None else round(error_pct, 2),
        }
        if error_pct is not None:
            errors.append(abs(error_pct))
    return {
        "years": result,
        "mape_pct": round(sum(errors) / len(errors), 2) if errors else None,
    }


