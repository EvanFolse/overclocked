"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CpuRank } from "@/lib/cpuRanks";

/** Layout unit. Fixed, so the parts stay inside the heat spreader even when upgrades enlarge the die. */
const U = 0.62;
const DIE_TOP = 0.19; // top face of the die slab in CpuModel
const IHS_TOP = 0.152; // top face of the heat-spreader plate, for parts that sit beside the die

const CORE_PARTS = [
    { id: "clock", color: "#D9A843" },
    { id: "cu", color: "#6A9ADA" },
    { id: "decoder", color: "#8190DA" },
    { id: "pc", color: "#D7709A" },
    { id: "registers", color: "#5FA987" },
    { id: "alu", color: "#9B82D0" },
    { id: "cache", color: "#E0883A" },
    { id: "biu", color: "#5BB5C4" },
] as const;

const PIPE_COLORS = ["#8FB3E8", "#9AA6E8", "#A99BE0", "#B98FD8", "#C985CF"];

const CACHE_STEPS = [
    { color: "#F0C060", h: 0.05 }, // L1
    { color: "#EBA843", h: 0.09 }, // L2
    { color: "#E08A2E", h: 0.13 }, // L3
];

const DURATION = 0.8; // 单个零件的动画时长（秒）
const DROP = 0.9; // 从多高落下

function Block({
    x,
    z,
    w,
    depth,
    h,
    color,
    delay = 0,
    instant = false,
}: {
    x: number;
    z: number;
    w: number;
    depth: number;
    h: number;
    color: string;
    delay?: number;
    instant?: boolean;
}) {
    const drop = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const t = useRef(instant ? 99 : 0);

    useFrame((_, dt) => {
        const g = drop.current;
        const m = mat.current;
        if (!g || !m) return;
        t.current += dt;
        const p = THREE.MathUtils.clamp((t.current - delay) / DURATION, 0, 1);
        g.visible = p > 0;
        if (p <= 0) return;
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const e = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); // easeOutBack
        g.scale.setScalar(Math.max(0.001, e));
        g.position.y = (1 - p) * DROP;
        m.emissiveIntensity = 0.22 + Math.pow(1 - p, 2) * 1.6; // 落地时"通电"发光
    });

    return (
        <group position={[x, 0, z]}>
            <group ref={drop} scale={0.001} visible={false}>
                <mesh position={[0, h / 2, 0]}>
                    <boxGeometry args={[w, h, depth]} />
                    <meshStandardMaterial
                        ref={mat}
                        color={color}
                        emissive={color}
                        emissiveIntensity={0.22}
                        metalness={0.3}
                        roughness={0.4}
                    />
                </mesh>
            </group>
        </group>
    );
}

export function RankParts({ rank, instant = false }: { rank: CpuRank; instant?: boolean }) {
    if (rank <= 0) return null;

    return (
        <>
            <group position={[0, DIE_TOP, 0]}>
                {CORE_PARTS.map((p, i) => (
                    <Block
                        key={p.id}
                        x={((i % 4) - 1.5) * U * 0.22}
                        z={-U * 0.2 + Math.floor(i / 4) * U * 0.25}
                        w={U * 0.19}
                        depth={U * 0.21}
                        h={0.05}
                        color={p.color}
                        delay={i * 0.18}
                        instant={instant}
                    />
                ))}

                {rank >= 2 &&
                    PIPE_COLORS.map((c, i) => (
                        <Block
                            key={`pipe-${i}`}
                            x={(i - 2) * U * 0.17}
                            z={U * 0.34}
                            w={U * 0.14}
                            depth={U * 0.09}
                            h={0.03}
                            color={c}
                            delay={i * 0.15}
                            instant={instant}
                        />
                    ))}
            </group>

            <group position={[0, IHS_TOP, 0]}>
                {rank >= 3 && (
                    <>
                        <Block x={-U * 0.66} z={-U * 0.12} w={U * 0.22} depth={U * 0.24} h={0.05} color="#5B8FD4" instant={instant} />
                        <Block x={-U * 0.66} z={U * 0.2} w={U * 0.22} depth={U * 0.24} h={0.05} color="#D9825F" delay={0.3} instant={instant} />
                    </>
                )}

                {rank >= 4 &&
                    CACHE_STEPS.map((s, i) => (
                        <Block
                            key={`cache-${i}`}
                            x={U * (0.62 + i * 0.11)}
                            z={-U * 0.05}
                            w={U * 0.1}
                            depth={U * 0.5}
                            h={s.h}
                            color={s.color}
                            delay={i * 0.3}
                            instant={instant}
                        />
                    ))}

                {rank >= 5 && (
                    <>
                        <Block x={-U * 0.7} z={-U * 0.52} w={U * 0.35} depth={U * 0.2} h={0.05} color="#E8903F" instant={instant} />
                        <Block x={-U * 0.1} z={-U * 0.62} w={U * 0.18} depth={U * 0.18} h={0.07} color="#4FBFB6" delay={0.35} instant={instant} />
                    </>
                )}
            </group>
        </>
    );
}