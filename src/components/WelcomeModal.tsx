"use client";

import { useState } from "react";

interface WelcomeModalProps {
    onStart: () => void;
}

export function WelcomeModal({ onStart }: WelcomeModalProps) {
    const [isOpen, setIsOpen] = useState(true);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg rounded-2xl border border-violet/40 bg-panel/95 p-6 shadow-2xl sm:p-8 text-foreground">

                {/* Header Title */}
                <div className="text-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet">
                        CPU Builder · Introduction
                    </p>
                    <h2 className="mt-2 font-mono text-2xl font-bold tracking-wide text-foreground">
                        WELCOME TO CPU BUILDER
                    </h2>
                </div>

                {/* Core Rules List */}
                <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-muted">
                    <div className="flex items-start gap-3 rounded-xl border border-edge/60 bg-panel-muted p-3">
                        <span className="font-mono font-bold text-accent-text">1.</span>
                        <div>
                            <strong className="font-mono text-foreground">Learn & Place</strong> — meet each CPU part, then put it where it belongs on the chip.
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-edge/60 bg-panel-muted p-3">
                        <span className="font-mono font-bold text-accent-text">2.</span>
                        <div>
                            <strong className="font-mono text-foreground">Solve missions</strong> — find what&apos;s broken, trace instructions, choose designs.
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-edge/60 bg-panel-muted p-3">
                        <span className="font-mono font-bold text-accent-text">3.</span>
                        <div>
                            <strong className="font-mono text-foreground">Pass the round</strong> — 70% or more is enough CP, unlocks the next stage.
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border border-edge/60 bg-panel-muted p-3">
                        <span className="font-mono font-bold text-accent-text">4.</span>
                        <div>
                            <strong className="font-mono text-foreground">CP grows by itself</strong> — it sets the pace; knowledge opens the gate.
                        </div>
                    </div>
                </div>

                {/* Start Building Action Button */}
                <div className="mt-7">
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onStart();
                        }}
                        className="w-full rounded-xl border border-accent/60 bg-accent px-5 py-3.5 font-mono text-sm font-bold text-accent-text shadow-lg transition hover:opacity-90 active:scale-[0.98]"
                    >
                        START BUILDING
                    </button>
                </div>

                {/* Footer Hint */}
                <p className="mt-4 text-center font-mono text-[10px] text-muted">
                    Course basis: CSC 3501 — Computer Organization and Design
                </p>
            </div>
        </div>
    );
}
