export interface PatientStatic {
  patient_id: number;
  age: number;
  sofa_base: number;
  comorbidity_idx: number;
}

export interface TimeSeriesPoint {
  t: number;
  values: Record<string, number>;
  mask: Record<string, boolean>;
}

export interface StateVectorPoint {
  t: number;
  x: number[];
  dx: number[];
  dxdt: number[];
  dt_obs: number;
  mask: number[];
}

export interface ConformalBandPoint {
  t: number;
  predicted: Record<string, number>;
  lower: Record<string, number>;
  upper: Record<string, number>;
}

export interface OrganAttribution {
  hemodynamic: number;
  renal: number;
  inflammatory: number;
}

export interface DeviationEvent {
  t_deviation: number;
  feature_name: string;
  severity: number;
  organ_system: string;
  is_active: boolean;
}

export interface ScenarioTrajectoryPoint {
  t: number;
  values: Record<string, number>;
}

export interface ScenarioResult {
  scenario_id: string;
  name: string;
  label: string;
  trajectory: ScenarioTrajectoryPoint[];
  readmission_risk: number;
  stability_index_7d: number;
  positivity_score: number;
  evidence_label: string;
  causal_assumptions: string[];
  risk_reduction_delta: number;
}

export interface CohortAlert {
  patient_id: number;
  alert_type: string;
  severity: string;
  message: string;
  t_trigger: number;
}

export interface PatientSummary {
  patient_id: number;
  age: number;
  sofa_base: number;
  status: string;
  n_deviations: number;
  risk_level: string;
}

export interface CohortResponse {
  n_patients: number;
  n_active_deviations: number;
  alerts: CohortAlert[];
  global_coverage: number;
  global_brier: number;
  global_ece: number;
  mean_rmse: number;
  patients_summary: PatientSummary[];
}

export interface PatientResponse {
  static: PatientStatic;
  history: TimeSeriesPoint[];
  state_vectors: StateVectorPoint[];
  forecast: ConformalBandPoint[];
  organ_attribution: OrganAttribution;
  deviation_events: DeviationEvent[];
  conformal_coverage: number;
  uncertainty_score: number;
}

export interface SimulationResponse {
  patient_id: number;
  intervention_time: number;
  scenarios: ScenarioResult[];
  baseline_readmission_risk: number;
}

export interface CalibrationBin {
  bin_lower: number;
  bin_upper: number;
  mean_predicted: number;
  mean_observed: number;
  count: number;
}

export interface SubgroupCalibration {
  subgroup: string;
  n: number;
  coverage: number;
  brier: number;
  ece: number;
  psi: number;
  calibration_curve: CalibrationBin[];
}

export interface AblationRow {
  model: string;
  coverage: number;
  brier: number;
  rmse_24h: number;
  rmse_72h: number;
}

export interface DriftLedgerEntry {
  window_start_h: number;
  window_end_h: number;
  empirical_coverage: number;
  target_coverage: number;
  psi: number;
}

export interface AnalyticsResponse {
  overall_coverage: number;
  overall_brier: number;
  overall_ece: number;
  horizon_rmse: Record<string, number>;
  residual_distribution: Record<string, number>;
  subgroup_calibrations: SubgroupCalibration[];
  ablation_table: AblationRow[];
  coverage_drift_ledger: DriftLedgerEntry[];
}

export const CLINICAL_FEATURES = [
  { key: "MAP", label: "MAP", unit: "mmHg", normalMin: 65, normalMax: 100, organ: "hemodynamic" },
  { key: "Lactate", label: "Lactate", unit: "mmol/L", normalMin: 0.5, normalMax: 2.0, organ: "hemodynamic" },
  { key: "Creatinine", label: "Creatinine", unit: "mg/dL", normalMin: 0.7, normalMax: 1.3, organ: "renal" },
  { key: "WBC", label: "WBC", unit: "×10³/µL", normalMin: 4.5, normalMax: 11.0, organ: "inflammatory" },
  { key: "HR", label: "Heart Rate", unit: "bpm", normalMin: 60, normalMax: 100, organ: "hemodynamic" },
  { key: "Temp", label: "Core Temp", unit: "°C", normalMin: 36.5, normalMax: 37.5, organ: "inflammatory" },
] as const;

export type FeatureKey = "MAP" | "Lactate" | "Creatinine" | "WBC" | "HR" | "Temp";

const API_BASE =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function fetchCohort(): Promise<CohortResponse> {
  const res = await fetch(`${API_BASE}/api/cohort`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch cohort`);
  return res.json();
}

export async function fetchPatient(patientId: number): Promise<PatientResponse> {
  const res = await fetch(`${API_BASE}/api/patient/${patientId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch patient ${patientId}`);
  return res.json();
}

export async function simulateFork(
  patientId: number,
  interventionTime?: number
): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/api/simulate/${patientId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intervention_time: interventionTime ?? null }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to simulate counterfactual fork for patient ${patientId}`);
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const res = await fetch(`${API_BASE}/api/analytics`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch analytics`);
  return res.json();
}
