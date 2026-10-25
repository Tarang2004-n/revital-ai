"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OrganAttribution } from "@/types";
import { Heart, Activity, AlertOctagon, Info } from "lucide-react";

function CameraController() {
  const { camera, gl } = useThree();
  useEffect(() => {
    const controls = new ThreeOrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 3.5;
    controls.maxDistance = 7;
    controls.maxPolarAngle = Math.PI / 1.7;
    controls.minPolarAngle = Math.PI / 3;
    return () => controls.dispose();
  }, [camera, gl]);
  return null;
}

interface DigitalTwinProps {
  organAttribution: OrganAttribution | null;
  uncertaintyScore: number;
  activeDeviations: string[];
}

interface NodeData {
  id: string;
  name: string;
  system: "hemodynamic" | "renal" | "inflammatory" | "neurological";
  position: [number, number, number];
  baseRadius: number;
}

const ANATOMICAL_NODES: NodeData[] = [
  { id: "neuro", name: "Neurological (CNS)", system: "neurological", position: [0, 2.3, 0], baseRadius: 0.35 },
  { id: "pulm_l", name: "Pulmonary L", system: "inflammatory", position: [-0.9, 1.3, 0], baseRadius: 0.38 },
  { id: "pulm_r", name: "Pulmonary R", system: "inflammatory", position: [0.9, 1.3, 0], baseRadius: 0.38 },
  { id: "cardio", name: "Cardiovascular Core", system: "hemodynamic", position: [0, 0.9, 0.3], baseRadius: 0.48 },
  { id: "hepatic", name: "Hepatic Matrix", system: "inflammatory", position: [0.85, 0.05, 0.1], baseRadius: 0.4 },
  { id: "renal_l", name: "Renal System L", system: "renal", position: [-0.75, -0.7, -0.1], baseRadius: 0.34 },
  { id: "renal_r", name: "Renal System R", system: "renal", position: [0.75, -0.7, -0.1], baseRadius: 0.34 },
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

function ProceduralOrganNode({
  node,
  attributionWeight,
  uncertaintyScore,
  onHover,
}: {
  node: NodeData;
  attributionWeight: number;
  uncertaintyScore: number;
  onHover: (node: NodeData | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Derive dynamic color and pulse speed based on attribution and uncertainty
  const isElevated = attributionWeight > 0.4;
  const targetColor = useMemo(() => {
    if (node.system === "hemodynamic") {
      return isElevated ? new THREE.Color("#FF3366") : new THREE.Color("#00F0FF");
    }
    if (node.system === "renal") {
      return isElevated ? new THREE.Color("#FFB800") : new THREE.Color("#38BDF8");
    }
    if (node.system === "inflammatory") {
      return isElevated ? new THREE.Color("#F43F5E") : new THREE.Color("#10B981");
    }
    return new THREE.Color("#A855F7");
  }, [node.system, isElevated]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Pulse frequency scales with attribution weight (0.5 to 4 Hz)
    const frequency = 1.5 + attributionWeight * 4.5;
    const pulse = Math.sin(t * frequency) * 0.12 * (1 + uncertaintyScore);

    if (meshRef.current) {
      const scale = 1 + pulse;
      meshRef.current.scale.set(scale, scale, scale);
    }

    if (glowRef.current) {
      const glowScale = 1.35 + pulse * 1.8;
      glowRef.current.scale.set(glowScale, glowScale, glowScale);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.2 + (attributionWeight * 0.5) + Math.sin(t * frequency) * 0.15;
      }
    }
  });

  return (
    <group position={node.position}>
      {/* Outer Halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[node.baseRadius, 16, 16]} />
        <meshBasicMaterial
          color={targetColor}
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>

      {/* Core Anatomical Node */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node);
        }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[node.baseRadius, 32, 32]} />
        <meshStandardMaterial
          color={targetColor}
          emissive={targetColor}
          emissiveIntensity={0.6 + attributionWeight * 1.8}
          roughness={0.2}
          metalness={0.8}
          wireframe={uncertaintyScore > 0.6}
        />
      </mesh>
    </group>
  );
}

function VascularSpline({
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
    mid.z += 0.25; // Slight forward arch for 3D depth
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
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.5}
        linewidth={2}
      />
    </line>
  );
}

export function DigitalTwin3D({
  organAttribution,
  uncertaintyScore,
  activeDeviations,
}: DigitalTwinProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nodeMap = useMemo(() => {
    const map = new Map<string, NodeData>();
    ANATOMICAL_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  const getAttribution = (system: string) => {
    if (!organAttribution) return 0.33;
    if (system === "hemodynamic") return organAttribution.hemodynamic;
    if (system === "renal") return organAttribution.renal;
    if (system === "inflammatory") return organAttribution.inflammatory;
    return 0.2;
  };

  if (!mounted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-panel/40 backdrop-blur-md rounded-xl border border-white/10 p-6">
        <Activity className="w-8 h-8 text-cyan-clinical animate-spin" />
        <span className="text-xs font-mono text-slate-400 mt-3">
          Synthesizing 3D Anatomical Twin...
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col clay-card overflow-hidden">
      {/* Pane Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-panel/70 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-cyan-clinical" />
          <h2 className="text-xs font-mono font-bold tracking-wider text-slate-200">
            SCREEN B // 3D PHYSIOLOGICAL TWIN
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
            UNC: {(uncertaintyScore * 100).toFixed(0)}%
          </span>
          {activeDeviations.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-amber-breach/20 text-amber-breach border border-amber-breach/40 flex items-center gap-1">
              <AlertOctagon className="w-2.5 h-2.5" />
              {activeDeviations.length} Active
            </span>
          )}
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div className="flex-1 w-full relative min-h-[360px]">
        <Canvas
          camera={{ position: [0, 0.8, 5.2], fov: 45 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <color attach="background" args={["#070A12"]} />
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <pointLight position={[-10, -5, -10]} intensity={0.5} color="#00F0FF" />

          {/* Procedural Organ Nodes */}
          {ANATOMICAL_NODES.map((node) => (
            <ProceduralOrganNode
              key={node.id}
              node={node}
              attributionWeight={getAttribution(node.system)}
              uncertaintyScore={uncertaintyScore}
              onHover={setHoveredNode}
            />
          ))}

          {/* Vascular Spline Network */}
          {VASCULAR_CONNECTIONS.map(([startId, endId], idx) => {
            const startNode = nodeMap.get(startId);
            const endNode = nodeMap.get(endId);
            if (!startNode || !endNode) return null;
            const avgAttr =
              (getAttribution(startNode.system) + getAttribution(endNode.system)) / 2;
            const color = avgAttr > 0.4 ? "#FFB800" : "#00F0FF";

            return (
              <VascularSpline
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
                  Interact & rotate 3D twin to audit organ stress
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
