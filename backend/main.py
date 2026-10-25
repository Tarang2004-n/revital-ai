"""RE:VITAL AI — FastAPI Application
Counterfactual Recovery Intelligence & Adaptive Care Platform
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    SimulationRequest,
    CohortResponse,
    PatientResponse,
    SimulationResponse,
    AnalyticsResponse,
)
from engine import RevitalEngine

app = FastAPI(
    title="RE:VITAL AI",
    version="1.0.0",
    description="Counterfactual Recovery Intelligence & Adaptive Care Platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = RevitalEngine()


@app.get("/api/cohort", response_model=CohortResponse)
def get_cohort():
    return engine.get_cohort()


@app.get("/api/patient/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int):
    if patient_id < 0 or patient_id >= len(engine.patients):
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return engine.get_patient(patient_id)


@app.post("/api/simulate/{patient_id}", response_model=SimulationResponse)
def simulate(patient_id: int, req: SimulationRequest):
    if patient_id < 0 or patient_id >= len(engine.patients):
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")
    return engine.simulate(patient_id, req.intervention_time)


@app.get("/api/analytics", response_model=AnalyticsResponse)
def get_analytics():
    return engine.get_analytics()
