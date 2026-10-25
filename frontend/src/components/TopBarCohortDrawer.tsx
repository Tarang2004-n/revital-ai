"use client";

import React, { useState } from "react";
import {
  CohortResponse,
  PatientSummary,
} from "@/lib/api";
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  Layers,
  Zap,
  Users,
  Search,
  Bell,
  CheckCircle2,
} from "lucide-react";

interface TopBarProps {
  cohort: CohortResponse | null;
  selectedPatientId: number;
  onSelectPatient: (id: number) => void;
  isLoading: boolean;
}

export function TopBarCohortDrawer({
  cohort,
  selectedPatientId,
  onSelectPatient,
  isLoading,
}: TopBarProps) {
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [filterBreachOnly, setFilterBreachOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  if (!cohort) {
    return (
      <header className="h-16 border-b border-white/10 bg-panel/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-clinical/10 border border-cyan-clinical/30 flex items-center justify-center animate-pulse">
            <Activity className="w-4 h-4 text-cyan-clinical" />
          </div>
          <span className="font-bold tracking-wider text-sm bg-gradient-to-r from-cyan-clinical to-emerald-fork bg-clip-text text-transparent">
            RE:VITAL AI
          </span>
        </div>
        <div className="text-xs text-slate-400 font-mono animate-pulse">
          SYNCHRONIZING FASTAPI KERNEL ON :8000...
        </div>
      </header>
    );
  }

  const breachPatients = cohort.patients_summary.filter(
    (p) => p.status === "conformal_breach"
  );

  const displayedPatients = cohort.patients_summary.filter((p) => {
    if (filterBreachOnly && p.status !== "conformal_breach") return false;
    if (searchTerm) {
      return (
        p.patient_id.toString().includes(searchTerm) ||
        p.risk_level.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  return (
    <header className="border-b border-white/10 bg-[#0A0F1D]/90 backdrop-blur-md sticky top-0 z-50">
      {/* Top Banner Row */}
      <div className="px-5 py-2.5 flex items-center justify-between gap-4 border-b border-white/5">
        {/* Brand & Kernel Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-clinical/20 to-emerald-fork/10 border border-cyan-clinical/40 flex items-center justify-center shadow-glow-cyan">
              <Activity className="w-5 h-5 text-cyan-clinical animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-widest text-slate-100 font-mono">
                  RE:VITAL<span className="text-cyan-clinical">.AI</span>
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-clinical/10 text-cyan-clinical border border-cyan-clinical/30">
                  ODE-CONFORMAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Counterfactual Recovery Intelligence & Adaptive Care
              </p>
            </div>
          </div>
        </div>

        {/* Global Model Health Strip */}
        <div className="hidden lg:flex items-center gap-3 bg-panel-subtle/80 px-3.5 py-1.5 rounded-lg border border-white/10 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-fork" />
            <span className="text-slate-400">Coverage (α=0.10):</span>
            <span className="font-semibold text-emerald-fork">
              {(cohort.global_coverage * 100).toFixed(1)}%
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Brier:</span>
            <span className="font-semibold text-slate-200">
              {cohort.global_brier.toFixed(3)}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">ECE:</span>
            <span className="font-semibold text-slate-200">
              {cohort.global_ece.toFixed(3)}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Horizon RMSE:</span>
            <span className="font-semibold text-slate-200">
              {cohort.mean_rmse.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Breach Filter & Alerts Flyout Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterBreachOnly(!filterBreachOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              filterBreachOnly
                ? "bg-amber-breach/20 text-amber-breach border border-amber-breach/40 shadow-glow-amber"
                : "bg-panel-subtle text-slate-300 border border-white/10 hover:border-amber-breach/30"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-breach" />
            <span>Breach Filter ({breachPatients.length})</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-panel-subtle border border-white/10 hover:border-cyan-clinical/40 text-slate-200 transition-all"
            >
              <Bell className="w-3.5 h-3.5 text-cyan-clinical" />
              <span>Active Alerts</span>
              <span className="w-4 h-4 rounded-full bg-rose-critical/80 text-white text-[10px] flex items-center justify-center font-bold">
                {cohort.alerts.length}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform ${
                  isAlertsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Alerts Dropdown Drawer */}
            {isAlertsOpen && (
              <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto clay-card p-3 z-50 border border-white/15 bg-panel shadow-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                  <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-breach" />
                    Adaptive Conformal Breaches
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {cohort.alerts.length} signals
                  </span>
                </div>
                <div className="space-y-1.5">
                  {cohort.alerts.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500 font-mono">
                      No active conformal deviations detected
                    </div>
                  ) : (
                    cohort.alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          onSelectPatient(alert.patient_id);
                          setIsAlertsOpen(false);
                        }}
                        className="p-2 rounded-lg bg-panel-subtle/80 hover:bg-white/5 border border-white/5 hover:border-amber-breach/40 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-amber-breach">
                            Patient #{alert.patient_id.toString().padStart(2, "0")}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            t = {alert.t_trigger.toFixed(1)}h
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                          {alert.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cohort Triage Horizontal Scroll Strip */}
      <div className="px-5 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar bg-[#080C17]/60">
        <div className="flex items-center gap-1.5 pr-2 border-r border-white/10 shrink-0 text-xs font-mono text-slate-400">
          <Users className="w-3.5 h-3.5 text-cyan-clinical" />
          <span>Cohort ({cohort.n_patients})</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {displayedPatients.map((p) => {
            const isSelected = p.patient_id === selectedPatientId;
            const isBreach = p.status === "conformal_breach";
            const isCrit = p.risk_level === "critical";
            const isTargetP3 = p.patient_id === 3;

            return (
              <button
                key={p.patient_id}
                onClick={() => onSelectPatient(p.patient_id)}
                className={`group relative shrink-0 px-2.5 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-cyan-clinical/20 text-cyan-clinical border-cyan-clinical shadow-glow-cyan"
                    : isTargetP3
                    ? "bg-rose-critical/20 text-rose-critical border-rose-critical/50 hover:bg-rose-critical/30"
                    : isBreach
                    ? "bg-amber-breach/10 text-slate-200 border-amber-breach/40 hover:bg-amber-breach/20"
                    : "bg-panel-subtle/60 text-slate-400 border-white/5 hover:border-white/20 hover:text-slate-200"
                }`}
              >
                <span className="font-bold">
                  P-{p.patient_id.toString().padStart(2, "0")}
                  {isTargetP3 && " ★"}
                </span>

                {/* Risk / Breach Indicator Dot */}
                <span
                  className={`w-2 h-2 rounded-full ${
                    isBreach || isTargetP3
                      ? "bg-amber-breach animate-ping"
                      : isCrit
                      ? "bg-rose-critical"
                      : "bg-emerald-fork/60"
                  }`}
                />

                <span className="text-[10px] opacity-70">
                  S{p.sofa_base.toFixed(0)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
