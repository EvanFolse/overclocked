"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RoundMatching } from "@/lib/rounds";
import { shuffleOrder } from "@/lib/rounds";
import type { MatchResult } from "@/types/game";

interface MatchStepProps {
    /** The matching sets of the active round (from getRoundMatchSets). Must not be empty. */
    sets: RoundMatching[];
    /** Called once per set, when the set is settled (all right, or both attempts used). */
    onSetSettled: (result: MatchResult) => void;
    /** Called after the last set. */
    onComplete: () => void;
}

// How long wrong pairs stay highlighted before being released
const WRONG_FLASH_MS = 1200;

export function MatchStep({ sets, onSetSettled, onComplete }: MatchStepProps) {
    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const matchSet = sets[currentSetIndex] ?? sets[0]!;

    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [userPairs, setUserPairs] = useState<Record<string, string>>({}); // leftId -> rightId
    const [lockedIds, setLockedIds] = useState<string[]>([]); // left ids answered correctly
    const [wrongIds, setWrongIds] = useState<string[]>([]); // left ids flashing as wrong
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);

    // Design doc 4.2: 2 attempts per set, one hint level, hint caps credit at x0.5
    const [attempt, setAttempt] = useState<1 | 2>(1);
    const [hintOpened, setHintOpened] = useState(false);
    const [hintVisible, setHintVisible] = useState(false);
    const [shuffleSeed, setShuffleSeed] = useState(0);

    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, []);

    // Build the cards from the bank set: left = parts, right = descriptions + the distractor
    const leftItems = matchSet.pairs.map((p, i) => ({ id: `l${i}`, text: p.item }));
    const correctPairs: Record<string, string> = Object.fromEntries(
        matchSet.pairs.map((_, i) => [`l${i}`, `r${i}`])
    );
    const total = leftItems.length;

    // Right column order: reshuffled for every new set and again before the second attempt
    const rightItems = useMemo(() => {
        const cards = [
            ...matchSet.pairs.map((p, i) => ({ id: `r${i}`, text: p.description })),
            { id: "r_distractor", text: matchSet.distractor },
        ];
        return shuffleOrder(cards.length).map((i) => cards[i]!);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchSet.id, shuffleSeed]);

    // Number badge (1..n) shared by a left item and the right item it is paired with
    const leftNumber: Record<string, number> = {};
    leftItems.forEach((item, i) => {
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
            setSelectedLeft(null);
            return;
        }
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

        // A submission happens when every left item has a partner
        if (Object.keys(nextPairs).length === total) {
            validatePairs(nextPairs);
        }
    };

    // Release only the pairs that are not locked yet (does not use up an attempt)
    const handleResetCurrent = () => {
        if (isCompleted || busy) return;
        setUserPairs((prev) => {
            const next: Record<string, string> = {};
            for (const id of lockedIds) next[id] = prev[id]!;
            return next;
        });
        setSelectedLeft(null);
        setFeedback(null);
    };

    const settle = (attemptCorrect: 1 | 2 | null) => {
        onSetSettled({
            setId: matchSet.id,
            concepts: matchSet.concepts,
            attemptCorrect,
            hintUsed: hintOpened,
        });
    };

    const validatePairs = (pairs: Record<string, string>) => {
        const wrong = leftItems.filter((item) => correctPairs[item.id] !== pairs[item.id]).map((item) => item.id);

        // All right: credit depends on which attempt it was (x1 / x0.75 / x0.5 with hint)
        if (wrong.length === 0) {
            setLockedIds(leftItems.map((item) => item.id));
            setFeedback("All pairs matched correctly! Excellent work.");
            setIsCompleted(true);
            setHintVisible(false);
            settle(attempt);
            return;
        }

        // Second attempt still wrong: show the answer, no credit
        if (attempt >= 2) {
            setUserPairs({ ...correctPairs });
            setLockedIds(leftItems.map((item) => item.id));
            setWrongIds([]);
            setFeedback("Both attempts used. The correct pairs are shown above. This set earns no credit.");
            setIsCompleted(true);
            setHintVisible(false);
            settle(null);
            return;
        }

        // First attempt wrong: lock the right pairs, flash the wrong ones, go to attempt 2
        const correct = leftItems.map((item) => item.id).filter((id) => !wrong.includes(id));
        setLockedIds(correct);
        setWrongIds(wrong);
        setBusy(true);
        setAttempt(2);
        setFeedback(
            `${correct.length}/${total} correct. Correct pairs are locked. Re-match the red ones (attempt 2 of 2).`
        );

        timerRef.current = window.setTimeout(() => {
            setUserPairs((prev) => {
                const next = { ...prev };
                wrong.forEach((id) => delete next[id]);
                return next;
            });
            setWrongIds([]);
            setShuffleSeed((s) => s + 1); // reshuffle the right column
            setBusy(false);
        }, WRONG_FLASH_MS);
    };

    const showHint = () => {
        setHintOpened(true);
        setHintVisible(true);
    };

    const handleNextSet = () => {
        if (currentSetIndex + 1 < sets.length) {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            setCurrentSetIndex((prev) => prev + 1);
            setUserPairs({});
            setLockedIds([]);
            setWrongIds([]);
            setSelectedLeft(null);
            setBusy(false);
            setFeedback(null);
            setIsCompleted(false);
            setAttempt(1);
            setHintOpened(false);
            setHintVisible(false);
            setShuffleSeed(0);
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

    const canHint = attempt === 2 && !isCompleted && !!matchSet.hint;

    return (
        <div className="grid grid-cols-1 items-center gap-6 p-2 md:grid-cols-12">
            <div className="md:col-span-12">
                <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-widest text-violet">
                        MATCH SET {currentSetIndex + 1} / {sets.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-muted">
                            ATTEMPT {attempt} / 2 · Locked {lockedIds.length} / {total}
                        </span>
                        {canHint && (
                            <button
                                type="button"
                                onClick={showHint}
                                className="rounded border border-amber-400/60 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-amber-600 transition hover:opacity-90"
                            >
                                {hintOpened ? "Show hint again" : "Hint"}
                            </button>
                        )}
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
                    undo it. One description is a distractor.
                </p>

                <div className="grid grid-cols-1 gap-4 rounded-xl border border-edge bg-panel-muted p-4 md:grid-cols-2">
                    {/* Left items column */}
                    <div className="flex flex-col gap-2.5">
                        <h4 className="font-mono text-xs font-semibold text-foreground">Items</h4>
                        {leftItems.map((item) => {
                            const isSelected = selectedLeft === item.id;
                            const isPaired = Boolean(userPairs[item.id]);
                            const isLocked = lockedIds.includes(item.id);
                            const isWrong = wrongIds.includes(item.id);

                            let style = "border-edge bg-panel text-foreground hover:border-violet/40";
                            if (isLocked) style = "border-success/60 bg-success-soft text-success scale-[1.02]";
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
                                        {badge(leftNumber[item.id]!, isLocked ? "success" : isWrong ? "rose" : "violet")}
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
                        {rightItems.map((item) => {
                            const ownerId = rightOwner[item.id];
                            const isTaken = Boolean(ownerId);
                            const isLocked = isTaken && lockedIds.includes(ownerId!);
                            const isWrong = isTaken && wrongIds.includes(ownerId!);

                            let style = "border-edge bg-panel text-foreground";
                            if (isLocked) style = "border-success/60 bg-success-soft text-success scale-[1.02]";
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
                                    {isTaken && badge(leftNumber[ownerId!]!, isLocked ? "success" : isWrong ? "rose" : "violet")}
                                    <span>{item.text}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {feedback && (
                    <div
                        className={`mt-3 rounded-lg border p-3 font-mono text-xs ${
                            isCompleted
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
                        {currentSetIndex + 1 < sets.length ? "NEXT MATCH SET →" : "PROCEED TO QUIZ ROUND →"}
                    </button>
                )}
            </div>

            {/* Hint pop-up: bottom-right, stays until confirmed (same as RoundView) */}
            {hintVisible && !isCompleted && matchSet.hint && (
                <div className="fixed bottom-6 right-6 z-[60] w-80 rounded-2xl border border-amber-400/60 bg-panel p-5 shadow-2xl">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-600">Hint</p>
                    <p className="mt-2 text-sm leading-relaxed">{matchSet.hint}</p>
                    <p className="mt-2 text-xs text-muted">Using the hint caps this set at ×0.5 credit.</p>
                    <button
                        type="button"
                        onClick={() => setHintVisible(false)}
                        className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                    >
                        Got it
                    </button>
                </div>
            )}
        </div>
    );
}
