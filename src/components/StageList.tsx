"use client";

import { STAGES } from "@/data/stages";
import { getStageStatus } from "@/lib/gameLogic";
import { formatMoney } from "@/lib/format";
import type { GameState } from "@/types/game";

interface StageListProps {
    state: GameState;
    onStart: (stageId: number) => void;
}

export function StageList({ state, onStart }: StageListProps) {
    return (
        <div className="fixed left-4 top-28 z-30 w-60 rounded-2xl border border-violet/40 bg-panel/95 p-3 shadow-2xl backdrop-blur-md">
            <p className="px-1 font-mono text-[10px] uppercase tracking-[0.22em] text-violet">
                Stages
            </p>
            <ul className="mt-2 space-y-1.5">
                {STAGES.map((stage) => {
                    const status = getStageStatus(state, stage);
                    const missing = Math.max(0, stage.price - state.money);
                    const clickable = status === "available";

                    let label: string;
                    let labelClass = "text-muted";
                    if (status === "done") {
                        label = "Unlocked";
                        labelClass = "text-violet";
                    } else if (status === "pending") {
                        label = `Passed · need ${formatMoney(missing)} more`;
                        labelClass = "text-warning";
                    } else if (status === "locked") {
                        label = "Locked";
                    } else {
                        label =
                            stage.price === 0
                                ? "Free · start quiz"
                                : `Price ${formatMoney(stage.price)} · start quiz`;
                    }

                    return (
                        <li key={stage.id}>
                            <button
                                type="button"
                                disabled={!clickable}
                                onClick={() => onStart(stage.id)}
                                className={`flex w-full flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left ${clickable
                                        ? "border-violet/50 bg-violet-soft"
                                        : "border-violet/20 opacity-70"
                                    }`}
                            >
                                <span className="font-mono text-xs font-semibold text-foreground">
                                    {stage.id} · {stage.title}
                                </span>
                                <span className={`font-mono text-[10px] ${labelClass}`}>{label}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}