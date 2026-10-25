"use client";

import React, { useState, useMemo } from "react";
import {
  PatientResponse,
  SimulationResponse,
  CLINICAL_FEATURES,
  FeatureKey,
} from "@/lib/api";
import {
  GitFork,
  Sliders,
  AlertTriangle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

interface ForkExplorerProps {
  patient: PatientResponse | null;
  simulation: SimulationResponse | null;
  selectedFeature: FeatureKey;
  onSelectFeature: (f: FeatureKey) => void;
  interventionTime: number;
  onChangeInterventionTime: (t: number) => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
}

export function RecoveryForkExplorer({
  patient,
  simulation,
  selectedFeature,
  onSelectFeature,
  interventionTime,
  onChangeInterventionTime,
  onRunSimulation,
  isSimulating,
}: ForkExplorerProps) {
  const [activeScenarios, setActiveScenarios] = useState<Record<string, boolean>>({
    A: true,
    B: true,
    C: true,
  });

  const [expandedAssumptions, setExpandedAssumptions] = useState<string | null>(null);

  const toggleScenario = (id: string) => {
    setActiveScenarios((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const featureMeta = useMemo(() => {
    return (
      CLINICAL_FEATURES.find((f) => f.key === selectedFeature) ||
      CLINICAL_FEATURES[0]
    );
  }, [selectedFeature]);

  // Compute SVG chart coordinates (0 to 168h horizon)
  const chartData = useMemo(() => {
    if (!patient) return null;

    const histPoints = patient.history
      .filter((p) => p.mask[selectedFeature])
      .map((p) => ({ t: p.t, v: p.values[selectedFeature] }));

    const fcPoints = patient.forecast.map((p) => ({
      t: p.t,
      pred: p.predicted[selectedFeature],
      lower: p.lower[selectedFeature],
      upper: p.upper[selectedFeature],
    }));

    const allVals: number[] = [
      ...histPoints.map((p) => p.v),
      ...fcPoints.flatMap((p) => [p.lower, p.upper]),
      featureMeta.normalMin,
      featureMeta.normalMax,
    ];

    if (simulation) {
      simulation.scenarios.forEach((s) => {
        s.trajectory.forEach((tp) => {
          if (tp.values[selectedFeature] !== undefined) {
            allVals.push(tp.values[selectedFeature]);
          }
        });
      });
    }

    const minY = Math.floor(Math.min(...allVals) * 0.9);
    const maxY = Math.ceil(Math.max(...allVals) * 1.1);
    const minT = 0;
    const maxT = 168; // 168-hour full post-ICU step-down horizon

    return { histPoints, fcPoints, minY, maxY, minT, maxT };
  }, [patient, simulation, selectedFeature, featureMeta]);

  // SVG dimensions
  const svgWidth = 840;
  const svgHeight = 280;
  const padL = 50;
  const padR = 25;
  const padT = 24;
  const padB = 35;

  const scaleX = (t: number) => {
    if (!chartData) return 0;
    return padL + ((t - chartData.minT) / (chartData.maxT - chartData.minT)) * (svgWidth - padL - padR);
  };

  const scaleY = (v: number) => {
    if (!chartData) return 0;
    return svgHeight - padB - ((v - chartData.minY) / (chartData.maxY - chartData.minY)) * (svgHeight - padT - padB);
  };

  if (!patient || !chartData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center clay-card p-6 min-h-[400px]">
        <GitFork className="w-8 h-8 text-cyan-clinical animate-pulse mb-2" />
        <span className="text-xs font-mono text-slate-400">
          Loading Continuous-Time Trajectory Stream...
        </span>
      </div>
    );
  }

  // Construct SVG Path for observed history (solid cyan #00F0FF)
  const observedPath = chartData.histPoints.reduce((acc, pt, i) => {
    const x = scaleX(pt.t);
    const y = scaleY(pt.v);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, "");

  // Construct SVG Path for Conformal Fan (Polygon)
  let conformalFanPath = "";
  if (chartData.fcPoints.length > 0) {
    const upperPoints = chartData.fcPoints.map(
      (p) => `${scaleX(p.t)},${scaleY(p.upper)}`
    );
    const lowerPoints = [...chartData.fcPoints]
      .reverse()
      .map((p) => `${scaleX(p.t)},${scaleY(p.lower)}`);
    conformalFanPath = `M ${upperPoints.join(" L ")} L ${lowerPoints.join(" L ")} Z`;
  }

  return (
    <div className="flex flex-col h-full clay-card overflow-hidden">
      {/* Pane Header */}
      <div className="px-5 py-3 border-b border-white/10 bg-panel/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-fork/10 border border-emerald-fork/30 flex items-center justify-center">
            <GitFork className="w-4 h-4 text-emerald-fork" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-wider text-slate-100 flex items-center gap-2">
              SCREEN C // RECOVERY FORK EXPLORER
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-fork/15 text-emerald-fork border border-emerald-fork/30">
                POTENTIAL OUTCOMES E[Y(a)|H_t]
              </span>
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Continuous-Time Trajectory Forecast & Doubly Robust Counterfactual Forks
            </p>
          </div>
        </div>

        {/* Feature Selector Tabs */}
        <div className="flex items-center gap-1 bg-[#090D1A] p-1 rounded-lg border border-white/10">
          {CLINICAL_FEATURES.map((f) => (
            <button
              key={f.key}
              onClick={() => onSelectFeature(f.key as FeatureKey)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                selectedFeature === f.key
                  ? "bg-cyan-clinical text-slate-950 font-bold shadow-glow-cyan"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {f.key}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Chart Canvas */}
      <div className="p-4 bg-gradient-to-b from-[#090E1C]/80 to-[#070A12] border-b border-white/10 relative">
        {/* Metric Label & Clinical Ranges */}
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-200">
              {featureMeta.label} ({featureMeta.unit})
            </span>
            <span className="text-[11px] text-slate-400">
              Reference Range: {featureMeta.normalMin} - {featureMeta.normalMax} {featureMeta.unit}
            </span>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-clinical" />
              <span className="text-slate-300">Observed History</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-cyan-clinical/20 border border-cyan-clinical/40 rounded-sm" />
              <span className="text-slate-300">90% Conformal Fan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#FFB800] border-b border-dashed border-[#FFB800]" />
              <span className="text-amber-breach">Scenario A (Routine)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-fork" />
              <span className="text-emerald-fork">Scenario B (Early Rev)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-clinical" />
              <span className="text-cyan-clinical">Scenario C (Tele-Mon)</span>
            </div>
          </div>
        </div>

        {/* High Precision SVG */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[700px] select-none"
          >
            {/* Grid Lines across 168h horizon */}
            {[0, 24, 48, 72, 96, 120, 144, 168].map((t) => {
              const x = scaleX(t);
              return (
                <g key={t}>
                  <line
                    x1={x}
                    y1={padT}
                    x2={x}
                    y2={svgHeight - padB}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={x}
                    y={svgHeight - padB + 16}
                    fill="#64748B"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {t}h
                  </text>
                </g>
              );
            })}

            {/* Y-axis Ticks */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const val = chartData.minY + pct * (chartData.maxY - chartData.minY);
              const y = scaleY(val);
              return (
                <g key={pct}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={svgWidth - padR}
                    y2={y}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <text
                    x={padL - 8}
                    y={y + 3}
                    fill="#64748B"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Reference Normal Range Band */}
            {featureMeta.normalMin && featureMeta.normalMax && (
              <rect
                x={padL}
                y={scaleY(featureMeta.normalMax)}
                width={svgWidth - padL - padR}
                height={Math.abs(scaleY(featureMeta.normalMin) - scaleY(featureMeta.normalMax))}
                fill="rgba(16, 185, 129, 0.05)"
                stroke="rgba(16, 185, 129, 0.2)"
                strokeDasharray="3 3"
              />
            )}

            {/* 90% Adaptive Conformal Interval Fan */}
            {conformalFanPath && (
              <path
                d={conformalFanPath}
                fill="rgba(0, 240, 255, 0.12)"
                stroke="rgba(0, 240, 255, 0.35)"
                strokeWidth="1"
              />
            )}

            {/* Deviation Events (Vertical Red/Amber Markers) */}
            {patient.deviation_events.map((dev, idx) => {
              const xDev = scaleX(dev.t_deviation);
              return (
                <g key={idx}>
                  <line
                    x1={xDev}
                    y1={padT}
                    x2={xDev}
                    y2={svgHeight - padB}
                    stroke="#EF4444"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  <circle cx={xDev} cy={padT + 8} r="4" fill="#EF4444" />
                  <text
                    x={xDev + 6}
                    y={padT + 12}
                    fill="#EF4444"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    BREACH: {dev.feature_name} ({dev.t_deviation.toFixed(1)}h)
                  </text>
                </g>
              );
            })}

            {/* Intervention Timestamp Marker (t0) */}
            <g>
              <line
                x1={scaleX(interventionTime)}
                y1={padT}
                x2={scaleX(interventionTime)}
                y2={svgHeight - padB}
                stroke="#10B981"
                strokeWidth="2"
              />
              <rect
                x={scaleX(interventionTime) - 24}
                y={svgHeight - padB - 20}
                width="48"
                height="16"
                rx="3"
                fill="#10B981"
              />
              <text
                x={scaleX(interventionTime)}
                y={svgHeight - padB - 9}
                fill="#070A12"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                t₀: {interventionTime.toFixed(0)}h
              </text>
            </g>

            {/* Solid Observed Trajectory Line (Cyan #00F0FF) */}
            {observedPath && (
              <path
                d={observedPath}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data Points */}
            {chartData.histPoints.map((pt, i) => (
              <circle
                key={i}
                cx={scaleX(pt.t)}
                cy={scaleY(pt.v)}
                r="2.5"
                fill="#00F0FF"
              />
            ))}

            {/* Branched Counterfactual Scenario Curves */}
            {simulation &&
              simulation.scenarios.map((s) => {
                if (!activeScenarios[s.scenario_id]) return null;
                const strokeColor =
                  s.scenario_id === "A"
                    ? "#FFB800"
                    : s.scenario_id === "B"
                    ? "#10B981"
                    : "#00F0FF";

                const pts = s.trajectory
                  .filter((tp) => tp.values[selectedFeature] !== undefined)
                  .map((tp) => ({ t: tp.t, v: tp.values[selectedFeature] }));

                if (pts.length === 0) return null;

                const pathString = pts.reduce((acc, pt, i) => {
                  const x = scaleX(pt.t);
                  const y = scaleY(pt.v);
                  return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, "");

                return (
                  <path
                    key={s.scenario_id}
                    d={pathString}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeDasharray={s.scenario_id === "A" ? "4 3" : "none"}
                    strokeLinecap="round"
                  />
                );
              })}
          </svg>
        </div>
      </div>

      {/* Interactive Intervention Time-Scrubber Strip */}
      <div className="px-5 py-3 border-b border-white/10 bg-[#090D1B] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <Sliders className="w-4 h-4 text-cyan-clinical shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1">
              <span>Counterfactual Fork Timestamp (t₀)</span>
              <span className="text-cyan-clinical font-bold">
                {interventionTime.toFixed(1)}h post-ICU (Drag & release to simulate)
              </span>
            </div>
            <input
              type="range"
              min="12"
              max="144"
              step="1"
              value={interventionTime}
              onChange={(e) => onChangeInterventionTime(parseFloat(e.target.value))}
              onMouseUp={onRunSimulation}
              onTouchEnd={onRunSimulation}
              className="w-full accent-cyan-clinical bg-white/10 h-2 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-fork to-cyan-clinical text-slate-950 font-mono font-bold text-xs hover:opacity-95 transition-all shadow-glow-emerald disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`}
          />
          <span>{isSimulating ? "RE-PROJECTING ODE..." : "RE-EVALUATE FORKS"}</span>
        </button>
      </div>

      {/* Scenario Comparison Cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-y-auto">
        {simulation ? (
          simulation.scenarios.map((s) => {
            const isSupported = s.evidence_label.startsWith("EMPIRICALLY");
            const isExpanded = expandedAssumptions === s.scenario_id;
            const isToggled = activeScenarios[s.scenario_id];

            const themeColor =
              s.scenario_id === "A"
                ? "border-amber-breach/40 text-amber-breach"
                : s.scenario_id === "B"
                ? "border-emerald-fork/40 text-emerald-fork"
                : "border-cyan-clinical/40 text-cyan-clinical";

            return (
              <div
                key={s.scenario_id}
                className={`clay-card p-3.5 flex flex-col justify-between transition-all border ${
                  isToggled ? "bg-panel/90" : "bg-panel/40 opacity-60"
                } ${
                  s.scenario_id === "A"
                    ? "hover:border-amber-breach/40"
                    : s.scenario_id === "B"
                    ? "hover:border-emerald-fork/40"
                    : "hover:border-cyan-clinical/40"
                }`}
              >
                <div>
                  {/* Card Header & Toggle */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {s.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${themeColor}`}
                        >
                          {s.scenario_id}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                        {s.label}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleScenario(s.scenario_id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                        isToggled
                          ? "bg-white/10 text-slate-200 border-white/20"
                          : "bg-transparent text-slate-500 border-white/5"
                      }`}
                    >
                      {isToggled ? "VISIBLE" : "HIDDEN"}
                    </button>
                  </div>

                  {/* Readmission Risk & Delta */}
                  <div className="grid grid-cols-2 gap-2 my-2.5 p-2 rounded-lg bg-panel-subtle/80 border border-white/5 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400">Readmission</span>
                      <div className="text-sm font-bold text-slate-100">
                        {(s.readmission_risk * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Risk Delta Δ</span>
                      <div
                        className={`text-sm font-bold flex items-center gap-0.5 ${
                          s.risk_reduction_delta > 0
                            ? "text-emerald-fork"
                            : "text-amber-breach"
                        }`}
                      >
                        {s.risk_reduction_delta > 0 ? (
                          <TrendingDown className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingUp className="w-3.5 h-3.5" />
                        )}
                        {(s.risk_reduction_delta * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Positivity Overlap & Evidence Quality Badge */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                      <span className="text-slate-400">Positivity Overlap P(A|H)</span>
                      <span
                        className={`font-semibold ${
                          isSupported ? "text-emerald-fork" : "text-amber-breach"
                        }`}
                      >
                        {(s.positivity_score * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSupported ? "bg-emerald-fork" : "bg-amber-breach"
                        }`}
                        style={{ width: `${Math.min(s.positivity_score * 100, 100)}%` }}
                      />
                    </div>

                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border ${
                        isSupported
                          ? "bg-emerald-fork/15 text-emerald-fork border-emerald-fork/30"
                          : "bg-amber-breach/15 text-amber-breach border-amber-breach/30"
                      }`}
                    >
                      {s.evidence_label}
                    </span>
                  </div>

                  {/* 7-Day Stability Index */}
                  <div className="text-[10px] font-mono text-slate-400 flex justify-between items-center">
                    <span>7-Day Stability Index:</span>
                    <span className="text-slate-200 font-bold">
                      {(s.stability_index_7d * 100).toFixed(0)} / 100
                    </span>
                  </div>
                </div>

                {/* Causal Assumptions Expandable Section */}
                <div className="mt-3 pt-2 border-t border-white/5">
                  <button
                    onClick={() =>
                      setExpandedAssumptions(isExpanded ? null : s.scenario_id)
                    }
                    className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 hover:text-cyan-clinical transition-colors"
                  >
                    <span>Causal Assumptions ({s.causal_assumptions.length})</span>
                    <HelpCircle className="w-3 h-3" />
                  </button>

                  {isExpanded && (
                    <div className="mt-2 p-2 rounded bg-black/40 border border-white/5 space-y-1">
                      {s.causal_assumptions.map((asm, idx) => (
                        <div
                          key={idx}
                          className="text-[9px] font-mono text-slate-300 flex items-start gap-1"
                        >
                          <span className="text-cyan-clinical font-bold">›</span>
                          <span>{asm}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 text-center py-6 text-xs font-mono text-slate-500">
            No counterfactual simulation loaded
          </div>
        )}
      </div>
    </div>
  );
}
