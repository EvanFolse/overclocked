"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { formatMoney } from "@/lib/format";
import { CpuModel, type UpgradeLevels } from "@/components/cpu/CpuModel";
import { useTheme } from "@/lib/theme";
import { UPGRADES } from "@/data/upgrades";
import { getEraProgress } from "@/data/eras";
import type { GameState } from "@/types/game";

interface CpuVisualProps {
  state: GameState;
  levels: UpgradeLevels;
  cpuLevel: number;
  incomePerSecond: number;
  pulse: number;
  upgradeFlash: number;
}

function InteractiveControls() {
  const controls = useRef<OrbitControlsImpl>(null);
  const spinning = useRef(true);
  const resumeAt = useRef(0);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    if (!spinning.current || Date.now() < resumeAt.current) return;
    c.setAzimuthalAngle(c.getAzimuthalAngle() + delta * 0.28);
    c.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan
      enableZoom
      enableRotate
      minDistance={1.4}
      maxDistance={6}
      maxPolarAngle={Math.PI * 0.48}
      minPolarAngle={0.15}
      target={[0, 0.05, 0]}
      dampingFactor={0.08}
      enableDamping
      onStart={() => {
        spinning.current = false;
        resumeAt.current = Number.POSITIVE_INFINITY;
      }}
      onEnd={() => {
        resumeAt.current = Date.now() + 2200;
        spinning.current = true;
      }}
    />
  );
}

function Scene({
  levels,
  upgradeFlash,
  theme,
}: {
  levels: UpgradeLevels;
  upgradeFlash: number;
  theme: "light" | "dark";
}) {
  const bg = theme === "light" ? "#e8eef5" : "#0b1220";

  return (
    <>
      <color attach="background" args={[bg]} />

      {/* Bright studio-style fill — metals need ambient + env or they read black */}
      <ambientLight intensity={theme === "light" ? 1.35 : 1.15} />
      <hemisphereLight
        args={[
          theme === "light" ? "#ffffff" : "#e2e8f0",
          theme === "light" ? "#cbd5e1" : "#334155",
          theme === "light" ? 1.1 : 0.95,
        ]}
      />

      {/* Key light — no castShadow so the chip doesn't self-shadow into darkness */}
      <directionalLight position={[3.5, 6, 4]} intensity={theme === "light" ? 2.4 : 2.1} />
      {/* Soft fill from camera-left */}
      <directionalLight
        position={[-4, 3.5, 2]}
        intensity={1.2}
        color={theme === "light" ? "#fff7ed" : "#e0f2fe"}
      />
      {/* Rim / backlight to lift edges and gold pins */}
      <directionalLight position={[0, 2.5, -4]} intensity={1.35} color="#fff1c9" />
      {/* Under-fill so the gold pin field isn't in a cave */}
      <directionalLight position={[0, -3, 1]} intensity={0.85} color="#ffe9a8" />

      <Suspense
        fallback={
          <mesh>
            <boxGeometry args={[1.5, 0.2, 1.5]} />
            <meshStandardMaterial color="#22d3ee" wireframe />
          </mesh>
        }
      >
        <Environment preset="studio" environmentIntensity={theme === "light" ? 0.85 : 0.7} />
        <CpuModel levels={levels} upgradeFlash={upgradeFlash} />
        <ContactShadows
          position={[0, -0.2, 0]}
          opacity={theme === "light" ? 0.18 : 0.28}
          scale={5}
          blur={3.2}
          far={2.5}
          color="#000000"
        />
      </Suspense>

      <InteractiveControls />
    </>
  );
}

function buildSpecSummary(levels: UpgradeLevels): string {
  const parts = UPGRADES.filter((u) => (levels[u.id] ?? 0) > 0 || !u.requiresUnlock)
    .slice(0, 4)
    .map((u) => u.formatSpec(levels[u.id] ?? 0));
  return parts.join(" · ");
}

export function CpuVisual({
  state,
  levels,
  cpuLevel,
  incomePerSecond,
  pulse,
  upgradeFlash,
}: CpuVisualProps) {
  const { theme } = useTheme();
  const { era, next, progress } = getEraProgress(state);

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-edge bg-panel shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div
        key={upgradeFlash}
        className="pointer-events-none absolute inset-0 z-20 animate-upgrade-flash bg-accent/10"
      />

      <div className="relative z-10 flex items-center justify-between gap-2 px-4 pt-4 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-text">
          {era.year} · {era.name}
        </p>
        <p className="hidden font-mono text-[10px] text-muted sm:block">
          Drag to rotate · Scroll to zoom · Right-drag to pan
        </p>
      </div>

      <div className="relative z-10 h-72 w-full touch-none sm:h-80 md:h-[26rem]">
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [2.2, 1.7, 2.5], fov: 40, near: 0.1, far: 40 }}
          gl={{ antialias: true, alpha: true, toneMappingExposure: 1.35 }}
          className="h-full w-full cursor-grab active:cursor-grabbing"
        >
          <Scene levels={levels} upgradeFlash={upgradeFlash} theme={theme} />
        </Canvas>
      </div>

      <p className="relative z-10 px-4 text-center font-mono text-[10px] text-muted sm:hidden">
        Drag to rotate · Pinch/scroll to zoom
      </p>

      <div className="relative z-10 px-4 pb-5 pt-2 text-center sm:px-6">
        <div key={pulse} className="mb-2 animate-money-pop font-mono text-sm text-success">
          +{formatMoney(incomePerSecond)}
        </div>
        <p className="font-mono text-2xl font-bold text-foreground sm:text-3xl">
          Build Level {cpuLevel}
        </p>
        <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-muted">{era.summary}</p>
        <p className="mx-auto mt-2 max-w-md font-mono text-[11px] text-accent-text">
          {buildSpecSummary(levels)}
        </p>
        {next && (
          <div className="mx-auto mt-3 max-w-sm">
            <div className="mb-1 flex justify-between font-mono text-[10px] text-muted">
              <span>Next: {next.name}</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-edge/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-success transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}
        <p className="mx-auto mt-3 max-w-md text-[10px] text-muted">
          Die map: <span className="text-violet-500">CU</span> ·{" "}
          <span className="text-blue-500">ALU</span> ·{" "}
          <span className="text-emerald-600">Registers</span> ·{" "}
          <span className="text-amber-600">Buses</span> · copper cache
        </p>
      </div>
    </div>
  );
}
