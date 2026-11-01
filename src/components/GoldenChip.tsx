"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { ChipAnswer } from "@/lib/gameLogic";
import { hasChipQuestions, pickChipQuestion, type ChipQuestion } from "@/lib/goldenChip";
import { buildQuickFix } from "@/lib/review";
import type { GameState } from "@/types/game";

// Design doc 5.3. The numbers are placeholders from the design doc.
const CHECK_EVERY_MS = 30_000; // roll the dice every 30 seconds
const CHANCE = 0.1; // 10 percent
const STAY_MS = 10_000; // the chip stays about 10 seconds
const BONUS_SECONDS = 120; // reward: about 2 minutes of current income

const LETTERS = ["A", "B", "C", "D", "E"];
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

type Phase = "idle" | "chip" | "q1" | "q2";
interface Review {
    q: ChipQuestion;
    picked: number;
}
type Outcome = { kind: "full" | "half" | "none"; reward: number };

interface GoldenChipProps {
    state: GameState;
    incomePerSecond: number;
    /** True while a round, a result page, the drawer, the Tutor etc. is open: the chip stays away */
    blocked: boolean;
    onAnswer: (answer: ChipAnswer) => void;
    onReward: (amount: number) => void;
}

const CSS = `
@keyframes gc-float{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-9px) rotate(2deg)}}
@keyframes gc-appear{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:none}}
@keyframes gc-ring{from{stroke-dashoffset:0}to{stroke-dashoffset:188.5}}
@keyframes gc-shine{from{transform:translateX(-10px) skewX(-20deg)}to{transform:translateX(70px) skewX(-20deg)}}
@keyframes gc-blink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes gc-flip{from{opacity:0;transform:perspective(900px) rotateY(-80deg) scale(.9)}to{opacity:1;transform:none}}
@keyframes gc-pop{0%{transform:scale(.9);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
@keyframes gc-coin{0%{opacity:0;transform:translate(-50%,-50%) scale(.6)}15%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.35)}}
.gc-wrap{animation:gc-appear .5s cubic-bezier(.2,1.4,.4,1) both}
.gc-float{animation:gc-float 3.2s ease-in-out infinite}
.gc-ring{stroke-dasharray:188.5;animation:gc-ring 10s linear forwards}
.gc-shine{animation:gc-shine 2.4s ease-in-out infinite}
.gc-blink{animation:gc-blink .5s linear 7s 6}
.gc-flip{animation:gc-flip .5s cubic-bezier(.2,.9,.3,1) both}
.gc-pop{animation:gc-pop .4s ease-out both}
.gc-coin{position:fixed;left:50%;top:50%;z-index:75;font-size:1.5rem;pointer-events:none;opacity:0;animation:gc-coin .95s cubic-bezier(.5,0,.8,.4) both}
@media (prefers-reduced-motion:reduce){.gc-root *{animation:none!important}}
`;

/** Coins fly from the card to the CP counter in the top right corner. */
function Coins() {
    const [coins] = useState(() => {
        const dx = window.innerWidth / 2 - 120;
        const dy = -(window.innerHeight / 2 - 70);
        return Array.from({ length: 12 }, (_, i) => ({
            i,
            dx: dx + (Math.random() - 0.5) * 60,
            dy: dy + (Math.random() - 0.5) * 30,
            sx: (Math.random() - 0.5) * 120,
            sy: (Math.random() - 0.5) * 40,
        }));
    });
    return (
        <>
            {coins.map((c) => (
                <span
                    key={c.i}
                    className="gc-coin"
                    style={
                        {
                            "--dx": `${c.dx}px`,
                            "--dy": `${c.dy}px`,
                            marginLeft: c.sx,
                            marginTop: c.sy,
                            animationDelay: `${c.i * 60}ms`,
                        } as CSSProperties
                    }
                >
                    🪙
                </span>
            ))}
        </>
    );
}

/**
 * Golden chip (design doc 5.3): now and then a golden chip floats around the CPU. Clicking it opens
 * a quick review question about knowledge the player has already unlocked.
 * Right on the first try: full bonus. Wrong: one different question for half the bonus.
 * Wrong again: no bonus and an explanation. It never affects scores, streaks or unlocks.
 */
export function GoldenChip({ state, incomePerSecond, blocked, onAnswer, onReward }: GoldenChipProps) {
    const [phase, setPhase] = useState<Phase>("idle");
    const [pos, setPos] = useState({ dx: 22, dy: -12 });
    const [q, setQ] = useState<ChipQuestion | null>(null);
    const [picked, setPicked] = useState<number | null>(null);
    const [wrongs, setWrongs] = useState<Review[]>([]);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [burst, setBurst] = useState(0);

    // Latest values for the timers
    const stateRef = useRef(state);
    const blockedRef = useRef(blocked);
    const phaseRef = useRef(phase);
    const devRef = useRef(false); // true when the chip was started from the console (development only)
    const usedRef = useRef<string[]>([]); // questions used in this chip
    const recentRef = useRef<string[]>([]); // questions of the last chips

    useEffect(() => {
        stateRef.current = state;
        blockedRef.current = blocked;
        phaseRef.current = phase;
    });

    const fullBonus = Math.max(1, Math.round(BONUS_SECONDS * incomePerSecond));

    const spawn = useCallback((dev = false) => {
        if (phaseRef.current !== "idle") return;
        devRef.current = dev;
        if (!dev && (blockedRef.current || !hasChipQuestions(stateRef.current))) return;
        const angle = Math.random() * Math.PI * 2;
        const r = 20 + Math.random() * 8; // distance from the CPU, in vmin
        setPos({ dx: Math.round(Math.cos(angle) * r * 1.5), dy: Math.round(Math.sin(angle) * r * 0.8) });
        setPhase("chip");
    }, []);

    // Every 30 seconds: 10 percent chance
    useEffect(() => {
        const id = window.setInterval(() => {
            console.log("[chip tick]", { phase: phaseRef.current, blocked: blockedRef.current, has: hasChipQuestions(stateRef.current), done: stateRef.current.completedLearningCheckpoints });
            if (Math.random() < CHANCE) spawn();
        }, CHECK_EVERY_MS);
        return () => window.clearInterval(id);
    }, [spawn]);

    // Development only: window.__spawnGoldenChip() in the console
    useEffect(() => {
        if (process.env.NODE_ENV === "production") return;
        const w = window as unknown as { __spawnGoldenChip?: () => void };
        w.__spawnGoldenChip = () => spawn(true);
        return () => {
            delete w.__spawnGoldenChip;
        };
    }, [spawn]);

    // The chip fades away after about 10 seconds. No penalty.
    useEffect(() => {
        if (phase !== "chip") return;
        const id = window.setTimeout(() => setPhase("idle"), STAY_MS);
        return () => window.clearTimeout(id);
    }, [phase]);

    // It disappears when something that must not be disturbed opens
    useEffect(() => {
        if (blocked && phase === "chip" && !devRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- hide the chip when the screen gets busy
            setPhase("idle");
        }
    }, [blocked, phase]);

    const openChip = () => {
        const first = pickChipQuestion(stateRef.current, { avoid: recentRef.current, anyStage: devRef.current });
        if (!first) {
            setPhase("idle");
            return;
        }
        usedRef.current = [first.id];
        setQ(first);
        setPicked(null);
        setWrongs([]);
        setOutcome(null);
        setPhase("q1");
    };

    const choose = (index: number) => {
        if (!q || picked !== null) return;
        setPicked(index);
        const correct = index === q.correctIndex;
        onAnswer({ checkpointId: q.checkpointId, questionId: q.id, concept: q.concept, correct });
        if (correct) {
            const half = phase === "q2";
            const reward = half ? Math.max(1, Math.round(fullBonus / 2)) : fullBonus;
            onReward(reward);
            setOutcome({ kind: half ? "half" : "full", reward });
            setBurst((b) => b + 1);
        } else {
            setWrongs((w) => [...w, { q, picked: index }]);
            if (phase === "q2") setOutcome({ kind: "none", reward: 0 });
        }
    };

    const nextQuestion = () => {
        const second = pickChipQuestion(stateRef.current, {
            avoid: recentRef.current,
            forbid: usedRef.current,
            anyStage: devRef.current,
        });
        if (!second) {
            setOutcome({ kind: "none", reward: 0 });
            return;
        }
        usedRef.current = [...usedRef.current, second.id];
        setQ(second);
        setPicked(null);
        setPhase("q2");
    };

    const close = () => {
        recentRef.current = [...recentRef.current, ...usedRef.current].slice(-4);
        setPhase("idle");
        setQ(null);
        setPicked(null);
        setOutcome(null);
        setWrongs([]);
    };

    const reveal = outcome !== null;
    const needsSecond = phase === "q1" && picked !== null && q !== null && picked !== q.correctIndex && !outcome;

    const optionClass = (i: number) => {
        const base =
            "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition";
        if (!q) return base;
        if (picked === null) return `${base} border-edge bg-panel hover:border-amber-400 hover:shadow-sm`;
        if (i === q.correctIndex && (picked === i || reveal)) return `${base} border-success bg-success/10 font-semibold`;
        if (i === picked) return `${base} border-red-500/60 bg-red-500/10 text-muted line-through`;
        return `${base} border-edge text-muted`;
    };

    return (
        <div className="gc-root">
            <style>{CSS}</style>

            {/* The floating chip, around the CPU */}
            {phase === "chip" && (
                <div className="pointer-events-none fixed inset-0 z-[35]">
                    <div
                        className="gc-wrap absolute"
                        style={{ left: `calc(50% + ${pos.dx}vmin)`, top: `calc(46% + ${pos.dy}vmin)` }}
                    >
                        <div className="gc-float flex flex-col items-center">
                            <button
                                type="button"
                                onClick={openChip}
                                aria-label="Golden chip: quick review"
                                className="gc-blink pointer-events-auto rounded-2xl transition hover:scale-110"
                            >
                                <svg viewBox="0 0 64 64" width={76} height={76} style={{ filter: "drop-shadow(0 4px 10px rgba(245,158,11,.55))" }}>
                                    <defs>
                                        <linearGradient id="gc-gold" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0" stopColor="#fde68a" />
                                            <stop offset=".5" stopColor="#f59e0b" />
                                            <stop offset="1" stopColor="#b45309" />
                                        </linearGradient>
                                        <clipPath id="gc-clip">
                                            <rect x="14" y="14" width="36" height="36" rx="8" />
                                        </clipPath>
                                    </defs>
                                    <circle className="gc-ring" cx="32" cy="32" r="30" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" transform="rotate(-90 32 32)" />
                                    <g stroke="#b45309" strokeWidth="2.2" strokeLinecap="round">
                                        <path d="M22 8v6M32 8v6M42 8v6M22 50v6M32 50v6M42 50v6M8 22h6M8 32h6M8 42h6M50 22h6M50 32h6M50 42h6" />
                                    </g>
                                    <rect x="14" y="14" width="36" height="36" rx="8" fill="url(#gc-gold)" stroke="#92400e" strokeWidth="1.5" />
                                    <rect x="23" y="23" width="18" height="18" rx="4" fill="#fef3c7" opacity=".9" />
                                    <text x="32" y="37.5" textAnchor="middle" fontSize="14" fontWeight="700" fill="#b45309">?</text>
                                    <g clipPath="url(#gc-clip)">
                                        <rect className="gc-shine" x="10" y="0" width="9" height="64" fill="#fff" opacity=".65" />
                                    </g>
                                </svg>
                            </button>
                            <span className="pointer-events-none mt-1 rounded-full border border-amber-400/60 bg-amber-400/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-600">
                                Quick review
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* The review card */}
            {(phase === "q1" || phase === "q2") && q && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4">
                    <div className="gc-flip max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-amber-400/70 bg-panel p-6 shadow-2xl">
                        <div className="flex items-center justify-between gap-3">
                            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-amber-600">
                                ★ Golden chip · Quick review
                            </p>
                            <span className="font-mono text-[10px] text-muted">Stage {q.stageNumber}</span>
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-muted">
                            {phase === "q2"
                                ? `Second chance · half bonus (+${fmt(Math.max(1, Math.round(fullBonus / 2)))} CP)`
                                : `Right on the first try: +${fmt(fullBonus)} CP`}
                        </p>

                        <h3 className="mt-4 text-lg font-medium leading-snug">{q.scenario}</h3>

                        <div className="mt-4 flex flex-col gap-2.5">
                            {q.choices.map((choice, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={picked !== null}
                                    onClick={() => choose(i)}
                                    className={optionClass(i)}
                                >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background font-mono text-xs text-muted">
                                        {LETTERS[i]}
                                    </span>
                                    {choice}
                                </button>
                            ))}
                        </div>

                        {needsSecond && (
                            <p className="gc-pop mt-4 rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 text-sm text-amber-700">
                                Not quite. Here is a different question for half the bonus.
                            </p>
                        )}
                        {outcome?.kind === "full" && (
                            <p className="gc-pop mt-4 rounded-xl border border-success/40 bg-success-soft p-3 font-mono text-sm text-success">
                                Correct on the first try! +{fmt(outcome.reward)} CP
                            </p>
                        )}
                        {outcome?.kind === "half" && (
                            <p className="gc-pop mt-4 rounded-xl border border-success/40 bg-success-soft p-3 font-mono text-sm text-success">
                                Correct! Half bonus: +{fmt(outcome.reward)} CP
                            </p>
                        )}
                        {outcome?.kind === "none" && (
                            <p className="gc-pop mt-4 rounded-xl border border-edge bg-panel-muted p-3 text-sm">
                                No bonus this time, and that is fine. Mistakes are how we learn.
                            </p>
                        )}

                        {outcome && wrongs.length > 0 && (
                            <div className="mt-4 flex flex-col gap-3">
                                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-violet">Quick fix</p>
                                {wrongs.map((w, i) => {
                                    const pickedText = w.q.choices[w.picked] ?? "";
                                    const correctText = w.q.choices[w.q.correctIndex] ?? "";
                                    const fix = buildQuickFix(w.q.checkpointId, pickedText, correctText);
                                    return (
                                        <div key={i} className="rounded-xl border border-edge bg-panel-muted p-3 text-sm">
                                            <p className="text-muted">{w.q.scenario}</p>
                                            <p className="mt-1.5">
                                                You chose “{pickedText}”. The answer is “{correctText}”.
                                            </p>
                                            {fix && <p className="mt-2 whitespace-pre-line">{fix}</p>}
                                            <p className="mt-2 text-muted">{w.q.explanation}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-5 flex justify-end gap-2">
                            {needsSecond && (
                                <button
                                    type="button"
                                    onClick={nextQuestion}
                                    className="rounded-lg bg-accent px-6 py-2 font-mono text-sm font-bold text-white transition hover:opacity-90"
                                >
                                    Next question →
                                </button>
                            )}
                            {outcome && (
                                <button
                                    type="button"
                                    onClick={close}
                                    className="rounded-lg bg-accent px-6 py-2 font-mono text-sm font-bold text-white transition hover:opacity-90"
                                >
                                    Back to the CPU
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {burst > 0 && <Coins key={burst} />}
        </div>
    );
}
