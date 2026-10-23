"""
Measurement anomaly detection with scikit-learn's Isolation Forest.

The rule engine (src/lib/fitcheck/validate.ts) catches single values that are
impossible, typos and unit slips, plus a few hand-written ratios. This model
looks at the whole set together: a combination where every value is plausible
on its own but the set as a whole doesn't look like a real body.

Isolation Forest splits on one feature at a time, so on raw measurements it
almost never notices broken correlations (bust 33, waist 40, hip 37 is fine
value by value). It is fed each field's residual instead — how far the value is
from what the other fields predict, in standard deviations — which turns a
wrong field into an extreme on its own axis. The largest residual names the
field to re-check.

Customers fill in different fields per garment, so one model is trained per set
of fields present and cached.
"""

from functools import lru_cache
from threading import Lock

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression

from population import BODY_FIELDS, from_orders, synthetic

MIN_FIELDS = 3
CONTAMINATION = 0.02  # share of the training population treated as unusual → roughly the false-alarm rate


class ResidualZ(BaseEstimator, TransformerMixin):
    """Each field → (value − value predicted from the other fields) / residual SD."""

    def fit(self, X, y=None):
        self.regs_ = []
        for i in range(X.shape[1]):
            others = np.delete(X, i, axis=1)
            reg = LinearRegression().fit(others, X[:, i])
            self.regs_.append((reg, float((X[:, i] - reg.predict(others)).std())))
        return self

    def expected(self, X):
        return np.column_stack([reg.predict(np.delete(X, i, axis=1)) for i, (reg, _) in enumerate(self.regs_)])

    def transform(self, X):
        return (X - self.expected(X)) / np.array([sd for _, sd in self.regs_])


class AnomalyModel:
    def __init__(self, db_path: str | None):
        orders = from_orders(db_path)
        self.data = np.vstack([synthetic(), orders])
        self.real_orders = len(orders)
        self._lock = Lock()

    @lru_cache(maxsize=256)
    def _fit(self, fields: tuple[str, ...]):
        idx = [BODY_FIELDS.index(f) for f in fields]
        X = self.data[:, idx]
        X = X[~np.isnan(X).any(axis=1)]
        resid = ResidualZ().fit(X)
        forest = IsolationForest(n_estimators=300, max_samples=min(2048, len(X)), contamination=CONTAMINATION, random_state=7)
        forest.fit(resid.transform(X))
        return resid, forest

    def check(self, inches: dict[str, float]) -> dict:
        fields = tuple(f for f in BODY_FIELDS if isinstance(inches.get(f), (int, float)))
        if len(fields) < MIN_FIELDS:
            return {"checked": False, "reason": f"Needs at least {MIN_FIELDS} body measurements."}
        with self._lock:  # lru_cache isn't safe against two threads fitting the same key
            resid, forest = self._fit(fields)
        x = np.array([[inches[f] for f in fields]], dtype=float)
        z = resid.transform(x)[0]
        score = float(forest.decision_function(z[None, :])[0])  # < 0 → outside the learned population
        out = {"checked": True, "fields": list(fields), "score": round(score, 4), "anomalous": score < 0}
        if out["anomalous"]:
            i = int(np.abs(z).argmax())
            expected = float(resid.expected(x)[0, i])
            sd = resid.regs_[i][1]
            out["suspect"] = {
                "field": fields[i],
                "value": inches[fields[i]],
                "expectedLow": round(expected - 1.5 * sd, 1),
                "expectedHigh": round(expected + 1.5 * sd, 1),
            }
        return out
