"use client";

import { useEffect, useRef, useState } from "react";
import { STAGE_1_ACTIVE_SETS, MatchSet } from "@/data/stage1Match";

interface MatchStepProps {
    onComplete: () => void;
}

// How long wrong pairs stay highlighted before being released
const WRONG_FLASH_MS = 1200;

export function MatchStep({ onComplete }: MatchStepProps) {
    // Strictly limit to 2 match sets per round
    const activeSets = STAGE_1_ACTIVE_SETS.slice(0, 2);
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const matchSet: MatchSet = activeSets[currentSetIndex] ?? activeSets[0];
    const total = matchSet.leftItems.length;

    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [userPairs, setUserPairs] = useState<Record<string, string>>({}); // leftId -> rightId
    const [lockedIds, setLockedIds] = useState<string[]>([]); // left ids that were answered correctly
    const [wrongIds, setWrongIds] = useState<string[]>([]); // left ids flashing as wrong
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, []);

    // Number badge (1..n) shared by a left item and the right item it is paired with
    const leftNumber: Record<string, number> = {};
    matchSet.leftItems.forEach((item, i) => {
        leftNumber[item.id] = i + 1;
    });
    // rightId -> leftId (who owns this right item)
    const rightOwner: Record<string, string> = {};
    Object.entries(userPairs).forEach(([l, r]) => {
        rightOwner[r] = l;
    });

    const handleLeftClick = (leftId: string) => {
        if (isCompleted || busy || lockedIds.includes(leftId)) return;
        if (selectedLeft === leftId) {
            setSelectedLeft(null); // click again to deselect
            return;
        }
        // Clicking an already-paired (unlocked) item releases its pair so it can be re-matched
        if (userPairs[leftId]) {
            setUserPairs((prev) => {
                const next = { ...prev };
                delete next[leftId];
                return next;
            });
        }
        setSelectedLeft(leftId);
        setFeedback(null);
    };

    const handleRightClick = (rightId: string) => {
        if (isCompleted || busy || !selectedLeft || rightOwner[rightId]) return;

        const nextPairs = { ...userPairs, [selectedLeft]: rightId };
        setUserPairs(nextPairs);
        setSelectedLeft(null);

        if (Object.keys(nextPairs).length === total) {
            validatePairs(nextPairs);
        }
    };

    // Release only the pairs that are not locked yet
    const handleResetCurrent = () => {
        if (isCompleted || busy) return;
        setUserPairs((prev) => {
            const next: Record<string, string> = {};
            for (const id of lockedIds) next[id] = prev[id];
            return next;
        });
        setSelectedLeft(null);
        setFeedback(null);
    };

    const validatePairs = (pairs: Record<string, string>) => {
        const wrong = matchSet.leftItems
            .filter((item) => matchSet.correctPairs[item.id] !== pairs[item.id])
            .map((item) => item.id);

        if (wrong.length === 0) {
            setLockedIds(matchSet.leftItems.map((item) => item.id));
            setFeedback("All pairs matched correctly! Excellent work.");
            setIsCompleted(true);
            return;
        }

        const correct = matchSet.leftItems.map((item) => item.id).filter((id) => !wrong.includes(id));
        setLockedIds(correct);
        setWrongIds(wrong);
        setBusy(true);
        setFeedback(`${correct.length}/${total} correct. Correct pairs are locked — re-match the red ones.`);

        timerRef.current = window.setTimeout(() => {
            setUserPairs((prev) => {
                const next = { ...prev };
                wrong.forEach((id) => delete next[id]);
                return next;
            });
            setWrongIds([]);
            setBusy(false);
        }, WRONG_FLASH_MS);
    };

    const handleNextSet = () => {
        if (currentSetIndex + 1 < activeSets.length) {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            setCurrentSetIndex((prev) => prev + 1);
            setUserPairs({});
            setLockedIds([]);
            setWrongIds([]);
            setSelectedLeft(null);
            setBusy(false);
            setFeedback(null);
            setIsCompleted(false);
        } else {
            onComplete();
        }
    };

    const badge = (n: number, tone: "violet" | "success" | "rose") => {
        const toneClass =
            tone === "success"
                ? "bg-success/20 text-success"
                : tone === "rose"
                    ? "bg-rose-500/20 text-rose-500"
                    : "bg-violet/20 text-violet";
        return (
            <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${toneClass}`}
            >
                {n}
            </span>
        );
    };

    return (
        <div className="grid grid-cols-1 gap-6 p-2 md:grid-cols-12 items-center">
            <div className="md:col-span-12">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs uppercase tracking-widest text-violet">
                        MATCH SET {currentSetIndex + 1} / {activeSets.length}: {matchSet.title}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-muted">
                            Locked {lockedIds.length} / {total}
                        </span>
                        <button
                            type="button"
                            onClick={handleResetCurrent}
                            disabled={busy || isCompleted}
                            className="rounded border border-warning/40 bg-warning/10 px-2.5 py-1 font-mono text-[10px] text-warning transition hover:bg-warning/20 disabled:opacity-40"
                        >
                            Reset Pairings
                        </button>
                    </div>
                </div>

                <p className="mb-3 font-mono text-[11px] text-muted">
                    1) Click an item on the left → 2) click its description on the right. Click a paired item again to
                    undo it.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-edge bg-panel-muted p-4">
                    {/* Left items column */}
                    <div className="flex flex-col gap-2.5">
                        <h4 className="font-mono text-xs font-semibold text-foreground">Items</h4>
                        {matchSet.leftItems.map((item) => {
                            const isSelected = selectedLeft === item.id;
                            const isPaired = Boolean(userPairs[item.id]);
                            const isLocked = lockedIds.includes(item.id);
                            const isWrong = wrongIds.includes(item.id);

                            let style = "border-edge bg-panel text-foreground hover:border-violet/40";
                            if (isLocked) style = "border-success/60 bg-success-soft text-success";
                            else if (isWrong) style = "border-rose-400 bg-rose-500/10 text-rose-500 animate-shake";
                            else if (isSelected) style = "border-accent bg-accent-soft text-accent-text font-bold shadow-sm";
                            else if (isPaired) style = "border-violet/50 bg-violet-soft text-foreground";

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleLeftClick(item.id)}
                                    disabled={isLocked}
                                    className={`flex items-center justify-between gap-2 rounded-lg border p-3 text-left font-mono text-xs transition ${style}`}
                                >
                                    <span className="flex items-center gap-2">
                                        {badge(leftNumber[item.id], isLocked ? "success" : isWrong ? "rose" : "violet")}
                                        <span>{item.text}</span>
                                    </span>
                                    {isLocked && <span className="text-[10px]">✓ Locked</span>}
                                    {isSelected && !isLocked && <span className="text-[10px]">Pick a description →</span>}
                                </button>
                            );
                        })}
                    </div>

                    {/* Right items column (includes distractor) */}
                    <div className="flex flex-col gap-2.5">
                        <h4 className="font-mono text-xs font-semibold text-foreground">Descriptions &amp; Distractor</h4>
                        {matchSet.rightItems.map((item) => {
                            const ownerId = rightOwner[item.id];
                            const isTaken = Boolean(ownerId);
                            const isLocked = isTaken && lockedIds.includes(ownerId);
                            const isWrong = isTaken && wrongIds.includes(ownerId);

                            let style = "border-edge bg-panel text-foreground";
                            if (isLocked) style = "border-success/60 bg-success-soft text-success";
                            else if (isWrong) style = "border-rose-400 bg-rose-500/10 text-rose-500 animate-shake";
                            else if (isTaken) style = "border-violet/50 bg-violet-soft text-foreground";
                            else if (selectedLeft)
                                style = "border-violet/60 bg-violet-soft text-violet hover:bg-violet/20 cursor-pointer";

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    disabled={!selectedLeft || isTaken || busy}
                                    onClick={() => handleRightClick(item.id)}
                                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition ${style}`}
                                >
                                    {isTaken && badge(leftNumber[ownerId], isLocked ? "success" : isWrong ? "rose" : "violet")}
                                    <span>{item.text}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {feedback && (
                    <div
                        className={`mt-3 rounded-lg border p-3 font-mono text-xs ${isCompleted
                            ? "border-success/40 bg-success-soft text-success"
                            : "border-warning/40 bg-warning/10 text-warning"
                            }`}
                    >
                        {feedback}
                    </div>
                )}

                {isCompleted && (
                    <button
                        type="button"
                        onClick={handleNextSet}
                        className="mt-4 w-full rounded-xl bg-accent py-3 font-mono text-sm font-bold text-accent-text shadow-lg transition hover:opacity-90"
                    >
                        {currentSetIndex + 1 < activeSets.length ? "NEXT MATCH SET →" : "PROCEED TO QUIZ ROUND →"}
                    </button>
                )}
            </div>
        </div>
    );
}