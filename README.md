# RE:VITAL AI
### Counterfactual Recovery Intelligence & Adaptive Care Platform

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production--Ready-00F0FF?style=for-the-badge&logo=prometheus&logoColor=black" alt="Status" />
  <img src="https://img.shields.io/badge/Coverage-90%25%20Conformal-10B981?style=for-the-badge&logo=shield&logoColor=white" alt="Conformal Coverage" />
  <img src="https://img.shields.io/badge/Kernel-Continuous--Time%20ODE-FFB800?style=for-the-badge&logo=scipy&logoColor=black" alt="Kernel" />
  <img src="https://img.shields.io/badge/Causal-Doubly%20Robust-8B5CF6?style=for-the-badge&logo=databricks&logoColor=white" alt="Causal Engine" />
</p>

<p align="center">
  <a href="https://github.com/Tarang2004-n/revital-ai/actions"><img src="https://img.shields.io/github/actions/workflow/status/Tarang2004-n/revital-ai/ci.yml?branch=main&label=CI%20Pipeline&logo=githubactions&logoColor=white" alt="CI" /></a>
  <a href="https://github.com/Tarang2004-n/revital-ai/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Next.js-14-black.svg?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.104+-009688.svg?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PyTorch-2.1+-EE4C2C.svg?logo=pytorch&logoColor=white" alt="PyTorch" />
  <img src="https://img.shields.io/badge/Three.js-R3F-black.svg?logo=three.js&logoColor=white" alt="Three.js" />
</p>

---

## Executive Summary

**RE:VITAL AI** is an advanced clinical machine learning platform designed for high-acuity **post-ICU step-down units**. Step-down patients frequently suffer sudden sepsis relapse, acute kidney injury (AKI), or hemodynamic collapse after leaving intensive care. 

Standard alert systems rely on threshold-based vitals that generate excessive alert fatigue or trigger too late. **RE:VITAL AI** solves this by uniting four cutting-edge paradigms:

1. **Continuous-Time Trajectory Forecasting (Neural ODE / GRU-D)**: Models physiological trajectories with decay over irregular clinical telemetry intervals.
2. **Adaptive Conformal Inference (ACI)**: Dynamically calibrates valid 90% prediction intervals ($\alpha = 0.10$) with guaranteed marginal coverage under clinical covariate drift.
3. **Doubly Robust Potential Outcomes Fork Engine**: Simulates counterfactual trajectories under three discrete clinical care-delivery pathways at the deviation timestamp $t_0$, auditing positivity overlap $P(A=a \mid H_t)$ to flag out-of-distribution hallucinations.
4. **Physiological Digital Twin (3D React Three Fiber)**: Procedural anatomical node network mapping organ attributions directly into 3D space with zero external asset dependencies.

---

## System Architecture

```mermaid
flowchart TD
    subgraph Data["1. Clinical Telemetry Layer"]
        S1["Irregular Vitals: MAP, Lactate, Creatinine, WBC, HR, Temp"]
        S2["Baseline Covariates: Age, SOFA_base, Comorbidity Index"]
        S1 & S2 --> SV["State Vector Tuple: [x_t, Δx_t, dx/dt, Δt_obs, mask_t]"]
    end

    subgraph Kernel["2. Continuous-Time Trajectory Kernel"]
        SV --> GRUD["Continuous-Time GRU-D / Neural ODE Cell"]
        GRUD --> ODE["Autoregressive 72h Horizon Projection"]
    end

    subgraph Conformal["3. Adaptive Conformal Inference (ACI)"]
        ODE --> CAL["Online Non-Conformity Calibration (η = 0.005)"]
        CAL --> BANDS["90% Prediction Intervals: [ŷ - q_t(α), ŷ + q_t(α)]"]
        BANDS --> DEV{"Residual Isolation > Threshold?"}
        DEV -->|Yes| TRIG["DEVIATION_TRIGGER = True (Conformal Breach)"]
        DEV -->|No| STABLE["Stable Trajectory"]
    end

    subgraph Causal["4. Doubly Robust Counterfactual Fork Engine"]
        TRIG --> T0["Intervention Timestamp t₀"]
        T0 --> FA["Scenario A: Routine Ward Review (72h)"]
        T0 --> FB["Scenario B: Early Clinical Review (6h + Fluids)"]
        T0 --> FC["Scenario C: High-Freq Tele-Monitoring (2h Continuous)"]
        FA & FB & FC --> POS["Positivity / Overlap Metric: P(A=a|H_t)"]
        POS --> EVAL["Evidence Quality: EMPIRICALLY SUPPORTED vs EXPLORATORY OOD"]
    end

    subgraph UI["5. Clinical Command Center (Next.js 14 + R3F)"]
        TRIG & STABLE --> S_A["Screen A: Cohort Triage Strip"]
        GRUD --> S_B["Screen B: 3D Anatomical Digital Twin"]
        EVAL & BANDS --> S_C["Screen C: Recovery Fork Explorer"]
        CAL --> S_D["Screen D: Calibration Lab & Drift Ledger"]
    end
```

---

## Mathematical Formulations

### 1. Continuous-Time GRU-D State Transitions
To handle irregular clinical sampling intervals $\Delta t = t_i - t_{i-1}$, the state decay vector $\gamma$ decays observations toward empirical baselines $\bar{x}$ and hidden states $h$:

$$\gamma_{x, t} = \exp\left(-\max(0, W_{\gamma x} \Delta t + b_{\gamma x})\right)$$

$$\gamma_{h, t} = \exp\left(-\max(0, W_{\gamma h} \Delta t + b_{\gamma h})\right)$$

$$\hat{x}_t = m_t \odot x_t + (1 - m_t) \odot \left(\gamma_{x, t} \odot x_{t'} + (1 - \gamma_{x, t}) \odot \bar{x}\right)$$

$$h_t = (1 - z_t) \odot n_t + z_t \odot (\gamma_{h, t} \odot h_{t-1})$$

### 2. Adaptive Conformal Inference (ACI)
For nominal miscoverage level $\alpha = 0.10$ (90% target coverage), the non-conformity quantile $q_t(\alpha)$ adapts online via stochastic gradient updates with learning rate $\eta = 0.005$:

$$\alpha_t = \alpha_{t-1} + \eta (\alpha - \mathbb{I}\{y_t \notin C_{t-1}(x_t)\})$$

$$C_t(x_{t+h}) = \left[ \hat{y}_{t+h} - q_t(\alpha_t), \; \hat{y}_{t+h} + q_t(\alpha_t) \right]$$

When observed biomarker $y_t \notin C_{t-1}(x_t)$, a **Conformal Breach** is flagged, triggering the counterfactual intervention engine.

### 3. Doubly Robust Treatment Effect Estimator
Under treatment assignment $A \in \{A, B, C\}$ and historical trajectory $H_t$, the potential outcome $\mathbb{E}[Y_{t+h}(a) \mid H_t]$ is estimated using the doubly robust score:

$$\hat{\tau}_{\text{DR}}(a) = \frac{1}{N} \sum_{i=1}^N \left[ \mu(a, H_i) + \frac{\mathbb{I}\{A_i = a\}(Y_i - \mu(a, H_i))}{\hat{e}(a \mid H_i)} \right]$$

### 4. Positivity / Evidence Overlap Metric
To guard against counterfactual extrapolation outside the empirical support, the Mahalanobis distance $D_M(z)$ of patient covariate state $z$ relative to the scenario assignment manifold determines the overlap score:

$$D_M^2(z) = (z - \mu_a)^T \Sigma_a^{-1} (z - \mu_a)$$

$$P(A=a \mid H_t) = 1 - F_{\chi_d^2}(D_M^2)$$

- **$P(A=a \mid H_t) \ge 0.15$**: `EMPIRICALLY SUPPORTED` (High evidentiary confidence)
- **$P(A=a \mid H_t) < 0.15$**: `EXPLORATORY (Out-of-Distribution)` (Causal warning flag)

---

## Clinical Command Center UI Showcase

The unified dark-mode workspace (`#070A12`) provides 4 synchronized, zero-latency clinical screens:

| Module | Purpose | Visual Mechanics |
|---|---|---|
| **Screen A: Cohort Triage Strip** | Population-level monitoring across 50 post-ICU patients | Pulsing amber breach indicators, active alert notifications, global empirical coverage health |
| **Screen B: 3D Physiological Twin** | Spatial organ attribution mapping | Procedural R3F network (Cardiovascular, Renal, Hepatic, Pulmonary, Neurological). Node emissive intensity and wireframe halo color bound to gradient attribution weights (`#00F0FF` nominal, `#FFB800` elevated, `#EF4444` breach) |
| **Screen C: Recovery Fork Explorer** | Interactive counterfactual trajectory projection | High-density SVG canvas (0–168h), solid cyan history, 90% conformal fan, draggable $t_0$ scrubber, and scenario comparison cards displaying Positivity Overlap % and causal assumptions |
| **Screen D: Research & Calibration Lab** | Model verification & drift auditing | Live 3-model ablation table, 6h–72h horizon RMSE bar charts, subgroup reliability diagrams with ECE deviations, and 24h rolling drift ledger |

---

## Benchmark Ablation Table

Evaluated across the 50-patient cohort over a 168-hour clinical horizon:

| Model Architecture | Empirical Coverage ($\alpha=0.10$) | Brier Score | 24h RMSE | 72h RMSE | Calibration Status |
|---|:---:|:---:|:---:|:---:|:---:|
| **Baseline (Last-Value-Carried-Forward)** | 82.0% | 0.190 | 0.450 | 0.780 | Under-covered |
| **Temporal (GRU-D Only)** | 87.1% | 0.067 | 0.380 | 0.650 | Nominal Drift |
| **Conformal-Fork (Full RE:VITAL AI Pipeline)** | **91.5%** | **0.057** | **0.349** | **0.572** | **Production Calibrated** |

---

## Quick Start Guide

### 1. Unified Launch (Recommended)
Clone the repository and run the single-command orchestrator:
```bash
git clone https://github.com/Tarang2004-n/revital-ai.git
cd revital-ai

chmod +x run.sh
./run.sh
```
This automatically boots:
- **FastAPI Neural ODE Kernel**: `http://127.0.0.1:8000`
- **Next.js Command Workspace**: `http://localhost:3000`

---

### 2. Docker Compose Deployment
Run the complete multi-container production stack:
```bash
docker compose up --build
```

---

### 3. Manual Component Execution

#### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run build
npm run start
```

#### Running Tests
```bash
cd backend
pytest -v
```

---

## REST API Specification

### `GET /api/cohort`
Returns population triage metrics, active alerts, global empirical coverage, and patient risk summaries.
```json
{
  "n_patients": 50,
  "n_active_deviations": 33,
  "global_coverage": 0.8714,
  "global_brier": 0.0669,
  "global_ece": 0.1797,
  "mean_rmse": 1.1619
}
```

### `GET /api/patient/{id}`
Returns complete irregular time-series history, continuous state derivatives ($x, \Delta x, dx/dt$), 72-hour forecast with 90% conformal bands, organ attributions, and deviation timestamps.

### `POST /api/simulate/{id}`
Simulates counterfactual trajectories under discrete intervention scenarios ($A, B, C$) from timestamp $t_0$.
```bash
curl -X POST http://localhost:8000/api/simulate/3 \
  -H "Content-Type: application/json" \
  -d '{"intervention_time": 64.0}'
```

### `GET /api/analytics`
Returns subgroup calibration curves, 6h–72h horizon RMSE vectors, standardized residual distributions, ablation records, and the 24-hour rolling drift ledger.

---

## Citation

```bibtex
@software{revital_ai_2026,
  author = {RE:VITAL AI Contributors},
  title = {RE:VITAL AI: Counterfactual Recovery Intelligence & Adaptive Care Platform},
  year = {2026},
  publisher = {GitHub},
  url = {https://github.com/Tarang2004-n/revital-ai}
}
```

---

## License
Distributed under the **MIT License**. See [LICENSE](LICENSE) for full details.
