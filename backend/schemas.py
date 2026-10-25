"""RE:VITAL AI — Pydantic v2 API Schemas
Counterfactual Recovery Intelligence & Adaptive Care Platform
"""

from __future__ import annotations
from pydantic import BaseModel


# ═══════════════════════════════════════════════════════════════
#  PATIENT & TIME-SERIES PRIMITIVES
# ═══════════════════════════════════════════════════════════════

class PatientStatic(BaseModel):
    patient_id: int
    age: float
    sofa_base: float
    comorbidity_idx: float


class TimeSeriesPoint(BaseModel):
    t: float
    values: dict[str, float]
    mask: dict[str, bool]


class StateVectorPoint(BaseModel):
    t: float
    x: list[float]
    dx: list[float]
    dxdt: list[float]
    dt_obs: float
    mask: list[float]


# ═══════════════════════════════════════════════════════════════
#  FORECAST & CONFORMAL
# ═══════════════════════════════════════════════════════════════

class ConformalBandPoint(BaseModel):
    t: float
    predicted: dict[str, float]
    lower: dict[str, float]
    upper: dict[str, float]


class OrganAttribution(BaseModel):
    hemodynamic: float
    renal: float
    inflammatory: float


class DeviationEvent(BaseModel):
    t_deviation: float
    feature_name: str
    severity: float
    organ_system: str
    is_active: bool = False


# ═══════════════════════════════════════════════════════════════
#  COUNTERFACTUAL SCENARIOS
# ═══════════════════════════════════════════════════════════════

class ScenarioTrajectoryPoint(BaseModel):
    t: float
    values: dict[str, float]


class ScenarioResult(BaseModel):
    scenario_id: str
    name: str
    label: str
    trajectory: list[ScenarioTrajectoryPoint]
    readmission_risk: float
    stability_index_7d: float
    positivity_score: float
    evidence_label: str
    causal_assumptions: list[str]
    risk_reduction_delta: float


# ═══════════════════════════════════════════════════════════════
#  COHORT / COMMAND CENTER
# ═══════════════════════════════════════════════════════════════

class CohortAlert(BaseModel):
    patient_id: int
    alert_type: str
    severity: str
    message: str
    t_trigger: float


class PatientSummary(BaseModel):
    patient_id: int
    age: float
    sofa_base: float
    status: str
    n_deviations: int
    risk_level: str


class CohortResponse(BaseModel):
    n_patients: int
    n_active_deviations: int
    alerts: list[CohortAlert]
    global_coverage: float
    global_brier: float
    global_ece: float
    mean_rmse: float
    patients_summary: list[PatientSummary]


# ═══════════════════════════════════════════════════════════════
#  PATIENT DETAIL
# ═══════════════════════════════════════════════════════════════

class PatientResponse(BaseModel):
    static: PatientStatic
    history: list[TimeSeriesPoint]
    state_vectors: list[StateVectorPoint]
    forecast: list[ConformalBandPoint]
    organ_attribution: OrganAttribution
    deviation_events: list[DeviationEvent]
    conformal_coverage: float
    uncertainty_score: float


# ═══════════════════════════════════════════════════════════════
#  SIMULATION
# ═══════════════════════════════════════════════════════════════

class SimulationRequest(BaseModel):
    intervention_time: float | None = None


class SimulationResponse(BaseModel):
    patient_id: int
    intervention_time: float
    scenarios: list[ScenarioResult]
    baseline_readmission_risk: float


# ═══════════════════════════════════════════════════════════════
#  ANALYTICS / CALIBRATION
# ═══════════════════════════════════════════════════════════════

class CalibrationBin(BaseModel):
    bin_lower: float
    bin_upper: float
    mean_predicted: float
    mean_observed: float
    count: int


class SubgroupCalibration(BaseModel):
    subgroup: str
    n: int
    coverage: float
    brier: float
    ece: float
    psi: float
    calibration_curve: list[CalibrationBin]


class AnalyticsResponse(BaseModel):
    overall_coverage: float
    overall_brier: float
    overall_ece: float
    horizon_rmse: dict[str, float]
    residual_distribution: dict[str, float]
    subgroup_calibrations: list[SubgroupCalibration]
    ablation_table: list[dict]
    coverage_drift_ledger: list[dict]
