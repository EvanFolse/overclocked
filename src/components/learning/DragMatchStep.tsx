"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { RoundMatching } from "@/lib/rounds";
import { shuffleOrder } from "@/lib/rounds";
import { Confetti } from "@/components/learning/fx/Confetti";
import type { MatchMistake, MatchResult } from "@/types/game";

interface DragMatchStepProps {
    sets: RoundMatching[];
    onSetSettled: (result: MatchResult) => void;
    onComplete: () => void;
}

// How long wrong cards stay marked before they fly back to the tray
const WRONG_FLASH_MS = 1200;
// Moving less than this many pixels counts as a click, not a drag
const DRAG_THRESHOLD = 5;

interface DragState {
    cardId: string;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
    moved: boolean;
}

const CSS = `
@keyframes dm-snap{0%{transform:scale(.9)}60%{transform:scale(1.05)}100%{transform:scale(1)}}
@keyframes dm-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
@keyframes dm-wire{from{background-position:0 0}to{background-position:16px 0}}
@keyframes dm-glow{0%{box-shadow:0 0 0 0 rgba(5,150,105,.6)}100%{box-shadow:0 0 0 14px rgba(5,150,105,0)}}
.dm-glow{animation:dm-glow .8s ease-out}
.dm-snap{animation:dm-snap .35s ease-out}
.dm-shake{animation:dm-shake .4s}
.dm-wire-live{background-image:repeating-linear-gradient(90deg,currentColor 0 6px,transparent 6px 10px);animation:dm-wire .6s linear infinite}
@media (prefers-reduced-motion:reduce){.dm-root *{animation:none!important;transition:none!important}}
`;

/** The slot under the pointer, if any. */
function slotAt(x: number, y: number): string | null {
    for (const el of document.elementsFromPoint(x, y)) {
        const slot = (el as HTMLElement).closest?.("[data-slot-id]") as HTMLElement | null;
        if (slot?.dataset.slotId) return slot.dataset.slotId;
    }
    return null;
}

/**
 * Matching by drag and drop (design doc 4.2). Same rules as the click version (MatchStep):
 * 2 attempts per set, one hint level, a distractor, and the wrong pairings are reported.
 * Drag a description card onto the station it belongs to.
 */
export function DragMatchStep({ sets, onSetSettled, onComplete }: DragMatchStepProps) {
    const [setIndex, setSetIndex] = useState(0);
    const matchSet = sets[setIndex] ?? sets[0]!;

    const [slots, setSlots] = useState<Record<string, string>>({}); // slotId -> cardId
    const [lockedIds, setLockedIds] = useState<string[]>([]); // slot ids answered correctly
    const [wrongIds, setWrongIds] = useState<string[]>([]); // slot ids marked wrong
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [celebrate, setCelebrate] = useState(0); // counts perfect sets, used as the confetti key

    const [attempt, setAttempt] = useState<1 | 2>(1);
    const [hintOpened, setHintOpened] = useState(false);
    const [hintVisible, setHintVisible] = useState(false);
    const [shuffleSeed, setShuffleSeed] = useState(0);

    const [selected, setSelected] = useState<string | null>(null); // click-to-place fallback
    const [drag, setDrag] = useState<DragState | null>(null);
    const [hoverSlot, setHoverSlot] = useState<string | null>(null);
    const [snapId, setSnapId] = useState<string | null>(null);

    const dragRef = useRef<DragState | null>(null);
    const timerRef = useRef<number | null>(null);
    const mistakesRef = useRef<MatchMistake[]>([]);

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, []);

    const slotList = matchSet.pairs.map((p, i) => ({ id: `l${i}`, label: p.item }));
    const correct: Record<string, string> = Object.fromEntries(matchSet.pairs.map((_, i) => [`l${i}`, `r${i}`]));
    const total = slotList.length;

    const cardText = (cardId: string): string =>
        cardId === "r_distractor" ? matchSet.distractor : (matchSet.pairs[Number(cardId.slice(1))]?.description ?? "");

    // Tray order: reshuffled for every new set and again before the second attempt
    const trayOrder = useMemo(() => {
        const ids = [...matchSet.pairs.map((_, i) => `r${i}`), "r_distractor"];
        return shuffleOrder(ids.length).map((i) => ids[i]!);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchSet.id, shuffleSeed]);

    const placedCards = new Set(Object.values(slots));
    const trayCards = trayOrder.filter((id) => !placedCards.has(id));

    const settle = (attemptCorrect: 1 | 2 | null) => {
        onSetSettled({
            setId: matchSet.id,
            concepts: matchSet.concepts,
            attemptCorrect,
            hintUsed: hintOpened,
            mistakes: mistakesRef.current,
        });
    };

    const validate = (placed: Record<string, string>) => {
        const wrong = slotList.filter((s) => correct[s.id] !== placed[s.id]).map((s) => s.id);

        // Remember what each wrong card was paired with (used for the Tutor corrections)
        for (const id of wrong) {
            const slot = slotList.find((s) => s.id === id);
            const cardId = placed[id];
            if (!slot || !cardId) continue;
            const confusedWith =
                cardId === "r_distractor" ? null : (matchSet.pairs[Number(cardId.slice(1))]?.item ?? null);
            const known = mistakesRef.current.some((m) => m.item === slot.label && m.confusedWith === confusedWith);
            if (!known) mistakesRef.current = [...mistakesRef.current, { item: slot.label, confusedWith }];
        }

        // All right: credit depends on the attempt (x1 / x0.75 / x0.5 with hint)
        if (wrong.length === 0) {
            setLockedIds(slotList.map((s) => s.id));
            setFeedback("All stations wired correctly! Excellent work.");
            setCelebrate((n) => n + 1);
            setIsCompleted(true);
            setHintVisible(false);
            settle(attempt);
            return;
        }

        // Second attempt still wrong: show the answer, no credit
        if (attempt >= 2) {
            setSlots({ ...correct });
            setLockedIds(slotList.map((s) => s.id));
            setWrongIds([]);
            setFeedback("Both attempts used. The correct cards are shown in place. This set earns no credit.");
            setIsCompleted(true);
            setHintVisible(false);
            settle(null);
            return;
        }

        // First attempt wrong: lock the right ones, mark the wrong ones, go to attempt 2
        const good = slotList.map((s) => s.id).filter((id) => !wrong.includes(id));
        setLockedIds(good);
        setWrongIds(wrong);
        setBusy(true);
        setAttempt(2);
        setFeedback(`${good.length}/${total} correct. Correct cards are locked. Rewire the red ones (attempt 2 of 2).`);

        timerRef.current = window.setTimeout(() => {
            setSlots((prev) => {
                const next = { ...prev };
                wrong.forEach((id) => delete next[id]);
                return next;
            });
            setWrongIds([]);
            setShuffleSeed((s) => s + 1); // reshuffle the tray
            setBusy(false);
        }, WRONG_FLASH_MS);
    };

    const place = (cardId: string, slotId: string) => {
        if (isCompleted || busy || lockedIds.includes(slotId)) return;
        const next: Record<string, string> = {};
        // A card sits in one slot at most. An unlocked card that was in the target slot goes back to the tray.
        for (const [k, v] of Object.entries(slots)) if (v !== cardId) next[k] = v;
        next[slotId] = cardId;
        setSlots(next);
        setSelected(null);
        setFeedback(null);
        setSnapId(cardId);
        window.setTimeout(() => setSnapId(null), 400);
        if (Object.keys(next).length === total) validate(next);
    };

    const unplace = (cardId: string) => {
        if (isCompleted || busy) return;
        const next: Record<string, string> = {};
        for (const [k, v] of Object.entries(slots)) if (v !== cardId) next[k] = v;
        setSlots(next);
        setFeedback(null);
    };

    // Return every card that is not locked yet to the tray
    const resetCurrent = () => {
        if (isCompleted || busy) return;
        const next: Record<string, string> = {};
        for (const id of lockedIds) if (slots[id]) next[id] = slots[id]!;
        setSlots(next);
        setSelected(null);
        setFeedback(null);
    };

    // ---------- pointer handling ----------
    const onCardDown = (e: ReactPointerEvent<HTMLDivElement>, cardId: string, slotId: string | null) => {
        if (isCompleted || busy) return;
        if (slotId !== null && lockedIds.includes(slotId)) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const d: DragState = { cardId, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, moved: false };
        dragRef.current = d;
        setDrag(d);
    };

    const onCardMove = (e: ReactPointerEvent<HTMLDivElement>, cardId: string) => {
        const d = dragRef.current;
        if (!d || d.cardId !== cardId) return;
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        const next: DragState = { ...d, dx, dy, moved: d.moved || Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD };
        dragRef.current = next;
        setDrag(next);
        setHoverSlot(next.moved ? slotAt(e.clientX, e.clientY) : null);
    };

    const onCardUp = (e: ReactPointerEvent<HTMLDivElement>, cardId: string) => {
        const d = dragRef.current;
        dragRef.current = null;
        setDrag(null);
        setHoverSlot(null);
        if (!d || d.cardId !== cardId) return;
        const from = Object.keys(slots).find((k) => slots[k] === cardId) ?? null;

        if (!d.moved) {
            // A click: a card in a slot goes back to the tray, a card in the tray gets selected
            if (from) unplace(cardId);
            else setSelected((s) => (s === cardId ? null : cardId));
            return;
        }
        const target = slotAt(e.clientX, e.clientY);
        if (target) place(cardId, target);
        else if (from) unplace(cardId);
    };

    const cancelDrag = () => {
        dragRef.current = null;
        setDrag(null);
        setHoverSlot(null);
    };

    const showHint = () => {
        setHintOpened(true);
        setHintVisible(true);
    };

    const nextSet = () => {
        if (setIndex + 1 < sets.length) {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            setSetIndex((i) => i + 1);
            setSlots({});
            setLockedIds([]);
            setWrongIds([]);
            setSelected(null);
            setBusy(false);
            setFeedback(null);
            setIsCompleted(false);
            setCelebrate(0);
            setAttempt(1);
            setHintOpened(false);
            setHintVisible(false);
            setShuffleSeed(0);
            mistakesRef.current = [];
        } else {
            onComplete();
        }
    };

    const canHint = attempt === 2 && !isCompleted && !!matchSet.hint;

    const renderCard = (cardId: string, slotId: string | null) => {
        const locked = slotId !== null && lockedIds.includes(slotId);
        const wrong = slotId !== null && wrongIds.includes(slotId);
        const dragging = drag !== null && drag.cardId === cardId;

        let style = "border-edge bg-panel hover:border-accent hover:shadow-md cursor-grab";
        if (locked) style = "dm-glow border-success/60 bg-success-soft text-success cursor-default";
        else if (wrong) style = "dm-shake border-rose-400 bg-rose-500/10 text-rose-500 cursor-default";
        else if (selected === cardId) style = "border-accent bg-accent-soft text-accent-text shadow-md cursor-grab";
        else if (slotId) style = "border-violet/50 bg-violet-soft cursor-grab";

        return (
            <div
                key={cardId}
                role="button"
                tabIndex={locked ? -1 : 0}
                onPointerDown={(e) => onCardDown(e, cardId, slotId)}
                onPointerMove={(e) => onCardMove(e, cardId)}
                onPointerUp={(e) => onCardUp(e, cardId)}
                onPointerCancel={cancelDrag}
                className={`relative select-none rounded-lg border px-3 py-2.5 text-left text-[13px] leading-snug transition-colors ${style} ${
                    dragging ? "z-50 shadow-xl" : ""
                } ${snapId === cardId ? "dm-snap" : ""}`}
                style={{
                    touchAction: "none",
                    transform: dragging && drag ? `translate(${drag.dx}px, ${drag.dy}px) rotate(1.5deg)` : undefined,
                }}
            >
                {cardText(cardId)}
            </div>
        );
    };

    return (
        <div className="dm-root mx-auto w-full max-w-4xl">
            <style>{CSS}</style>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs uppercase tracking-widest text-violet">
                    Wire the stations · set {setIndex + 1} / {sets.length}
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
                        onClick={resetCurrent}
                        disabled={busy || isCompleted}
                        className="rounded border border-warning/40 bg-warning/10 px-2.5 py-1 font-mono text-[10px] text-warning transition hover:bg-warning/20 disabled:opacity-40"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <p className="mb-3 font-mono text-[11px] text-muted">
                Drag each description card onto the station it belongs to. One card is a distractor. You can also click a
                card, then click a slot.
            </p>

            {/* The stations */}
            <div className="rounded-2xl border border-edge bg-panel-muted p-4">
                <div className="flex flex-col gap-3">
                    {slotList.map((s) => {
                        const cardId = slots[s.id];
                        const locked = lockedIds.includes(s.id);
                        const wrong = wrongIds.includes(s.id);
                        const hover = hoverSlot === s.id;

                        let slotStyle = "border-edge/80 bg-panel/60";
                        if (locked) slotStyle = "border-success/50 bg-success-soft/40";
                        else if (wrong) slotStyle = "border-rose-400/70 bg-rose-500/5";
                        else if (hover) slotStyle = "border-accent bg-accent-soft scale-[1.01] shadow-md";

                        const wire = locked ? "bg-success" : hover ? "dm-wire-live text-accent" : "bg-edge";

                        return (
                            <div key={s.id} className="grid grid-cols-[minmax(0,0.9fr)_2rem_minmax(0,1.7fr)] items-center">
                                <div
                                    className={`rounded-lg border px-3 py-3 font-mono text-xs font-semibold ${
                                        locked ? "fx-pop border-success/60 bg-success-soft text-success" : "border-edge bg-panel"
                                    }`}
                                >
                                    {locked && "✓ "}
                                    {s.label}
                                </div>
                                <div className={`mx-auto h-0.5 w-full ${wire}`} />
                                <div
                                    data-slot-id={s.id}
                                    onClick={() => {
                                        if (selected && !locked) place(selected, s.id);
                                    }}
                                    className={`flex min-h-[4rem] items-stretch rounded-lg border-2 border-dashed p-1.5 transition ${slotStyle}`}
                                >
                                    {cardId ? (
                                        <div className="w-full">{renderCard(cardId, s.id)}</div>
                                    ) : (
                                        <span className="m-auto font-mono text-[11px] text-muted">Drop a card here</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {celebrate > 0 && <Confetti key={celebrate} />}

            {/* The card tray */}
            <div className="mt-4 rounded-2xl border border-dashed border-edge p-4">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                    Card tray · {trayCards.length} card{trayCards.length === 1 ? "" : "s"} left
                </p>
                <div className="flex flex-wrap gap-2.5">
                    {trayCards.length === 0 && (
                        <span className="font-mono text-[11px] text-muted">All cards are on the board.</span>
                    )}
                    {trayCards.map((id, n) => (
                        <div
                            key={`${matchSet.id}-${shuffleSeed}-${id}`}
                            className="fx-cell max-w-[16rem] flex-1 basis-[11rem]"
                            style={{ animationDelay: `${n * 60}ms` }}
                        >
                            {renderCard(id, null)}
                        </div>
                    ))}
                </div>
            </div>

            {feedback && (
                <div
                    key={feedback}
                    className={`fx-slide ${isCompleted ? "" : "fx-shake"} mt-3 rounded-lg border p-3 font-mono text-xs ${
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
                    onClick={nextSet}
                    className="fx-pop mt-4 w-full rounded-xl bg-accent py-3 font-mono text-sm font-bold text-white shadow-lg transition hover:opacity-90"
                >
                    {setIndex + 1 < sets.length ? "NEXT SET →" : "CONTINUE →"}
                </button>
            )}

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
