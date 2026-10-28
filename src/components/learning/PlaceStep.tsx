"use client";

import { useState } from "react";
import { STAGE_1_SLOTS } from "@/data/stage1Place";

interface PlaceStepProps {
    onComplete: () => void;
}

export function PlaceStep({ onComplete }: PlaceStepProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [placedSlots, setPlacedSlots] = useState<{ [key: number]: string }>({});
    const [feedback, setFeedback] = useState<string | null>(null);

    const currentPart = STAGE_1_SLOTS[currentIndex];

    const handleSlotClick = (slotIndex: number) => {
        if (!currentPart) return;

        // Check if player clicked the correct slot for the current part
        if (slotIndex === currentPart.correctIndex) {
            const nextPlaced = { ...placedSlots, [slotIndex]: currentPart.name };
            setPlacedSlots(nextPlaced);
            setFeedback(`Placed! The ${currentPart.name} is in position.`);

            if (currentIndex + 1 < STAGE_1_SLOTS.length) {
                window.setTimeout(() => {
                    setCurrentIndex((prev) => prev + 1);
                    setFeedback(null);
                }, 700);
            } else {
                window.setTimeout(() => {
                    onComplete();
                }, 1000);
            }
        } else {
            // Wrong slot clicked, no penalty
            setFeedback(`Not here — ${currentPart.name} goes somewhere else. No penalty deducted.`);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-6 p-2 md:grid-cols-12 items-center">
            {/* Left side: 2x4 CPU Die Grid with wider slots */}
            <div className="md:col-span-7">
                <h3 className="mb-2 font-mono text-xs uppercase tracking-widest text-violet">
                    CPU DIE · 2D VIEW
                </h3>
                <div className="grid grid-cols-4 gap-2.5 rounded-xl border border-edge bg-panel-muted p-3">
                    {Array.from({ length: 8 }).map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSlotClick(idx)}
                            className={`flex h-24 flex-col items-center justify-center rounded-lg border-2 p-1.5 text-center font-mono text-[11px] transition ${placedSlots[idx]
                                    ? "border-accent bg-accent-soft font-bold text-accent-text shadow-sm"
                                    : "border-dashed border-violet/40 bg-panel hover:border-violet"
                                }`}
                        >
                            {placedSlots[idx] ? (
                                <span className="leading-tight">{placedSlots[idx]}</span>
                            ) : (
                                <span className="text-base text-muted/60">?</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right side: Instructions and active part info */}
            <div className="flex flex-col justify-between md:col-span-5 h-full">
                <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                        PLACE THIS PART ({currentIndex + 1} / {STAGE_1_SLOTS.length})
                    </span>
                    <h2 className="mt-1 font-mono text-lg font-bold text-foreground">
                        {currentPart?.name}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                        {currentPart?.description}
                    </p>

                    {feedback && (
                        <div className="mt-3 rounded-lg border border-violet/40 bg-violet-soft p-2.5 font-mono text-[11px] text-violet">
                            {feedback}
                        </div>
                    )}
                </div>

                {currentIndex === STAGE_1_SLOTS.length - 1 && placedSlots[currentPart?.correctIndex] && (
                    <button
                        type="button"
                        onClick={onComplete}
                        className="mt-4 w-full rounded-xl bg-accent py-2.5 font-mono text-xs font-bold text-accent-text shadow-lg transition hover:opacity-90"
                    >
                        START THE ROUND →
                    </button>
                )}
            </div>
        </div>
    );
}
