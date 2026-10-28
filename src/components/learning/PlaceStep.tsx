"use client";

import { useEffect, useRef, useState } from "react";
import { STAGE_1_PARTS, CpuPart } from "@/data/stage1Place";

interface PlaceStepProps {
    onComplete: () => void;
}

// How long a wrong card stays face-up before flipping back
const PEEK_MS = 1000;

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function PlaceStep({ onComplete }: PlaceStepProps) {
    // layout[slotIndex] = the part hidden under that card.
    // Starts in a fixed order (so SSR/hydration match), then gets shuffled on mount.
    const [layout, setLayout] = useState<CpuPart[]>(STAGE_1_PARTS);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [placed, setPlaced] = useState<Set<number>>(new Set()); // slots that stay face-up
    const [peekSlot, setPeekSlot] = useState<number | null>(null); // wrong card, temporarily face-up
    const [flips, setFlips] = useState(0);
    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        setLayout(shuffle(STAGE_1_PARTS));
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, []);

    const total = STAGE_1_PARTS.length;
    const currentPart = STAGE_1_PARTS[currentIndex];
    const isCompleted = currentIndex >= total;

    const handleSlotClick = (slotIndex: number) => {
        // Ignore clicks while a wrong card is still showing, or on already-placed cards
        if (isCompleted || !currentPart || peekSlot !== null || placed.has(slotIndex)) return;

        const hidden = layout[slotIndex];
        setFlips((f) => f + 1);

        if (hidden.id === currentPart.id) {
            setPlaced((prev) => new Set(prev).add(slotIndex));
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setFeedbackMsg(nextIndex >= total ? "All CPU parts successfully placed on the die!" : null);
        } else {
            // Reveal what's actually there (memory-game style), then flip back. No answer leak.
            setPeekSlot(slotIndex);
            setFeedbackMsg(`That's ${hidden.name}, not ${currentPart.name}. Remember where it is! No penalty.`);
            timerRef.current = window.setTimeout(() => setPeekSlot(null), PEEK_MS);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-6 p-2 md:grid-cols-12 items-center">
            <div className="md:col-span-12">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs uppercase tracking-widest text-violet">
                        CPU DIE · FLIP &amp; PLACE ({placed.size} / {total})
                    </span>
                    <span className="font-mono text-[11px] text-muted">
                        Flip cards to find where the active part belongs. Wrong cards flip back.
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Flip-card grid (2 rows x 4 cols) */}
                    <div className="md:col-span-7 grid grid-cols-4 gap-3 rounded-2xl border border-edge bg-panel-muted p-4 shadow-inner">
                        {layout.map((part, slotIndex) => {
                            const isPlaced = placed.has(slotIndex);
                            const isPeek = peekSlot === slotIndex;
                            const isFaceUp = isPlaced || isPeek;

                            return (
                                <button
                                    key={slotIndex}
                                    type="button"
                                    onClick={() => handleSlotClick(slotIndex)}
                                    className={`relative h-24 ${isPlaced ? "cursor-default" : "cursor-pointer"}`}
                                    style={{ perspective: "800px" }}
                                    aria-label={isFaceUp ? `Slot ${slotIndex + 1}: ${part.name}` : `Slot ${slotIndex + 1}: face down`}
                                >
                                    <div
                                        className="absolute inset-0 transition-transform duration-500"
                                        style={{
                                            transformStyle: "preserve-3d",
                                            transform: isFaceUp ? "rotateY(180deg)" : "rotateY(0deg)",
                                        }}
                                    >
                                        {/* Back (face down) */}
                                        <div
                                            className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-edge bg-panel font-mono text-xs text-muted transition-colors hover:border-violet/60"
                                            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                                        >
                                            <span className="text-[10px]">Slot {slotIndex + 1}</span>
                                            <span className="mt-1 text-lg font-bold text-violet/40">?</span>
                                        </div>

                                        {/* Front (face up) */}
                                        <div
                                            className={`absolute inset-0 flex flex-col items-center justify-center rounded-xl border p-2 text-center font-mono text-xs ${isPlaced
                                                ? "border-success/60 bg-success-soft text-success shadow-md"
                                                : "border-rose-400 bg-rose-500/10 text-rose-500"
                                                }`}
                                            style={{
                                                backfaceVisibility: "hidden",
                                                WebkitBackfaceVisibility: "hidden",
                                                transform: "rotateY(180deg)",
                                            }}
                                        >
                                            <span className="text-[10px] opacity-80">Slot {slotIndex + 1}</span>
                                            <span className="mt-1 font-bold text-foreground">{part.name}</span>
                                            <span className="mt-1 text-[9px]">{isPlaced ? "✓ Embedded" : "✗ Not this one"}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Part Sidebar */}
                    <div className="md:col-span-5 flex flex-col justify-between rounded-xl border border-edge bg-panel p-4 h-full">
                        {!isCompleted && currentPart ? (
                            <div className="flex flex-col gap-3">
                                <span className="font-mono text-[10px] uppercase tracking-wider text-violet">
                                    FIND THIS PART ({currentIndex + 1} / {total})
                                </span>
                                <h3 className="font-mono text-lg font-bold text-foreground">{currentPart.name}</h3>
                                <p className="text-xs leading-relaxed text-muted">{currentPart.description}</p>
                                <span className="font-mono text-[10px] text-muted">Flips so far: {flips}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 text-center py-4">
                                <h3 className="font-mono text-lg font-bold text-success">Die Assembly Complete!</h3>
                                <p className="text-xs text-muted">
                                    All foundational units are correctly wired onto the silicon die in {flips} flips.
                                </p>
                            </div>
                        )}

                        {feedbackMsg && (
                            <div
                                className={`mt-4 rounded-lg border p-3 font-mono text-xs ${isCompleted
                                    ? "border-success/40 bg-success-soft text-success"
                                    : "border-warning/40 bg-warning/10 text-warning"
                                    }`}
                            >
                                {feedbackMsg}
                            </div>
                        )}

                        {isCompleted && (
                            <button
                                type="button"
                                onClick={onComplete}
                                className="mt-4 w-full rounded-xl bg-accent py-3 font-mono text-sm font-bold text-accent-text shadow-lg transition hover:opacity-90"
                            >
                                PROCEED TO MATCH STAGE →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}