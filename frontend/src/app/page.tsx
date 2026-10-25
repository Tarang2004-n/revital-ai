"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  CohortResponse,
  PatientResponse,
  SimulationResponse,
  AnalyticsResponse,
  FeatureKey,
  fetchCohort,
  fetchPatient,
  simulateFork,
  fetchAnalytics,
} from "@/lib/api";
import { TopBarCohortDrawer } from "@/components/TopBarCohortDrawer";
import { RecoveryForkExplorer } from "@/components/RecoveryForkExplorer";
import { CalibrationLab } from "@/components/CalibrationLab";
import {
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Sliders,
  Info,
} from "lucide-react";

// Dynamically import Three.js Physiological Twin with SSR disabled
const PhysiologicalTwin3D = dynamic(
  () =>
    import("@/components/PhysiologicalTwin3D").then(
      (mod) => mod.PhysiologicalTwin3D
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-panel/60 backdrop-blur-md rounded-xl border border-white/10 p-6 min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-clinical border-t-transparent animate-spin mb-3" />
        <span className="text-xs font-mono text-slate-400">
          Mounting R3F Anatomical Twin...
        </span>
      </div>
    ),
  }
);

export default function ReVitalDashboard() {
  const [cohort, setCohort] = useState<CohortResponse | null>(null);
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  const [selectedPatientId, setSelectedPatientId] = useState<number>(3);
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey>("MAP");
  const [interventionTime, setInterventionTime] = useState<number>(64);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial Data Load
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [cohortData, analyticsData] = await Promise.all([
        fetchCohort(),
        fetchAnalytics(),
      ]);
      setCohort(cohortData);
      setAnalytics(analyticsData);

      // Default to Patient 3 (key target patient with conformal breach) or first breach
      const defaultPid = 3;
      setSelectedPatientId(defaultPid);

      const [patientData, simData] = await Promise.all([
        fetchPatient(defaultPid),
        simulateFork(defaultPid, 64.0),
      ]);
      setPatient(patientData);
      setSimulation(simData);
      setInterventionTime(simData.intervention_time || 64.0);
    } catch (err: any) {
      console.error("Initialization error:", err);
      setErrorMessage(
        err.message || "Failed to connect to RE:VITAL AI backend on http://localhost:8000"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle switching patient
  const handleSelectPatient = async (pid: number) => {
    setSelectedPatientId(pid);
    setErrorMessage(null);
    try {
      const patientData = await fetchPatient(pid);
      setPatient(patientData);

      setIsSimulating(true);
      const simData = await simulateFork(pid);
      setSimulation(simData);
      setInterventionTime(simData.intervention_time);
    } catch (err: any) {
      console.error("Error switching patient:", err);
      setErrorMessage(`Failed to load patient ${pid}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // Re-run simulation with custom intervention time
  const handleRunSimulation = async () => {
    if (!patient) return;
    setIsSimulating(true);
    try {
      const simData = await simulateFork(
        patient.static.patient_id,
        interventionTime
      );
      setSimulation(simData);
    } catch (err: any) {
      console.error("Simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col font-sans">
      {/* Top Bar & Screen A */}
      <TopBarCohortDrawer
        cohort={cohort}
        selectedPatientId={selectedPatientId}
        onSelectPatient={handleSelectPatient}
        isLoading={isLoading}
      />

      {/* Backend Connection Error Banner */}
      {errorMessage && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-critical/15 border border-rose-critical/40 text-rose-critical font-mono text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={loadInitialData}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-critical/20 hover:bg-rose-critical/30 border border-rose-critical/40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Main Clinical Command Workspace */}
      <main className="flex-1 p-5 space-y-5 max-w-[1920px] w-full mx-auto">
        {/* Upper Workspace: Left (3D Digital Twin) + Center (Recovery Fork Explorer) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Pane — Screen B: 3D Physiological Digital Twin */}
          <div className="lg:col-span-4 h-[590px]">
            <PhysiologicalTwin3D
              organAttribution={patient?.organ_attribution || null}
              uncertaintyScore={patient?.uncertainty_score || 0}
              deviationEvents={patient?.deviation_events || []}
            />
          </div>

          {/* Center Pane — Screen C: Interactive Recovery Fork Explorer */}
          <div className="lg:col-span-8 flex flex-col h-[590px]">
            <RecoveryForkExplorer
              patient={patient}
              simulation={simulation}
              selectedFeature={selectedFeature}
              onSelectFeature={setSelectedFeature}
              interventionTime={interventionTime}
              onChangeInterventionTime={setInterventionTime}
              onRunSimulation={handleRunSimulation}
              isSimulating={isSimulating}
            />
          </div>
        </div>

        {/* Lower Workspace — Screen D: Research & Calibration Lab */}
        <div>
          <CalibrationLab analytics={analytics} isLoading={isLoading} />
        </div>
      </main>

      {/* Clinical Footer */}
      <footer className="border-t border-white/5 py-3 px-6 bg-[#080C16] text-[10px] font-mono text-slate-500 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <span>RE:VITAL AI PLATFORM v1.0</span>
          <span>•</span>
          <span>Adaptive Conformal Inference (Target 90%)</span>
          <span>•</span>
          <span>Continuous-Time GRU-D ODE</span>
        </div>
        <div>
          Doubly Robust Potential Outcomes • Zero External Dataset Dependency
        </div>
      </footer>
    </div>
  );
}
