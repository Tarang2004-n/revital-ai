# RE:VITAL AI
### Counterfactual Recovery Intelligence & Adaptive Care Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![Next.js: 14](https://img.shields.io/badge/Next.js-14-black.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.1+-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch.org)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black.svg?logo=three.js&logoColor=white)](https://threejs.org)

RE:VITAL AI is an adaptive clinical machine learning platform designed for post-ICU step-down units. It combines **Continuous-Time Neural ODE / GRU-D trajectory forecasting**, **Adaptive Conformal Inference (ACI)** for dynamic uncertainty calibration (target 90% coverage), and **Doubly Robust Counterfactual Fork simulation** to evaluate clinical interventions and prevent readmissions before decompensation occurs.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │   Synthetic Step-Down Sepsis Cohort    │
                      │       (50 Patients, 168h Horizon)      │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │   Continuous-Time GRU-D State Kernel   │
                      │  [x_t, Δx_t, dx/dt, Δt_obs, mask_t]    │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
┌───────────────────────────────────┐           ┌───────────────────────────────────┐
│   Adaptive Conformal Inference    │           │   Doubly Robust Counterfactual    │
│ [ŷ_{t+h} - q_t(α), ŷ + q_t(α)]   │           │      Recovery Fork Simulator      │
│   Target Coverage 90% (α=0.10)    │           │ E[Y_{t+h}(a)|H_t] & Positivity P   │
└─────────────────┬─────────────────┘           └─────────────────┬─────────────────┘
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │    FastAPI High-Performance Engine    │
                      │   GET /api/cohort  GET /api/patient   │
                      │   POST /api/simulate  GET /api/analytics│
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │    Next.js Clinical Command Center     │
                      │  • Screen A: Cohort Triage & Breaches │
                      │  • Screen B: 3D Twin (Three.js/R3F)   │
                      │  • Screen C: Recovery Fork Explorer   │
                      │  • Screen D: Calibration & Drift Lab  │
                      └────────────────────────────────────────┘
```

---

## Key Modules

### 1. Continuous-Time Trajectory Engine (`/backend/engine.py`)
- **Irregular Time-Series Processing**: Formulates continuous temporal decay rates ($\gamma_x, \gamma_h$) handling irregular clinical telemetry timestamps.
- **State Vector Tuple**: Vectorized computation of $[x_t, \Delta x_t, \frac{dx}{dt}, \Delta t_{\text{obs}}, \text{mask}_t]$ across 6 physiological signals: `MAP`, `Lactate`, `Creatinine`, `WBC`, `HR`, `Temp`.
- **Pre-Calibrated Clinical Weights**: Deterministic initialization allowing sub-50ms inference without requiring slow training loops.

### 2. Adaptive Conformal Inference (ACI)
- **Dynamic Prediction Bands**: Computes online non-conformity scores with rolling step-size adaptation $\eta = 0.005$ to guarantee valid 90% empirical coverage under non-stationary clinical drift:
  $$q_{t+1} = q_t + \eta (\alpha - \mathbb{I}\{y_{t+1} \notin C_t(x_{t+1})\})$$
- **Breach Detection**: Automatically triggers `DEVIATION_TRIGGER = True` when observed signals exit conformal bounds or when residual isolation exceeds the risk threshold.
- **Organ-System Attributions**: Normalizes gradient-proxy weights across **Hemodynamic**, **Renal**, and **Inflammatory** systems.

### 3. Doubly Robust Counterfactual Recovery Fork Engine
- Simulates 3 discrete clinical care-delivery scenarios at deviation timestamp $t_0$:
  - **Scenario A (Routine Pathway)**: Standard 72h ward review baseline.
  - **Scenario B (Early Clinical Review)**: Immediate 6h specialist review with targeted hemodynamic protocol.
  - **Scenario C (High-Frequency Tele-Monitoring)**: Continuous biometric vigilance and rapid escalation.
- **Positivity & Out-of-Distribution Auditor**: Computes Mahalanobis distance / Propensity overlap scores $P(A=a \mid H_t) \in [0, 1]$. Automatically classifies projections as `EMPIRICALLY SUPPORTED` ($P \ge 0.15$) or `EXPLORATORY (Out-of-Distribution)` ($P < 0.15$).

### 4. Interactive 3D Digital Twin & High-Density UI (`/frontend`)
- **Procedural Anatomical Twin**: Pure Three.js + React Three Fiber node network (Neurological, Pulmonary, Cardiovascular, Hepatic, Renal) connected by pulsing vascular CatmullRom splines. No external `.gltf` asset dependencies.
- **Dynamic Shader Binding**: Node emissive intensity, scale pulse frequency, and wireframe halo colors directly bound to real-time organ attribution weights and active breach events.
- **Clinical Glassmorphic Design**: Deep slate canvas (`#070A12`), cyan (`#00F0FF`) observed trajectories, amber (`#FFB800`) conformal uncertainty breaches, and emerald (`#10B981`) recovery forks.

---

## Quick Start (One Command)

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm

### Automated Launch
```bash
git clone https://github.com/Tarang2004-n/revital-ai.git
cd revital-ai

# Make launch script executable and start both services:
chmod +x run.sh
./run.sh
```
This automatically boots:
- **FastAPI Neural ODE Kernel** on `http://127.0.0.1:8000`
- **Next.js Command Center Workspace** on `http://localhost:3000`

---

## Manual Execution

### Backend
```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run build
npm run start
```

---

## API Contract

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cohort` | Cohort triage summary, active deviation flags, global empirical coverage |
| `GET` | `/api/patient/{id}` | Patient history, state vectors, 72h forecast with conformal bands, organ attributions |
| `POST` | `/api/simulate/{id}` | Evaluates Scenarios A, B, C from timestamp $t_0$, calculates positivity & risk deltas |
| `GET` | `/api/analytics` | Subgroup reliability curves, horizon RMSE, ablation table, and drift ledger |

---

## License
MIT License. Developed for clinical decision support research.
