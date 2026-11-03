"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { STAGE_4_PARTS } from "@/data/stage4Place";
import type { CpuPart } from "@/data/stage1Place";

interface PlaceStepMemoryProps {
  onComplete: () => void;
}

// Same flip-card engine as Stage 1 PlaceStep, scoped to Stage 4 so shared PlaceStep stays untouched.
const PEEK_MS = 1000;
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
.pl4-scene{perspective:800px}
.pl4-card{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.3,.8,.3,1)}
.pl4-card.pl4-up{transform:rotateY(180deg)}
.pl4-face{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:.75rem;border-width:1px;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.pl4-front{transform:rotateY(180deg)}
@keyframes pl4-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
@keyframes pl4-lock{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)}}
@keyframes pl4-glow{0%{box-shadow:0 0 0 0 rgba(52,211,153,.55)}100%{box-shadow:0 0 0 16px rgba(52,211,153,0)}}
@keyframes pl4-spark{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.2)}}
@keyframes pl4-in{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
@keyframes pl4-wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes pl4-pulse{0%,100%{opacity:.55}50%{opacity:1}}
.pl4-shake{animation:pl4-shake .4s}
.pl4-lock{animation:pl4-lock .45s ease-out,pl4-glow .8s ease-out;border-radius:.75rem}
.pl4-spark{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:9999px;pointer-events:none;animation:pl4-spark .8s ease-out forwards}
.pl4-in{animation:pl4-in .35s ease-out both}
.pl4-wave{animation:pl4-wave .9s ease-in-out 2}
.pl4-pulse{animation:pl4-pulse 1.2s ease-in-out infinite}
.pl4-pins-l,.pl4-pins-r{position:absolute;top:14px;bottom:14px;width:7px;opacity:.55;background:repeating-linear-gradient(to bottom,var(--pl-pin,#94a3b8) 0 6px,transparent 6px 14px);border-radius:2px}
.pl4-pins-l{left:-8px}
.pl4-pins-r{right:-8px}
@media (prefers-reduced-motion:reduce){.pl4-root *{animation:none!important;transition:none!important}}
`;

export function PlaceStepMemory({ onComplete }: PlaceStepMemoryProps) {
  const parts = STAGE_4_PARTS;
  const [layout, setLayout] = useState<CpuPart[]>(parts);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placed, setPlaced] = useState<Set<number>>(new Set());
  const [peekSlot, setPeekSlot] = useState<number | null>(null);
  const [flips, setFlips] = useState(0);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [justPlaced, setJustPlaced] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const sparkRef = useRef<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- shuffle after mount so SSR and hydration match
    setLayout(shuffle(parts));
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (sparkRef.current) window.clearTimeout(sparkRef.current);
    };
  }, [parts]);

  const total = parts.length;
  const currentPart = parts[currentIndex];
  const isCompleted = currentIndex >= total;

  const handleSlotClick = (slotIndex: number) => {
    if (isCompleted || !currentPart || peekSlot !== null || placed.has(slotIndex)) return;

    const hidden = layout[slotIndex]!;
    setFlips((f) => f + 1);

    if (hidden.id === currentPart.id) {
      setPlaced((prev) => new Set(prev).add(slotIndex));
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setFeedbackMsg(
        nextIndex >= total
          ? "All hierarchy levels placed — fastest at the top, largest at the bottom!"
          : null
      );
      setJustPlaced(slotIndex);
      if (sparkRef.current) window.clearTimeout(sparkRef.current);
      sparkRef.current = window.setTimeout(() => setJustPlaced(null), SPARK_MS);
    } else {
      setPeekSlot(slotIndex);
      setFeedbackMsg(
        `That's ${hidden.name}, not ${currentPart.name}. Remember where it is! No penalty.`
      );
      timerRef.current = window.setTimeout(() => setPeekSlot(null), PEEK_MS);
    }
  };

  const progress = Math.round((placed.size / total) * 100);

  return (
    <div className="pl4-root mx-auto max-w-4xl">
      <style>{CSS}</style>

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet">
          Memory hierarchy · Flip &amp; place ({placed.size} / {total})
        </p>
        <p className="font-mono text-[11px] text-muted">
          Flip cards to find where the active part belongs. Wrong cards flip back.
        </p>
      </div>

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="relative rounded-2xl border border-edge bg-panel-muted p-4">
          <span className="pl4-pins-l" aria-hidden />
          <span className="pl4-pins-r" aria-hidden />
          <div className="grid grid-cols-3 gap-2.5">
            {layout.map((part, slot) => {
              const isPlaced = placed.has(slot);
              const isPeek = peekSlot === slot;
              const faceUp = isPlaced || isPeek;
              const sceneClass = [
                "pl4-scene relative h-24 sm:h-28",
                isPeek ? "pl4-shake" : "",
                justPlaced === slot ? "pl4-lock" : "",
                isCompleted ? "pl4-wave" : "",
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
                    <div className={`pl4-card ${faceUp ? "pl4-up" : ""}`}>
                      <div className="pl4-face border-edge bg-panel shadow-sm transition group-hover:border-violet/60 group-hover:shadow-md">
                        <span className="font-mono text-[10px] text-muted">Slot {slot + 1}</span>
                        <span className="text-2xl font-bold text-violet/60">?</span>
                      </div>
                      <div
                        className={`pl4-face pl4-front px-1 text-center ${
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
                          <span className="font-mono text-[10px] text-success">✓ Placed</span>
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
                      return <span key={i} className="pl4-spark" style={style} />;
                    })}
                </div>
              );
            })}
          </div>
        </div>

        <section className="flex flex-col rounded-2xl border border-edge bg-panel p-5">
          {!isCompleted && currentPart ? (
            <div key={currentPart.id} className="pl4-in">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-violet">
                Find this part ({currentIndex + 1} / {total})
              </p>
              <h3 className="mt-2 font-mono text-2xl font-bold">{currentPart.name}</h3>
              <p className="mt-2 text-muted">{currentPart.description}</p>
            </div>
          ) : (
            <div className="pl4-in">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-success">
                Hierarchy complete
              </p>
              <h3 className="mt-2 font-mono text-2xl font-bold">All {total} levels placed 🎉</h3>
              <p className="mt-2 text-muted">
                Finished in {flips} flips (the fewest possible is {total}).
              </p>
            </div>
          )}

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-edge">
            <div
              className="h-full rounded-full bg-success transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-muted">Flips so far: {flips}</p>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {parts.map((p, i) => {
              const done = i < currentIndex;
              const current = i === currentIndex && !isCompleted;
              return (
                <li
                  key={p.id}
                  className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${
                    done
                      ? "border-success/50 bg-success-soft text-success"
                      : current
                        ? "pl4-pulse border-accent bg-accent-soft text-accent-text"
                        : "border-edge text-muted"
                  }`}
                >
                  {done ? `✓ ${p.name}` : current ? p.name : "?"}
                </li>
              );
            })}
          </ul>

          <div className="mt-4 min-h-[4.5rem]">
            {feedbackMsg && (
              <p
                className={`pl4-in rounded-xl border p-3 font-mono text-xs leading-relaxed ${
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
