"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CpuModel, type UpgradeLevels } from "@/components/cpu/CpuModel";
import { useTheme } from "@/lib/theme";
import { getEraProgress } from "@/data/eras";
import type { GameState } from "@/types/game";

interface CpuVisualProps {
  state: GameState;
  levels: UpgradeLevels;
  cpuLevel: number;
  upgradeFlash: number;
  /** Full-viewport immersive stage (default game screen) */
  immersive?: boolean;
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
      <ambientLight intensity={theme === "light" ? 1.35 : 1.15} />
      <hemisphereLight
        args={[
          theme === "light" ? "#ffffff" : "#e2e8f0",
          theme === "light" ? "#cbd5e1" : "#334155",
          theme === "light" ? 1.1 : 0.95,
        ]}
      />
      <directionalLight position={[3.5, 6, 4]} intensity={theme === "light" ? 2.4 : 2.1} />
      <directionalLight
        position={[-4, 3.5, 2]}
        intensity={1.2}
        color={theme === "light" ? "#fff7ed" : "#e0f2fe"}
      />
      <directionalLight position={[0, 2.5, -4]} intensity={1.35} color="#fff1c9" />
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

export function CpuVisual({
  state,
  levels,
  cpuLevel,
  upgradeFlash,
  immersive = false,
}: CpuVisualProps) {
  const { theme } = useTheme();
  const { era, next, progress } = getEraProgress(state);

  if (immersive) {
    return (
      <div className="relative h-full w-full">
        <div
          key={upgradeFlash}
          className="pointer-events-none absolute inset-0 z-20 animate-upgrade-flash bg-accent/10"
        />
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [2.35, 1.85, 2.7], fov: 38, near: 0.1, far: 40 }}
          gl={{ antialias: true, alpha: true, toneMappingExposure: 1.35 }}
          className="h-full w-full touch-none cursor-grab active:cursor-grabbing"
        >
          <Scene levels={levels} upgradeFlash={upgradeFlash} theme={theme} />
        </Canvas>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background via-background/70 to-transparent px-4 pb-6 pt-16 text-center sm:pb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
            Build Level {cpuLevel}
          </p>
          <p className="mt-1 font-mono text-sm text-accent-text sm:text-base">
            {era.name}
            {next ? (
              <span className="text-muted">
                {" "}
                → {next.name} · {Math.round(progress * 100)}%
              </span>
            ) : null}
          </p>
          <p className="mx-auto mt-2 hidden max-w-md text-[11px] text-muted sm:block">
            Drag to rotate · Scroll to zoom · Right-drag to pan
          </p>
        </div>
      </div>
    );
  }

  // Legacy card layout (unused on main screen, kept for safety)
  return (
    <div className="relative flex h-80 flex-col overflow-hidden rounded-2xl border border-edge bg-panel">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [2.2, 1.7, 2.5], fov: 40, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: true, toneMappingExposure: 1.35 }}
        className="h-full w-full"
      >
        <Scene levels={levels} upgradeFlash={upgradeFlash} theme={theme} />
      </Canvas>
    </div>
  );
}
