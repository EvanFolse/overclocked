"use client";

import { ReactNode } from "react";

export type StageStepKey = "learn" | "place" | "round" | "unlock";

const STEPS: { key: StageStepKey; label: string }[] = [
    { key: "learn", label: "1 LEARN" },
    { key: "place", label: "2 PLACE" },
    { key: "round", label: "3 ROUND" },
    { key: "unlock", label: "4 UNLOCK" },
];

interface StageLayoutProps {
    title: string;
    subtitle?: string;
    currentStep: StageStepKey;
    cp?: number;
    onLeave?: () => void;
    children: ReactNode;
}

export function StageLayout({ title, subtitle, currentStep, cp, onLeave, children }: StageLayoutProps) {
    const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
            <header className="grid grid-cols-1 items-center gap-3 border-b border-edge bg-panel px-6 py-4 md:grid-cols-[1fr_auto_1fr]">
                <div>
                    <h1 className="font-mono text-lg font-bold tracking-[0.2em] sm:text-xl">{title}</h1>
                    {subtitle && (
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted">{subtitle}</p>
                    )}
                </div>

                <nav className="flex flex-wrap items-center justify-center gap-2">
                    {STEPS.map((s, i) => {
                        const isActive = i === currentIndex;
                        const isDone = i < currentIndex;
                        return (
                            <span
                                key={s.key}
                                className={`rounded-full border px-4 py-1.5 font-mono text-[11px] tracking-widest transition ${isActive
                                    ? "border-accent bg-accent font-bold text-white"
                                    : isDone
                                        ? "border-success/50 text-success"
                                        : "border-edge text-muted"
                                    }`}
                            >
                                {isDone ? "✓ " : ""}
                                {s.label}
                            </span>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-4 md:justify-end">
                    {cp !== undefined && (
                        <div className="text-left md:text-right">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">CP</p>
                            <p className="font-mono text-2xl font-bold text-success">
                                {Math.floor(cp).toLocaleString()} CP
                            </p>
                        </div>
                    )}
                    {onLeave && (
                        <button
                            type="button"
                            onClick={onLeave}
                            className="rounded-lg border border-edge px-3 py-1.5 text-xs text-muted transition hover:text-foreground"
                        >
                            Leave
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
    );
}