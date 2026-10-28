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

        if (slotIndex === currentPart.correctIndex) {
            const nextPlaced = { ...placedSlots, [slotIndex]: currentPart.name };
            setPlacedSlots(nextPlaced);
            setFeedback(`Placed! The ${currentPart.name} is in position.`);

            if (currentIndex + 1 < STAGE_1_SLOTS.length) {
                setTimeout(() => {
                    setCurrentIndex((prev) => prev + 1);
                    setFeedback(null);
                }, 700);
            } else {
                setTimeout(() => {
                    onComplete();
                }, 1000);
            }
        } else {
            setFeedback(`Not here — ${currentPart.name} goes somewhere else. No penalty deducted.`);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2 rounded-2xl border border-violet/30 bg-panel/95 shadow-2xl">
            <div>
                <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-violet">
                    CPU DIE · 2D VIEW
                </h3>
                <div className="grid min-h-[220px] grid-cols-4 gap-3 rounded-xl border border-edge bg-panel-muted p-4">
                    {Array.from({ length: 8 }).map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handleSlotClick(idx)}
                            className={`flex h-20 flex-col items-center justify-center rounded-lg border-2 p-1 text-center font-mono text-xs transition ${placedSlots[idx]
                                    ? "border-accent bg-accent-soft font-bold text-accent-text"
                                    : "border-dashed border-violet/40 bg-panel hover:border-violet"
                                }`}
                        >
                            {placedSlots[idx] ? (
                                <span>{placedSlots[idx]}</span>
                            ) : (
                                <span className="text-lg text-muted">?</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col justify-between">
                <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                        PLACE THIS PART ({currentIndex + 1} / {STAGE_1_SLOTS.length})
                    </span>
                    <h2 className="mt-1 font-mono text-xl font-bold text-foreground">
                        {currentPart?.name}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                        {currentPart?.description}
                    </p>

                    {feedback && (
                        <div className="mt-4 rounded-lg border border-violet/40 bg-violet-soft p-3 font-mono text-xs text-violet">
                            {feedback}
                        </div>
                    )}
                </div>

                {currentIndex === STAGE_1_SLOTS.length - 1 && placedSlots[currentPart?.correctIndex] && (
                    <button
                        type="button"
                        onClick={onComplete}
                        className="mt-4 w-full rounded-xl bg-accent py-3 font-mono text-sm font-bold text-accent-text shadow-lg"
                    >
                        START THE ROUND →
                    </button>
                )}
            </div>
        </div>
    );
}
