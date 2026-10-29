"use client";

import { useEffect, useState } from "react";

export interface ResultGroup {
    key: "mission" | "mc" | "match";
    label: string;
    /** Effective weight, 0 to 1 (already shared out if a group is missing). */
    weight: number;
    /** Average credit of the group, 0 to 1. */
    avgCredit: number;
}

interface RoundResultCardProps {
    stageLabel: string; // e.g. "STAGE 1"
    groups: ResultGroup[];
    passLine?: number; // 0 to 1, default 0.7
    kind: "failed" | "pending" | "passed";
    reward: number;
    onContinue: () => void;
}

const LETTER = { mission: "A", mc: "B", match: "C" } as const;
const STAGGER_MS = 350;
const DURATION_MS = 900;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => 1 - Math.pow(1 - x, 3);

export function RoundResultCard({
    stageLabel,
    groups,
    passLine = 0.7,
    kind,
    reward,
    onContinue,
}: RoundResultCardProps) {
    const totalMs = Math.max(0, groups.length - 1) * STAGGER_MS + DURATION_MS + 200;
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- skip the animation
            setElapsed(totalMs);
            return;
        }
        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const e = Math.min(now - start, totalMs);
            setElapsed(e);
            if (e < totalMs) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [totalMs]);

    const rows = groups.map((g, i) => {
        const p = ease(clamp01((elapsed - i * STAGGER_MS) / DURATION_MS));
        return { ...g, p, shown: g.avgCredit * p, points: g.weight * g.avgCredit * 100 * p };
    });

    const totalPoints = rows.reduce((sum, r) => sum + r.points, 0);
    const finalPercent = groups.reduce((sum, g) => sum + g.weight * g.avgCredit * 100, 0);
    const done = elapsed >= totalMs;
    const passed = finalPercent >= passLine * 100;

    const message =
        kind === "failed"
            ? `You need ${Math.round(passLine * 100)}% to pass. Nothing was spent, so you can try again.`
            : kind === "pending"
                ? "Round passed. The stage unlocks automatically as soon as you have enough CP."
                : `Stage unlocked.${reward > 0 ? ` Reward +${reward} CP.` : ""}`;

    return (
        <div className="mx-auto w-full max-w-4xl rounded-3xl border border-edge bg-panel p-8 shadow-lg sm:p-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">Round result</p>
            <h2 className="mt-2 font-mono text-3xl font-bold tracking-[0.12em]">{stageLabel} · ROUND SCORE</h2>

            <div className="mt-9 flex flex-col gap-7">
                {rows.map((r) => (
                    <div key={r.key}>
                        <div className="flex items-baseline justify-between gap-4">
                            <p className="font-semibold">
                                {LETTER[r.key]} · {r.label}
                            </p>
                            <p className="font-mono text-xs text-muted">
                                weight {Math.round(r.weight * 100)}% · avg credit {Math.round(r.avgCredit * 100)}%
                            </p>
                        </div>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="h-4 flex-1 overflow-hidden rounded-full bg-edge">
                                <div
                                    className="h-full rounded-full bg-accent"
                                    style={{ width: `${r.shown * 100}%` }}
                                />
                            </div>
                            <p className="w-20 text-right font-mono text-lg font-bold">+{r.points.toFixed(2)}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 border-t border-edge pt-6">
                <div className="flex items-center gap-5">
                    <p className="font-mono text-sm tracking-widest text-muted">TOTAL</p>
                    <div className="relative h-5 flex-1 rounded-full bg-edge">
                        <div
                            className={`h-full rounded-full transition-colors duration-500 ${done ? (passed ? "bg-success" : "bg-red-500") : "bg-accent"
                                }`}
                            style={{ width: `${Math.min(100, totalPoints)}%` }}
                        />
                        <span
                            className="absolute -top-2 h-9 w-0.5 bg-red-500"
                            style={{ left: `${passLine * 100}%` }}
                        />
                        <span
                            className="absolute top-8 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] tracking-widest text-red-500"
                            style={{ left: `${passLine * 100}%` }}
                        >
                            PASS LINE {Math.round(passLine * 100)}%
                        </span>
                    </div>
                    <p
                        className={`w-28 text-right font-mono text-3xl font-bold ${done ? (passed ? "text-success" : "text-red-500") : "text-foreground"
                            }`}
                    >
                        {totalPoints.toFixed(2)}%
                    </p>
                </div>
            </div>

            <div className="mt-12 flex items-center justify-between gap-6">
                <p className={`text-sm ${done ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}>
                    {message}
                </p>
                <button
                    type="button"
                    onClick={onContinue}
                    className="shrink-0 rounded-xl bg-accent px-6 py-3 font-mono text-sm font-bold text-white transition hover:opacity-90"
                >
                    {kind === "failed" ? "Try again" : "Continue"}
                </button>
            </div>
        </div>
    );
}