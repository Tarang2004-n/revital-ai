"""Unit tests for RE:VITAL AI computational kernel and FastAPI routes."""

import pytest
import numpy as np
from fastapi.testclient import TestClient

from engine import RevitalEngine, N_PATIENTS, N_FEAT, FEATURES
from main import app


@pytest.fixture(scope="module")
def engine():
    return RevitalEngine()


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_cohort_generation(engine):
    assert len(engine.patients) == N_PATIENTS
    for p in engine.patients:
        assert p.values.shape[1] == N_FEAT
        assert p.mask.shape == p.values.shape
        assert len(p.timestamps) == len(p.values)
        assert 18 <= p.age <= 100
        assert 0 <= p.sofa_base <= 24
        assert 0 <= p.comorbidity_idx <= 1.0


def test_forecast_and_conformal_bounds(engine):
    for p in engine.patients[:5]:
        assert len(p.forecast_t) == 36
        assert p.forecast_vals.shape == (36, N_FEAT)
        assert p.conf_lower.shape == (36, N_FEAT)
        assert p.conf_upper.shape == (36, N_FEAT)
        # Lower bound must be strictly less than or equal to upper bound
        assert np.all(p.conf_lower <= p.conf_upper)


def test_organ_attribution(engine):
    for p in engine.patients[:5]:
        attr = p.organ_attr
        assert "hemodynamic" in attr
        assert "renal" in attr
        assert "inflammatory" in attr
        total = attr["hemodynamic"] + attr["renal"] + attr["inflammatory"]
        assert pytest.approx(total, rel=1e-2) == 1.0


def test_counterfactual_simulation(engine):
    res = engine.simulate(pid=3, intervention_time=64.0)
    assert res.patient_id == 3
    assert res.intervention_time == 64.0
    assert len(res.scenarios) == 3

    scenario_ids = [s.scenario_id for s in res.scenarios]
    assert "A" in scenario_ids
    assert "B" in scenario_ids
    assert "C" in scenario_ids

    for s in res.scenarios:
        assert 0.0 <= s.readmission_risk <= 1.0
        assert 0.0 <= s.positivity_score <= 1.0
        assert len(s.trajectory) == 36
        assert len(s.causal_assumptions) > 0


def test_api_cohort(client):
    res = client.get("/api/cohort")
    assert res.status_code == 200
    data = res.json()
    assert data["n_patients"] == 50
    assert "global_coverage" in data
    assert "global_brier" in data
    assert "global_ece" in data
    assert len(data["patients_summary"]) == 50


def test_api_patient_detail(client):
    res = client.get("/api/patient/3")
    assert res.status_code == 200
    data = res.json()
    assert data["static"]["patient_id"] == 3
    assert "organ_attribution" in data
    assert len(data["history"]) > 0
    assert len(data["forecast"]) == 36


def test_api_simulate(client):
    payload = {"intervention_time": 72.0}
    res = client.post("/api/simulate/3", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["patient_id"] == 3
    assert len(data["scenarios"]) == 3


def test_api_analytics(client):
    res = client.get("/api/analytics")
    assert res.status_code == 200
    data = res.json()
    assert "overall_coverage" in data
    assert "horizon_rmse" in data
    assert len(data["ablation_table"]) >= 3
    assert len(data["subgroup_calibrations"]) >= 4
