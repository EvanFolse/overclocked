"use client";

import { useEffect, useRef, useState } from "react";
import { StageLayout } from "@/components/learning/StageLayout";
import type { UnlockInfo } from "@/lib/gameLogic";

interface UnlockCelebrationProps {
    info: UnlockInfo;
    /** Live CP balance. At this point the price and the reward are already applied. */
    money: number;
    onNext: () => void;
}

interface Particle {
    kind: "spark" | "coin";
    x: number;
    y: number;
    vx: number;
    vy: number;
    tx: number;
    ty: number;
    age: number;
    ttl: number;
    delay: number;
    size: number;
    color: string;
}

const FIREWORK_COLORS = ["#f87171", "#fb923c", "#facc15", "#a3e635", "#34d399", "#22d3ee", "#818cf8", "#e879f9"];

const TONES = {
    red: "border-red-500 text-red-500",
    success: "border-success text-success",
    violet: "border-violet text-violet",
    accent: "border-accent text-accent-text",
} as const;

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export function UnlockCelebration({ info, money, onNext }: UnlockCelebrationProps) {
    const { stageNumber, stageTitle, price, reward, next } = info;

    // The balance when this page opens (price and reward already applied). Frozen so that
    // idle income ticking during the animation does not change the story.
    const [finalCp] = useState(money);
    const startCp = finalCp + price - reward; // balance before the stage was bought
    const afterPriceCp = finalCp - reward; // balance after the price is deducted

    const [shown, setShown] = useState(0); // how many of the 4 rows are visible
    const [cp, setCp] = useState(startCp);
    const [done, setDone] = useState(false);

    const timersRef = useRef<number[]>([]);
    const tweenRef = useRef<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const rafRef = useRef<number | null>(null);
    const rewardRowRef = useRef<HTMLLIElement>(null);

    // ---------- CP counter tween ----------
    const tweenCp = (from: number, to: number, ms: number) => {
        if (tweenRef.current !== null) cancelAnimationFrame(tweenRef.current);
        const t0 = performance.now();
        const step = (now: number) => {
            const p = Math.min(1, (now - t0) / ms);
            const eased = 1 - Math.pow(1 - p, 3);
            setCp(from + (to - from) * eased);
            tweenRef.current = p < 1 ? requestAnimationFrame(step) : null;
        };
        tweenRef.current = requestAnimationFrame(step);
    };

    // ---------- Particles (fireworks and coins) ----------
    const draw = (dt: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        const alive: Particle[] = [];
        for (const p of particles.current) {
            if (p.delay > 0) {
                p.delay -= dt;
                alive.push(p);
                continue;
            }
            p.age += dt;
            const t = p.age / p.ttl;
            if (t >= 1) continue;

            if (p.kind === "spark") {
                p.vy += 260 * dt; // gravity
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                ctx.globalAlpha = 1 - t;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Coin: flies in an arc from the reward row to the CP counter
                const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                const x = p.x + (p.tx - p.x) * e;
                const y = p.y + (p.ty - p.y) * e - Math.sin(Math.PI * t) * 90;
                ctx.globalAlpha = t > 0.9 ? (1 - t) * 10 : 1;
                ctx.fillStyle = "#facc15";
                ctx.strokeStyle = "#ca8a04";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = "#fef08a";
                ctx.beginPath();
                ctx.arc(x - p.size * 0.3, y - p.size * 0.3, p.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
            alive.push(p);
        }
        ctx.globalAlpha = 1;
        particles.current = alive;
    };

    const startLoop = () => {
        if (rafRef.current !== null) return;
        let last = performance.now();
        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            draw(dt);
            rafRef.current = particles.current.length > 0 ? requestAnimationFrame(tick) : null;
        };
        rafRef.current = requestAnimationFrame(tick);
    };

    const burstFireworks = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        for (let b = 0; b < 3; b++) {
            const cx = w * (0.2 + Math.random() * 0.6);
            const cy = h * (0.15 + Math.random() * 0.3);
            const delay = b * 0.35;
            for (let i = 0; i < 56; i++) {
                const angle = (i / 56) * Math.PI * 2 + Math.random() * 0.2;
                const speed = 120 + Math.random() * 220;
                particles.current.push({
                    kind: "spark",
                    x: cx,
                    y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    tx: 0,
                    ty: 0,
                    age: 0,
                    ttl: 1.1 + Math.random() * 0.6,
                    delay,
                    size: 3 + Math.random() * 2,
                    color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)]!,
                });
            }
        }
        startLoop();
    };

    const burstCoins = () => {
        const rect = rewardRowRef.current?.getBoundingClientRect();
        const sx = rect ? rect.left + rect.width * 0.4 : window.innerWidth / 2;
        const sy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
        // Target: the CP counter in the top right corner of the header
        const tx = window.innerWidth - 120;
        const ty = 70;
        for (let i = 0; i < 18; i++) {
            particles.current.push({
                kind: "coin",
                x: sx + (Math.random() - 0.5) * 60,
                y: sy + (Math.random() - 0.5) * 20,
                vx: 0,
                vy: 0,
                tx,
                ty,
                age: 0,
                ttl: 0.9 + Math.random() * 0.3,
                delay: i * 0.06,
                size: 8 + Math.random() * 3,
                color: "#facc15",
            });
        }
        startLoop();
    };

    // ---------- Timeline ----------
    const finish = () => {
        timersRef.current.forEach((id) => window.clearTimeout(id));
        timersRef.current = [];
        if (tweenRef.current !== null) cancelAnimationFrame(tweenRef.current);
        tweenRef.current = null;
        setShown(4);
        setCp(finalCp);
        setDone(true);
    };

    useEffect(() => {
        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
        if (reduceMotion) {
            finish();
            return;
        }
        const at = (ms: number, fn: () => void) => {
            timersRef.current.push(window.setTimeout(fn, ms));
        };
        // 1) price deducted
        at(500, () => {
            setShown(1);
            tweenCp(startCp, afterPriceCp, 900);
        });
        // 2) stage unlocked
        at(1800, () => setShown(2));
        // 3) fireworks
        at(2700, () => {
            setShown(3);
            burstFireworks();
        });
        // 4) round reward: coins fly to the counter, then the counter counts up
        at(4000, () => {
            setShown(4);
            burstCoins();
        });
        at(4500, () => tweenCp(afterPriceCp, finalCp, 1400));
        at(6200, () => setDone(true));

        return () => {
            timersRef.current.forEach((id) => window.clearTimeout(id));
            timersRef.current = [];
            if (tweenRef.current !== null) cancelAnimationFrame(tweenRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep the canvas sharp and as large as the window
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener("resize", resize);
        return () => {
            window.removeEventListener("resize", resize);
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, []);

    const rows: { n: number; tone: keyof typeof TONES; text: string; ref?: boolean }[] = [
        { n: 1, tone: "red", text: `Price deducted  −${fmt(price)} CP` },
        { n: 2, tone: "success", text: `Stage ${stageNumber} unlocked ✓` },
        { n: 3, tone: "violet", text: "Fireworks!" },
        { n: 4, tone: "accent", text: `Round rewards  +${fmt(reward)} CP`, ref: true },
    ];

    const title = `STAGE ${stageNumber} · ${stageTitle.toUpperCase()}`;

    return (
        <>
            <StageLayout
                title={title}
                subtitle="LEARN → PLACE → ROUND → UNLOCK"
                currentStep="unlock"
                cp={Math.round(done ? money : cp)}
            >
                <div className="mx-auto max-w-3xl">
                    <h2
                        className="text-center font-mono text-4xl font-bold tracking-[0.2em] text-foreground md:text-5xl"
                        style={{
                            opacity: shown >= 2 ? 1 : 0,
                            transform: shown >= 2 ? "scale(1)" : "scale(0.85)",
                            transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.2, 1.4, 0.4, 1)",
                        }}
                    >
                        STAGE {stageNumber} UNLOCKED
                    </h2>

                    <section className="mx-auto mt-8 max-w-2xl rounded-2xl border border-edge bg-panel p-8 shadow-xl">
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-violet">Unlocking</p>
                        <h3 className="mt-2 font-mono text-2xl font-bold">{title}</h3>

                        <ul className="mt-6 flex flex-col gap-5">
                            {rows.map((row, i) => (
                                <li
                                    key={row.n}
                                    ref={row.ref ? rewardRowRef : undefined}
                                    className="flex items-center gap-4 font-mono text-lg"
                                    style={{
                                        opacity: shown > i ? 1 : 0,
                                        transform: shown > i ? "translateY(0)" : "translateY(8px)",
                                        transition: "opacity 0.4s ease, transform 0.4s ease",
                                    }}
                                >
                                    <span
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${TONES[row.tone]}`}
                                    >
                                        {row.n}
                                    </span>
                                    <span className={TONES[row.tone].split(" ")[1]}>{row.text}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-8 rounded-xl bg-panel-muted px-5 py-4 text-sm text-muted">
                            {next ? (
                                <>
                                    Next up:{" "}
                                    <b className="text-foreground">
                                        Stage {next.number} · {next.title}
                                    </b>{" "}
                                    — price {fmt(next.price)} CP · start round
                                </>
                            ) : (
                                "All stages unlocked."
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={done ? onNext : finish}
                            className={
                                done
                                    ? "mt-5 w-full rounded-xl bg-accent py-3 font-mono text-sm font-bold text-white shadow-lg transition hover:opacity-90"
                                    : "mt-5 w-full rounded-xl border border-edge py-3 font-mono text-sm text-muted transition hover:border-accent"
                            }
                        >
                            {done ? "Next → watch your CPU upgrade" : "Skip"}
                        </button>
                    </section>
                </div>
            </StageLayout>

            <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[70] h-full w-full" />
        </>
    );
}
