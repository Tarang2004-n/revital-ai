"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OrganAttribution, DeviationEvent } from "@/lib/api";
import { Heart, Activity, AlertOctagon, Info, ShieldAlert } from "lucide-react";

interface PhysiologicalTwinProps {
  organAttribution: OrganAttribution | null;
  uncertaintyScore: number;
  deviationEvents: DeviationEvent[];
}

interface AnatomicalNodeSpec {
  id: string;
  name: string;
  system: "hemodynamic" | "renal" | "inflammatory" | "neurological";
  position: [number, number, number];
  baseRadius: number;
}

const ANATOMICAL_NODES: AnatomicalNodeSpec[] = [
  { id: "neuro", name: "Neurological (CNS)", system: "neurological", position: [0, 2.3, 0], baseRadius: 0.35 },
  { id: "pulm_l", name: "Pulmonary Left", system: "inflammatory", position: [-0.9, 1.3, 0], baseRadius: 0.38 },
  { id: "pulm_r", name: "Pulmonary Right", system: "inflammatory", position: [0.9, 1.3, 0], baseRadius: 0.38 },
  { id: "cardio", name: "Cardiovascular Core", system: "hemodynamic", position: [0, 0.9, 0.3], baseRadius: 0.48 },
  { id: "hepatic", name: "Hepatic Matrix", system: "inflammatory", position: [0.85, 0.05, 0.1], baseRadius: 0.4 },
  { id: "renal_l", name: "Renal System Left", system: "renal", position: [-0.75, -0.7, -0.1], baseRadius: 0.34 },
  { id: "renal_r", name: "Renal System Right", system: "renal", position: [0.75, -0.7, -0.1], baseRadius: 0.34 },
];

const VASCULAR_CONNECTIONS: [string, string][] = [
  ["neuro", "cardio"],
  ["pulm_l", "cardio"],
  ["pulm_r", "cardio"],
  ["cardio", "hepatic"],
  ["cardio", "renal_l"],
  ["cardio", "renal_r"],
  ["hepatic", "renal_r"],
  ["renal_l", "renal_r"],
];

function CameraController() {
  const { camera, gl } = useThree();
  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 3.2;
    controls.maxDistance = 7.5;
    controls.maxPolarAngle = Math.PI / 1.7;
    controls.minPolarAngle = Math.PI / 3;
    return () => controls.dispose();
  }, [camera, gl]);
  return null;
}

function ProceduralAnatomicalNode({
  node,
  attributionWeight,
  hasBreach,
  uncertaintyScore,
  onHover,
}: {
  node: AnatomicalNodeSpec;
  attributionWeight: number;
  hasBreach: boolean;
  uncertaintyScore: number;
  onHover: (node: AnatomicalNodeSpec | null) => void;
}) {
  const coreRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  // Wireframe halo color:
  // #EF4444: conformal breach (active deviation in organ system)
  // #FFB800: elevated attribution (> 0.35)
  // #00F0FF: nominal
  const haloColor = useMemo(() => {
    if (hasBreach) return new THREE.Color("#EF4444");
    if (attributionWeight > 0.35) return new THREE.Color("#FFB800");
    return new THREE.Color("#00F0FF");
  }, [hasBreach, attributionWeight]);

  const coreColor = useMemo(() => {
    if (hasBreach) return new THREE.Color("#F43F5E");
    if (attributionWeight > 0.35) return new THREE.Color("#F59E0B");
    return new THREE.Color("#00F0FF");
  }, [hasBreach, attributionWeight]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Scale pulse frequency bound to organ attribution weight (1.5 Hz to 5.5 Hz)
    const frequency = 1.5 + attributionWeight * 4.0;
    const pulse = Math.sin(t * frequency) * 0.12 * (1 + uncertaintyScore);

    if (coreRef.current) {
      const s = 1 + pulse;
      coreRef.current.scale.set(s, s, s);
    }

    if (haloRef.current) {
      const hs = 1.35 + pulse * 1.5;
      haloRef.current.scale.set(hs, hs, hs);
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = hasBreach
          ? 0.4 + Math.sin(t * 6.0) * 0.25
          : 0.2 + attributionWeight * 0.4 + Math.sin(t * frequency) * 0.1;
      }
    }
  });

  return (
    <group position={node.position}>
      {/* Wireframe Halo */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[node.baseRadius, 16, 16]} />
        <meshBasicMaterial
          color={haloColor}
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>

      {/* Solid Anatomical Core */}
      <mesh
        ref={coreRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node);
        }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[node.baseRadius, 32, 32]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={0.6 + attributionWeight * 2.2 + (hasBreach ? 1.0 : 0.0)}
          roughness={0.25}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

function PulsingVascularSpline({
  start,
  end,
  pulseSpeed,
  color,
}: {
  start: [number, number, number];
  end: [number, number, number];
  pulseSpeed: number;
  color: string;
}) {
  const lineRef = useRef<THREE.Line>(null);

  const points = useMemo(() => {
    const p1 = new THREE.Vector3(...start);
    const p2 = new THREE.Vector3(...end);
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    mid.z += 0.22;
    const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
    return curve.getPoints(24);
  }, [start, end]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  useFrame(({ clock }) => {
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      if (mat) {
        const t = clock.getElapsedTime();
        mat.opacity = 0.35 + Math.sin(t * pulseSpeed) * 0.3;
      }
    }
  });

  return (
    // @ts-ignore
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.5} />
    </line>
  );
}

export function PhysiologicalTwin3D({
  organAttribution,
  uncertaintyScore,
  deviationEvents,
}: PhysiologicalTwinProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<AnatomicalNodeSpec | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nodeMap = useMemo(() => {
    const map = new Map<string, AnatomicalNodeSpec>();
    ANATOMICAL_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  const getAttribution = (system: string): number => {
    if (!organAttribution) return 0.33;
    if (system === "hemodynamic") return organAttribution.hemodynamic;
    if (system === "renal") return organAttribution.renal;
    if (system === "inflammatory") return organAttribution.inflammatory;
    return 0.15;
  };

  const hasSystemBreach = (system: string): boolean => {
    return deviationEvents.some(
      (d) => d.organ_system.toLowerCase() === system.toLowerCase()
    );
  };

  if (!mounted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center clay-card p-6 min-h-[400px]">
        <Activity className="w-8 h-8 text-cyan-clinical animate-spin mb-2" />
        <span className="text-xs font-mono text-slate-400">
          Synthesizing Procedural Anatomical Twin...
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col clay-card overflow-hidden">
      {/* Pane Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-panel/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-cyan-clinical" />
          <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200">
            SCREEN B // 3D PHYSIOLOGICAL DIGITAL TWIN
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
            UNC SCORE: {(uncertaintyScore * 100).toFixed(0)}%
          </span>
          {deviationEvents.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-rose-critical/20 text-rose-critical border border-rose-critical/40 flex items-center gap-1 font-bold">
              <ShieldAlert className="w-3 h-3" />
              {deviationEvents.length} BREACH{deviationEvents.length > 1 ? "ES" : ""}
            </span>
          )}
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div className="flex-1 w-full relative min-h-[350px]">
        <Canvas
          camera={{ position: [0, 0.8, 5.2], fov: 45 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <color attach="background" args={["#070A12"]} />
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <pointLight position={[-10, -5, -10]} intensity={0.6} color="#00F0FF" />

          {/* Anatomical Nodes */}
          {ANATOMICAL_NODES.map((node) => (
            <ProceduralAnatomicalNode
              key={node.id}
              node={node}
              attributionWeight={getAttribution(node.system)}
              hasBreach={hasSystemBreach(node.system)}
              uncertaintyScore={uncertaintyScore}
              onHover={setHoveredNode}
            />
          ))}

          {/* Vascular CatmullRom Splines */}
          {VASCULAR_CONNECTIONS.map(([startId, endId], idx) => {
            const startNode = nodeMap.get(startId);
            const endNode = nodeMap.get(endId);
            if (!startNode || !endNode) return null;
            const avgAttr =
              (getAttribution(startNode.system) + getAttribution(endNode.system)) / 2;
            const isBreached =
              hasSystemBreach(startNode.system) || hasSystemBreach(endNode.system);
            const color = isBreached
              ? "#EF4444"
              : avgAttr > 0.35
              ? "#FFB800"
              : "#00F0FF";

            return (
              <PulsingVascularSpline
                key={idx}
                start={startNode.position}
                end={endNode.position}
                pulseSpeed={2 + avgAttr * 4}
                color={color}
              />
            );
          })}

          <CameraController />
        </Canvas>

        {/* Hover / Inspection Card Overlay */}
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none z-10">
          <div className="clay-card p-3 bg-panel/90 border-white/10 text-xs font-mono">
            {hoveredNode ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-cyan-clinical">
                    {hoveredNode.name}
                  </span>
                  <div className="text-[10px] text-slate-400 capitalize">
                    System: {hoveredNode.system}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400">Attribution Weight:</span>
                  <div className="font-bold text-slate-200">
                    {(getAttribution(hoveredNode.system) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-clinical" />
                  Drag to rotate 3D twin • Halo indicates conformal status
                </span>
                <span className="text-[10px] text-slate-500">
                  ODE-Attribution Splines
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attribution Bars Footer */}
      {organAttribution && (
        <div className="p-3 border-t border-white/10 bg-panel-subtle/50 space-y-2">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex justify-between">
            <span>Organ System Attributions</span>
            <span>SHAP-Proxy Gradient</span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-300">Hemodynamic</span>
                <span className="text-cyan-clinical font-semibold">
                  {(organAttribution.hemodynamic * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-clinical transition-all duration-500 rounded-full"
                  style={{ width: `${organAttribution.hemodynamic * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-300">Renal</span>
                <span className="text-amber-breach font-semibold">
                  {(organAttribution.renal * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-breach transition-all duration-500 rounded-full"
                  style={{ width: `${organAttribution.renal * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-300">Inflammatory</span>
                <span className="text-emerald-fork font-semibold">
                  {(organAttribution.inflammatory * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-fork transition-all duration-500 rounded-full"
                  style={{ width: `${organAttribution.inflammatory * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
