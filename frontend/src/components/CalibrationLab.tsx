"use client";

import React, { useState } from "react";
import {
  AnalyticsResponse,
  SubgroupCalibration,
} from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  Cpu,
  Layers,
  ShieldCheck,
  AlertCircle,
  Activity,
  ArrowRight,
} from "lucide-react";

interface CalibrationLabProps {
  analytics: AnalyticsResponse | null;
  isLoading: boolean;
}

export function CalibrationLab({ analytics, isLoading }: CalibrationLabProps) {
  const [activeTab, setActiveTab] = useState<"ablation" | "rmse" | "reliability" | "drift">("ablation");
  const [selectedSubgroupIndex, setSelectedSubgroupIndex] = useState(0);

  if (!analytics) {
    return (
      <div className="clay-card p-6 flex flex-col items-center justify-center min-h-[300px]">
        <Cpu className="w-8 h-8 text-cyan-clinical animate-pulse mb-2" />
        <span className="text-xs font-mono text-slate-400">
          Aggregating Closed-Loop Calibration & Drift Ledger...
        </span>
      </div>
    );
  }

  const selectedSubgroup =
    analytics.subgroup_calibrations[selectedSubgroupIndex] ||
    analytics.subgroup_calibrations[0];

  // SVG calibration plot dimensions
  const svgW = 440;
  const svgH = 260;
  const padL = 45;
  const padR = 20;
  const padT = 20;
  const padB = 40;

  const scale = (val: number) => {
    return {
      x: padL + val * (svgW - padL - padR),
      y: svgH - padB - val * (svgH - padT - padB),
    };
  };

  // Horizon RMSE entries
  const horizonEntries = Object.entries(analytics.horizon_rmse || {});
  const maxRmse = Math.max(...horizonEntries.map(([_, v]) => v), 1.5);

  return (
    <div className="clay-card overflow-hidden flex flex-col">
      {/* Pane Header & Tabs */}
      <div className="px-5 py-3 border-b border-white/10 bg-panel/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-cyan-clinical/10 border border-cyan-clinical/30 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-cyan-clinical" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-wider text-slate-100 flex items-center gap-2">
              SCREEN D // RESEARCH & CALIBRATION LAB
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-clinical/15 text-cyan-clinical border border-cyan-clinical/30">
                AUDITOR v1.0
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Empirical Coverage Probability, Brier Loss, ECE & Horizon RMSE Drift
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-[#090D1A] p-1 rounded-lg border border-white/10 text-xs font-mono">
          <button
            onClick={() => setActiveTab("ablation")}
            className={`px-3 py-1 rounded transition-all ${
              activeTab === "ablation"
                ? "bg-cyan-clinical text-slate-950 font-bold shadow-glow-cyan"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Ablation Matrix
          </button>
          <button
            onClick={() => setActiveTab("rmse")}
            className={`px-3 py-1 rounded transition-all ${
              activeTab === "rmse"
                ? "bg-cyan-clinical text-slate-950 font-bold shadow-glow-cyan"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Horizon RMSE
          </button>
          <button
            onClick={() => setActiveTab("reliability")}
            className={`px-3 py-1 rounded transition-all ${
              activeTab === "reliability"
                ? "bg-cyan-clinical text-slate-950 font-bold shadow-glow-cyan"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Reliability Curves
          </button>
          <button
            onClick={() => setActiveTab("drift")}
            className={`px-3 py-1 rounded transition-all ${
              activeTab === "drift"
                ? "bg-cyan-clinical text-slate-950 font-bold shadow-glow-cyan"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Subgroup Drift & PSI
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-5">
        {/* TAB 1: ABLATION TABLE */}
        {activeTab === "ablation" && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[11px] bg-panel-subtle/50">
                    <th className="py-2.5 px-3">MODEL ARCHITECTURE</th>
                    <th className="py-2.5 px-3">EMPIRICAL COVERAGE (α=0.10)</th>
                    <th className="py-2.5 px-3">BRIER SCORE</th>
                    <th className="py-2.5 px-3">24H RMSE</th>
                    <th className="py-2.5 px-3">72H RMSE</th>
                    <th className="py-2.5 px-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {analytics.ablation_table.map((row, idx) => {
                    const isOptimal = idx === 2;
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isOptimal
                            ? "bg-emerald-fork/5 text-slate-100 font-semibold"
                            : "hover:bg-white/5 text-slate-300"
                        }`}
                      >
                        <td className="py-3 px-3 flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOptimal
                                ? "bg-emerald-fork shadow-glow-emerald"
                                : "bg-slate-500"
                            }`}
                          />
                          {row.model}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-mono ${
                              row.coverage >= 0.88
                                ? "text-emerald-fork"
                                : "text-amber-breach"
                            }`}
                          >
                            {(row.coverage * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-3">{row.brier.toFixed(3)}</td>
                        <td className="py-3 px-3">{row.rmse_24h.toFixed(3)}</td>
                        <td className="py-3 px-3">{row.rmse_72h.toFixed(3)}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                              isOptimal
                                ? "bg-emerald-fork/20 text-emerald-fork border-emerald-fork/40 font-bold"
                                : "bg-white/5 text-slate-400 border-white/10"
                            }`}
                          >
                            {isOptimal ? "PRODUCTION READY" : "BASELINE COMPARATOR"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Standardized Residuals Summary */}
            <div className="p-4 rounded-xl bg-panel-subtle/80 border border-white/10 font-mono text-xs">
              <span className="text-slate-400 text-[11px] uppercase tracking-wider block mb-2">
                Standardized Residual Distribution (Z-Normalized Across All Horizon Steps)
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="bg-black/30 p-2 rounded border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Mean</span>
                  <span className="font-bold text-slate-200">
                    {analytics.residual_distribution.mean.toFixed(3)}
                  </span>
                </div>
                <div className="bg-black/30 p-2 rounded border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Std Dev</span>
                  <span className="font-bold text-slate-200">
                    {analytics.residual_distribution.std.toFixed(3)}
                  </span>
                </div>
                <div className="bg-black/30 p-2 rounded border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Skewness</span>
                  <span className="font-bold text-slate-200">
                    {analytics.residual_distribution.skewness.toFixed(3)}
                  </span>
                </div>
                <div className="bg-black/30 p-2 rounded border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Kurtosis</span>
                  <span className="font-bold text-slate-200">
                    {analytics.residual_distribution.kurtosis.toFixed(3)}
                  </span>
                </div>
                <div className="bg-black/30 p-2 rounded border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Q25</span>
                  <span className="font-bold text-slate-200">
                    {analytics.residual_distribution.q25.toFixed(3)}
                  </span>
                </div>
                <div className="bg-black/30 p-2 rounded border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Median</span>
                  <span className="font-bold text-slate-200">
                    {analytics.residual_distribution.q50.toFixed(3)}
                  </span>
                </div>
                <div className="bg-black/30 p-2 rounded border border-white/5">
                  <span className="text-[10px] text-slate-500 block">Q75</span>
                  <span className="font-bold text-slate-200">
                    {analytics.residual_distribution.q75.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HORIZON RMSE BAR COMPARISONS */}
        {activeTab === "rmse" && (
          <div className="space-y-4 font-mono">
            <div className="text-xs text-slate-400">
              Trajectory Forecasting Root Mean Squared Error (RMSE) across dynamic horizons (6h to 72h):
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {horizonEntries.map(([horizon, rmse]) => {
                const heightPct = Math.min((rmse / maxRmse) * 100, 100);
                return (
                  <div
                    key={horizon}
                    className="p-3 rounded-xl bg-panel-subtle/80 border border-white/10 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-200 block mb-1">
                        Horizon {horizon}
                      </span>
                      <span className="text-lg font-black text-cyan-clinical block">
                        {rmse.toFixed(4)}
                      </span>
                      <span className="text-[10px] text-slate-400">RMSE (Z-Units)</span>
                    </div>

                    <div className="h-24 w-full bg-white/5 rounded-lg flex items-end p-1.5 mt-3">
                      <div
                        className="w-full bg-gradient-to-t from-cyan-clinical to-emerald-fork rounded transition-all duration-500"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Overall Global Trajectory RMSE: {analytics.horizon_rmse["72h"]?.toFixed(4) || "N/A"}</span>
              <span className="text-emerald-fork font-bold">Stable Autoregressive Decay</span>
            </div>
          </div>
        )}

        {/* TAB 3: RELIABILITY DIAGRAM */}
        {activeTab === "reliability" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* SVG Reliability Plot */}
            <div className="lg:col-span-2 bg-[#090E1D] p-4 rounded-xl border border-white/10">
              <div className="flex justify-between items-center mb-2 font-mono text-xs">
                <span className="font-bold text-slate-200">
                  Reliability Curve (Calibration Curve) — {selectedSubgroup.subgroup}
                </span>
                <span className="text-[11px] text-slate-400">
                  ECE: {selectedSubgroup.ece.toFixed(3)} | Brier: {selectedSubgroup.brier.toFixed(3)}
                </span>
              </div>

              <div className="flex justify-center">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-[500px] h-auto">
                  {/* Grid Lines */}
                  {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((v) => {
                    const { x, y } = scale(v);
                    return (
                      <g key={v}>
                        <line
                          x1={x}
                          y1={padT}
                          x2={x}
                          y2={svgH - padB}
                          stroke="rgba(255,255,255,0.06)"
                          strokeDasharray="2 2"
                        />
                        <line
                          x1={padL}
                          y1={y}
                          x2={svgW - padR}
                          y2={y}
                          stroke="rgba(255,255,255,0.06)"
                          strokeDasharray="2 2"
                        />
                        <text
                          x={x}
                          y={svgH - padB + 16}
                          fill="#64748B"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {v.toFixed(1)}
                        </text>
                        <text
                          x={padL - 8}
                          y={y + 3}
                          fill="#64748B"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="end"
                        >
                          {v.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Perfect Calibration Reference Diagonal Line (y = x) */}
                  <line
                    x1={scale(0).x}
                    y1={scale(0).y}
                    x2={scale(1).x}
                    y2={scale(1).y}
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Calibration Bins & Observed Points */}
                  {selectedSubgroup.calibration_curve.map((bin, i) => {
                    const pt = scale(bin.mean_predicted);
                    const obsPt = scale(bin.mean_observed);
                    return (
                      <g key={i}>
                        {/* ECE Deviation Residual Bar */}
                        <line
                          x1={pt.x}
                          y1={pt.y}
                          x2={pt.x}
                          y2={obsPt.y}
                          stroke="rgba(255, 184, 0, 0.6)"
                          strokeWidth="2"
                        />
                        {/* Observed Point */}
                        <circle
                          cx={pt.x}
                          cy={obsPt.y}
                          r="4"
                          fill="#00F0FF"
                          stroke="#070A12"
                          strokeWidth="1.5"
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 px-2">
                <span>X-Axis: Mean Predicted Probability</span>
                <span>Y-Axis: Observed Empirical Frequency</span>
              </div>
            </div>

            {/* Subgroup Selector Buttons */}
            <div className="space-y-2 font-mono">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                Select Subgroup Cohort:
              </span>
              {analytics.subgroup_calibrations.map((sg, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSubgroupIndex(idx)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                    selectedSubgroupIndex === idx
                      ? "bg-cyan-clinical/15 border-cyan-clinical/50 text-slate-100 shadow-glow-cyan"
                      : "bg-panel-subtle border-white/5 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <div>
                    <span className="font-bold block text-slate-200">
                      {sg.subgroup}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Sample Size: n={sg.n}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Coverage</span>
                    <span className="font-bold text-emerald-fork">
                      {(sg.coverage * 100).toFixed(1)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SUBGROUP DRIFT & PSI */}
        {activeTab === "drift" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
              {analytics.subgroup_calibrations.map((sg, idx) => {
                const psiLevel =
                  sg.psi < 0.1 ? "STABLE" : sg.psi < 0.25 ? "MODERATE SHIFT" : "ALERT";
                const psiColor =
                  sg.psi < 0.1
                    ? "text-emerald-fork border-emerald-fork/30 bg-emerald-fork/10"
                    : sg.psi < 0.25
                    ? "text-amber-breach border-amber-breach/30 bg-amber-breach/10"
                    : "text-rose-critical border-rose-critical/30 bg-rose-critical/10";

                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-panel-subtle/80 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-200 text-xs">{sg.subgroup}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${psiColor}`}>
                        {psiLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-[10px] text-slate-400">PSI Shift</span>
                        <div className="font-bold text-slate-200">{sg.psi.toFixed(3)}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Coverage</span>
                        <div className="font-bold text-emerald-fork">
                          {(sg.coverage * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 flex justify-between pt-2 border-t border-white/5">
                      <span>ECE: {sg.ece.toFixed(3)}</span>
                      <span>Brier: {sg.brier.toFixed(3)}</span>
                      <span>n={sg.n}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rolling Horizon Drift Ledger */}
            <div className="p-4 rounded-xl bg-panel-subtle/60 border border-white/10 font-mono text-xs">
              <span className="text-slate-300 font-bold block mb-2">
                24-Hour Rolling Conformal Coverage Drift Ledger (168-Hour Window)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {analytics.coverage_drift_ledger.map((win, idx) => (
                  <div key={idx} className="bg-black/40 p-2.5 rounded border border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 block mb-1">
                      {win.window_start_h}h - {win.window_end_h}h
                    </span>
                    <span className="font-bold text-emerald-fork text-xs block">
                      {(win.empirical_coverage * 100).toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-slate-500">
                      PSI: {win.psi.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
