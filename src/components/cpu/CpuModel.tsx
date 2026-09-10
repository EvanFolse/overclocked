"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { UpgradeId } from "@/types/game";
import { getCoreCount } from "@/data/upgrades";

export type UpgradeLevels = Record<UpgradeId, number>;

interface CpuModelProps {
  levels: UpgradeLevels;
  upgradeFlash: number;
}

const MATERIALS = {
  substrate: "#24965a",
  solderMask: "#156b3d",
  ihs: "#d5dbe3",
  die: "#3a3148",
  cu: "#7c3aed", // violet — control unit
  alu: "#2563eb", // blue — ALU
  registers: "#059669", // green — registers
  cache: "#c47a3a", // copper cache
  core: "#5b8fd4",
  brand: "#1f2937",
  goldPin: "#e6b422",
  capBody: "#d2b48c",
  capEnd: "#d0d7e0",
  coolerCopper: "#d08945",
  coolerFin: "#c2cad6",
  coolerFan: "#1a1d24",
  coolerRadiator: "#3a4250",
  tube: "#3b82f6",
  bus: "#f59e0b", // amber traces / buses
} as const;

function PinGrid({ size, density }: { size: number; density: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = density * density;

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const half = (size * 0.78) / 2;
    let i = 0;
    for (let row = 0; row < density; row++) {
      for (let col = 0; col < density; col++) {
        const x = -half + (col / Math.max(density - 1, 1)) * half * 2;
        const z = -half + (row / Math.max(density - 1, 1)) * half * 2;
        dummy.position.set(x, -0.085, z);
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [size, density]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.028, 0.07, 0.028]} />
      <meshStandardMaterial color={MATERIALS.goldPin} metalness={0.85} roughness={0.35} />
    </instancedMesh>
  );
}

function TinyCaps({ packageSize }: { packageSize: number }) {
  const edge = packageSize * 0.42;
  const spots = useMemo(() => {
    const list: [number, number][] = [];
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      list.push([i * 0.14, edge]);
      list.push([i * 0.14, -edge]);
      list.push([edge, i * 0.14]);
      list.push([-edge, i * 0.14]);
    }
    return list;
  }, [edge]);

  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0.09, z]}>
          <mesh>
            <boxGeometry args={[0.055, 0.035, 0.04]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? "#2d3340" : MATERIALS.capBody}
              metalness={0.15}
              roughness={0.55}
            />
          </mesh>
          <mesh position={[0.028, 0, 0]}>
            <boxGeometry args={[0.012, 0.038, 0.042]} />
            <meshStandardMaterial color={MATERIALS.capEnd} metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[-0.028, 0, 0]}>
            <boxGeometry args={[0.012, 0.038, 0.042]} />
            <meshStandardMaterial color={MATERIALS.capEnd} metalness={0.9} roughness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CompactCooler({ level, packageSize }: { level: number; packageSize: number }) {
  if (level <= 0) return null;
  const width = packageSize * 0.95;
  const fins = 5 + Math.min(level, 5);
  const height = 0.28 + Math.min(level, 6) * 0.07;
  const liquid = level >= 3;

  return (
    <group position={[0, 0.22, 0]}>
      <mesh>
        <boxGeometry args={[width * 0.92, 0.06, width * 0.92]} />
        <meshStandardMaterial color={MATERIALS.coolerCopper} metalness={0.7} roughness={0.35} />
      </mesh>
      {Array.from({ length: fins }).map((_, i) => {
        const z = -width * 0.38 + (i / Math.max(fins - 1, 1)) * width * 0.76;
        return (
          <mesh key={i} position={[0, 0.05 + height / 2, z]}>
            <boxGeometry args={[width * 0.88, height, 0.022]} />
            <meshStandardMaterial color={MATERIALS.coolerFin} metalness={0.65} roughness={0.38} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.08 + height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[width * 0.32, width * 0.32, 0.06, 24]} />
        <meshStandardMaterial color={MATERIALS.coolerFan} metalness={0.2} roughness={0.65} />
      </mesh>
      {liquid && (
        <group position={[width * 0.85, height * 0.35, 0]}>
          <mesh>
            <boxGeometry args={[0.22, height * 1.1, width * 0.75]} />
            <meshStandardMaterial
              color={MATERIALS.coolerRadiator}
              metalness={0.7}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[-0.35, -height * 0.2, 0.18]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 0.55, 10]} />
            <meshStandardMaterial color={MATERIALS.tube} metalness={0.2} roughness={0.5} />
          </mesh>
          <mesh position={[-0.35, -height * 0.2, -0.18]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 0.55, 10]} />
            <meshStandardMaterial color={MATERIALS.tube} metalness={0.2} roughness={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/** On-die functional blocks: CU, ALU, Registers (+ cache ring, cores) */
function DieBlocks({
  levels,
  dieSize,
  showDetail,
}: {
  levels: UpgradeLevels;
  dieSize: number;
  showDetail: boolean;
}) {
  if (!showDetail) return null;

  const cuScale = 0.55 + Math.min(levels.controlUnit, 8) * 0.04;
  const aluScale = 0.55 + Math.min(levels.alu, 8) * 0.04;
  const regScale = 0.4 + Math.min(levels.registers, 8) * 0.035;
  const busLevel = levels.buses;

  const coreTotal = getCoreCount(levels.cores);
  const grid = Math.ceil(Math.sqrt(Math.min(coreTotal, 25)));
  const shownCores = Math.min(coreTotal, grid * grid);
  const coreSpacing = (dieSize * 0.35) / Math.max(grid - 1, 1);
  const coreStart = dieSize * 0.12;

  return (
    <group position={[0, 0.17, 0]}>
      <mesh>
        <boxGeometry args={[dieSize, 0.04, dieSize]} />
        <meshStandardMaterial color={MATERIALS.die} metalness={0.55} roughness={0.3} />
      </mesh>

      {/* Control Unit — top */}
      <mesh position={[0, 0.03, -dieSize * 0.28]} scale={[cuScale, 1, cuScale]}>
        <boxGeometry args={[dieSize * 0.55, 0.035, dieSize * 0.22]} />
        <meshStandardMaterial
          color={MATERIALS.cu}
          emissive={MATERIALS.cu}
          emissiveIntensity={0.2 + levels.controlUnit * 0.03}
          metalness={0.4}
          roughness={0.35}
        />
      </mesh>

      {/* ALU — bottom-left */}
      <mesh position={[-dieSize * 0.22, 0.03, dieSize * 0.2]} scale={[aluScale, 1, aluScale]}>
        <boxGeometry args={[dieSize * 0.32, 0.035, dieSize * 0.32]} />
        <meshStandardMaterial
          color={MATERIALS.alu}
          emissive={MATERIALS.alu}
          emissiveIntensity={0.2 + levels.alu * 0.03}
          metalness={0.4}
          roughness={0.35}
        />
      </mesh>

      {/* Registers — bottom-right */}
      <mesh position={[dieSize * 0.22, 0.03, dieSize * 0.2]} scale={[regScale, 1, 1]}>
        <boxGeometry args={[dieSize * 0.28, 0.03, dieSize * 0.28]} />
        <meshStandardMaterial
          color={MATERIALS.registers}
          emissive={MATERIALS.registers}
          emissiveIntensity={0.18 + levels.registers * 0.03}
          metalness={0.35}
          roughness={0.4}
        />
      </mesh>

      {/* Cache ring */}
      {levels.cache > 0 && (
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry
            args={[
              dieSize + 0.06 + levels.cache * 0.01,
              0.01,
              dieSize + 0.06 + levels.cache * 0.01,
            ]}
          />
          <meshStandardMaterial
            color={MATERIALS.cache}
            metalness={0.8}
            roughness={0.3}
            emissive={MATERIALS.cache}
            emissiveIntensity={0.1 + levels.cache * 0.02}
          />
        </mesh>
      )}

      {/* Bus traces */}
      {busLevel > 0 &&
        Array.from({ length: Math.min(6, 2 + busLevel) }).map((_, i) => (
          <mesh
            key={`bus-${i}`}
            position={[
              -dieSize * 0.4 + (i / Math.max(Math.min(6, 2 + busLevel) - 1, 1)) * dieSize * 0.8,
              0.025,
              0,
            ]}
          >
            <boxGeometry args={[0.018, 0.012, dieSize * 0.85]} />
            <meshStandardMaterial
              color={MATERIALS.bus}
              emissive={MATERIALS.bus}
              emissiveIntensity={0.15}
              metalness={0.7}
              roughness={0.35}
            />
          </mesh>
        ))}

      {/* Cores cluster */}
      {levels.cores > 0 &&
        Array.from({ length: shownCores }).map((_, i) => {
          const row = Math.floor(i / grid);
          const col = i % grid;
          return (
            <mesh
              key={i}
              position={[
                coreStart + col * coreSpacing - dieSize * 0.05,
                0.04,
                -dieSize * 0.02 + row * coreSpacing,
              ]}
            >
              <boxGeometry args={[0.055, 0.02, 0.055]} />
              <meshStandardMaterial
                color={MATERIALS.core}
                emissive={MATERIALS.core}
                emissiveIntensity={0.3 + levels.clock * 0.03}
                metalness={0.5}
                roughness={0.3}
              />
            </mesh>
          );
        })}
    </group>
  );
}

export function CpuModel({ levels, upgradeFlash }: CpuModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dieLightRef = useRef<THREE.PointLight>(null);
  const flashRef = useRef(0);

  const total = Object.values(levels).reduce((a, b) => a + b, 0);
  const baseScale = Math.min(1.55, 1 + total * 0.008 + levels.cores * 0.01);
  const packageSize =
    1.35 + Math.min(levels.cores, 12) * 0.015 + Math.min(levels.generation, 8) * 0.02;
  const dieSize =
    0.62 + Math.min(levels.cache, 10) * 0.015 + Math.min(levels.isa, 6) * 0.01;
  const pinDensity = Math.min(18, 10 + levels.socket + Math.floor(levels.cores / 2));
  const ihsColor = levels.generation >= 5 ? "#d7c49a" : MATERIALS.ihs;
  const showDetail = levels.cooling < 2;

  useFrame((_, delta) => {
    if (groupRef.current && upgradeFlash > flashRef.current) {
      flashRef.current = upgradeFlash;
      groupRef.current.scale.setScalar(baseScale * 1.06);
    }
    if (groupRef.current) {
      const current = groupRef.current.scale.x;
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(current, baseScale, delta * 4));
    }
    if (dieLightRef.current) {
      const pulse = Math.sin(performance.now() * (0.003 + levels.clock * 0.0006)) * 0.1;
      dieLightRef.current.intensity = 0.75 + levels.clock * 0.05 + pulse;
    }
  });

  const ihs = packageSize * 0.88;

  return (
    <group ref={groupRef} rotation={[-0.42, 0.6, 0.08]}>
      <mesh receiveShadow>
        <boxGeometry args={[packageSize, 0.1, packageSize]} />
        <meshStandardMaterial color={MATERIALS.substrate} metalness={0.08} roughness={0.78} />
      </mesh>

      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[packageSize * 0.98, 0.02, packageSize * 0.98]} />
        <meshStandardMaterial color={MATERIALS.solderMask} metalness={0.2} roughness={0.65} />
      </mesh>

      <mesh position={[0, 0.095, 0]}>
        <boxGeometry args={[ihs, 0.085, ihs]} />
        <meshStandardMaterial color={ihsColor} metalness={0.72} roughness={0.32} />
      </mesh>

      <mesh position={[0, 0.145, 0]}>
        <boxGeometry args={[ihs * 0.94, 0.012, ihs * 0.94]} />
        <meshStandardMaterial color="#e8eef4" metalness={0.78} roughness={0.22} />
      </mesh>

      <mesh position={[0, 0.155, -ihs * 0.28]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ihs * 0.35, 0.08]} />
        <meshStandardMaterial
          color={MATERIALS.brand}
          metalness={0.35}
          roughness={0.55}
          transparent
          opacity={0.9}
        />
      </mesh>

      <TinyCaps packageSize={packageSize} />
      <DieBlocks levels={levels} dieSize={dieSize} showDetail={showDetail} />
      <PinGrid size={packageSize} density={pinDensity} />
      <CompactCooler level={levels.cooling} packageSize={packageSize} />

      <pointLight
        ref={dieLightRef}
        position={[0, 0.7, 0.35]}
        color="#fff6df"
        intensity={0.9}
        distance={4}
        decay={2}
      />
      <pointLight position={[0.6, 0.4, 0.8]} color="#ffffff" intensity={0.55} distance={3} decay={2} />
      <pointLight position={[0, -0.45, 0]} color="#ffe6a0" intensity={0.7} distance={2.4} decay={2} />
    </group>
  );
}
