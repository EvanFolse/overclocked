"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { STAGE_1_PARTS, CpuPart } from "@/data/stage1Place";

interface PlaceStepProps {
    onComplete: () => void;
}

// How long a wrong card stays face-up before flipping back
const PEEK_MS = 1000;
// How long the sparkles of a correct placement stay on screen
const SPARK_MS = 900;

const SPARK_COLORS = ["#34d399", "#facc15", "#60a5fa", "#f472b6"];

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
}

const CSS = `
.pl-scene{perspective:800px}
.pl-card{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.3,.8,.3,1)}
.pl-card.pl-up{transform:rotateY(180deg)}
.pl-face{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:.75rem;border-width:1px;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.pl-front{transform:rotateY(180deg)}
@keyframes pl-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
@keyframes pl-lock{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)}}
@keyframes pl-glow{0%{box-shadow:0 0 0 0 rgba(52,211,153,.55)}100%{box-shadow:0 0 0 16px rgba(52,211,153,0)}}
@keyframes pl-spark{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.2)}}
@keyframes pl-in{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
@keyframes pl-wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes pl-pulse{0%,100%{opacity:.55}50%{opacity:1}}
.pl-shake{animation:pl-shake .4s}
.pl-lock{animation:pl-lock .45s ease-out,pl-glow .8s ease-out;border-radius:.75rem}
.pl-spark{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:9999px;pointer-events:none;animation:pl-spark .8s ease-out forwards}
.pl-in{animation:pl-in .35s ease-out both}
.pl-wave{animation:pl-wave .9s ease-in-out 2}
.pl-pulse{animation:pl-pulse 1.2s ease-in-out infinite}
.pl-pins-l,.pl-pins-r{position:absolute;top:14px;bottom:14px;width:7px;opacity:.55;background:repeating-linear-gradient(to bottom,var(--pl-pin,#94a3b8) 0 6px,transparent 6px 14px);border-radius:2px}
.pl-pins-l{left:-8px}
.pl-pins-r{right:-8px}
@media (prefers-reduced-motion:reduce){.pl-root *{animation:none!important;transition:none!important}}
`;

export function PlaceStep({ onComplete }: PlaceStepProps) {
    // layout[slotIndex] = the part hidden under that card.
    // Starts in a fixed order (so SSR/hydration match), then gets shuffled on mount.
    const [layout, setLayout] = useState<CpuPart[]>(STAGE_1_PARTS);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [placed, setPlaced] = useState<Set<number>>(new Set()); // slots that stay face-up
    const [peekSlot, setPeekSlot] = useState<number | null>(null); // wrong card, temporarily face-up
    const [flips, setFlips] = useState(0);
    const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
    const [justPlaced, setJustPlaced] = useState<number | null>(null); // slot showing sparkles
    const timerRef = useRef<number | null>(null);
    const sparkRef = useRef<number | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- shuffle after mount so SSR and hydration match
        setLayout(shuffle(STAGE_1_PARTS));
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            if (sparkRef.current) window.clearTimeout(sparkRef.current);
        };
    }, []);

    const total = STAGE_1_PARTS.length;
    const currentPart = STAGE_1_PARTS[currentIndex];
    const isCompleted = currentIndex >= total;

    const handleSlotClick = (slotIndex: number) => {
        // Ignore clicks while a wrong card is still showing, or on already-placed cards
        if (isCompleted || !currentPart || peekSlot !== null || placed.has(slotIndex)) return;

        const hidden = layout[slotIndex]!;
        setFlips((f) => f + 1);

        if (hidden.id === currentPart.id) {
            setPlaced((prev) => new Set(prev).add(slotIndex));
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            setFeedbackMsg(nextIndex >= total ? "All CPU parts successfully placed on the die!" : null);
            // Sparkles on the card that was just placed
            setJustPlaced(slotIndex);
            if (sparkRef.current) window.clearTimeout(sparkRef.current);
            sparkRef.current = window.setTimeout(() => setJustPlaced(null), SPARK_MS);
        } else {
            // Reveal what's actually there (memory-game style), then flip back. No answer leak.
            setPeekSlot(slotIndex);
            setFeedbackMsg(`That's ${hidden.name}, not ${currentPart.name}. Remember where it is! No penalty.`);
            timerRef.current = window.setTimeout(() => setPeekSlot(null), PEEK_MS);
        }
    };

    const progress = Math.round((placed.size / total) * 100);

    return (
        <div className="pl-root mx-auto max-w-4xl">
            <style>{CSS}</style>

            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet">
                    CPU die · Flip &amp; place ({placed.size} / {total})
                </p>
                <p className="font-mono text-[11px] text-muted">
                    Flip cards to find where the active part belongs. Wrong cards flip back.
                </p>
            </div>

            <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                {/* Left: the die with 8 slots */}
                <div className="relative rounded-2xl border border-edge bg-panel-muted p-4">
                    <span className="pl-pins-l" aria-hidden />
                    <span className="pl-pins-r" aria-hidden />
                    <div className="grid grid-cols-4 gap-2.5">
                        {layout.map((part, slot) => {
                            const isPlaced = placed.has(slot);
                            const isPeek = peekSlot === slot;
                            const faceUp = isPlaced || isPeek;
                            const sceneClass = [
                                "pl-scene relative h-24 sm:h-28",
                                isPeek ? "pl-shake" : "",
                                justPlaced === slot ? "pl-lock" : "",
                                isCompleted ? "pl-wave" : "",
                            ].join(" ");
                            return (
                                <div
                                    key={slot}
                                    className={sceneClass}
                                    style={isCompleted ? { animationDelay: `${slot * 70}ms` } : undefined}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleSlotClick(slot)}
                                        disabled={isCompleted || isPlaced}
                                        aria-label={
                                            isPlaced ? `Slot ${slot + 1}: ${part.name}` : `Slot ${slot + 1}, face down`
                                        }
                                        className="group block h-full w-full"
                                    >
                                        <div className={`pl-card ${faceUp ? "pl-up" : ""}`}>
                                            {/* Back: face down */}
                                            <div className="pl-face border-edge bg-panel shadow-sm transition group-hover:border-violet/60 group-hover:shadow-md">
                                                <span className="font-mono text-[10px] text-muted">Slot {slot + 1}</span>
                                                <span className="text-2xl font-bold text-violet/60">?</span>
                                            </div>
                                            {/* Front: face up */}
                                            <div
                                                className={`pl-face pl-front px-1 text-center ${
                                                    isPlaced
                                                        ? "border-success/60 bg-success-soft"
                                                        : "border-amber-400/60 bg-amber-400/10"
                                                }`}
                                            >
                                                <span className="font-mono text-[10px] text-muted">Slot {slot + 1}</span>
                                                <span className="font-mono text-xs font-bold leading-tight text-foreground">
                                                    {part.name}
                                                </span>
                                                {isPlaced && (
                                                    <span className="font-mono text-[10px] text-success">✓ Embedded</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {justPlaced === slot &&
                                        Array.from({ length: 8 }).map((_, i) => {
                                            const a = (i / 8) * Math.PI * 2;
                                            const style = {
                                                "--dx": `${Math.round(Math.cos(a) * 52)}px`,
                                                "--dy": `${Math.round(Math.sin(a) * 52)}px`,
                                                background: SPARK_COLORS[i % SPARK_COLORS.length],
                                            } as CSSProperties;
                                            return <span key={i} className="pl-spark" style={style} />;
                                        })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: the active part, progress and feedback */}
                <section className="flex flex-col rounded-2xl border border-edge bg-panel p-5">
                    {!isCompleted && currentPart ? (
                        <div key={currentPart.id} className="pl-in">
                            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-violet">
                                Find this part ({currentIndex + 1} / {total})
                            </p>
                            <h3 className="mt-2 font-mono text-2xl font-bold">{currentPart.name}</h3>
                            <p className="mt-2 text-muted">{currentPart.description}</p>
                        </div>
                    ) : (
                        <div className="pl-in">
                            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-success">Die complete</p>
                            <h3 className="mt-2 font-mono text-2xl font-bold">All {total} parts embedded 🎉</h3>
                            <p className="mt-2 text-muted">
                                Finished in {flips} flips (the fewest possible is {total}).
                            </p>
                        </div>
                    )}

                    {/* Progress bar */}
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-edge">
                        <div
                            className="h-full rounded-full bg-success transition-[width] duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-1.5 font-mono text-[11px] text-muted">Flips so far: {flips}</p>

                    {/* Which parts are done */}
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                        {STAGE_1_PARTS.map((p, i) => {
                            const done = i < currentIndex;
                            const current = i === currentIndex && !isCompleted;
                            return (
                                <li
                                    key={p.id}
                                    className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${
                                        done
                                            ? "border-success/50 bg-success-soft text-success"
                                            : current
                                              ? "pl-pulse border-accent bg-accent-soft text-accent-text"
                                              : "border-edge text-muted"
                                    }`}
                                >
                                    {done ? `✓ ${p.name}` : current ? p.name : "?"}
                                </li>
                            );
                        })}
                    </ul>

                    {/* Feedback (fixed height so the layout does not jump) */}
                    <div className="mt-4 min-h-[4.5rem]">
                        {feedbackMsg && (
                            <p
                                className={`pl-in rounded-xl border p-3 font-mono text-xs leading-relaxed ${
                                    isCompleted
                                        ? "border-success/40 bg-success-soft text-success"
                                        : "border-amber-400/50 bg-amber-400/10 text-amber-700"
                                }`}
                            >
                                {feedbackMsg}
                            </p>
                        )}
                    </div>

                    {isCompleted && (
                        <button
                            type="button"
                            onClick={onComplete}
                            className="mt-4 w-full rounded-xl bg-accent py-3 font-mono text-sm font-bold tracking-widest text-white shadow-lg transition hover:opacity-90"
                        >
                            CONTINUE →
                        </button>
                    )}
                </section>
            </div>
        </div>
    );
}
