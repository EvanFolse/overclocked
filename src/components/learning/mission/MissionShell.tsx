"use client";

import type { ReactNode } from "react";
import type { Phase } from "./useMissionAttempts";

interface Props {
  eyebrow: string;
  title: string;
  intro: string;
  attempt: number;
  phase: Phase;
  hint: string;
  hintOpened: boolean;
  onHint: () => void;
  feedback?: string;
  canCheck: boolean;
  checkLabel?: string;
  onCheck: () => void;
  onRetry: () => void;
  sideTitle: string;
  side: ReactNode;
  children: ReactNode;
}

export function MissionShell(p: Props) {
  const done = p.phase === "solved" || p.phase === "revealed";
  const canHint = p.attempt >= 2 && !done;

  return (
    <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-[1fr_290px]">
      <section className="rounded-2xl border border-edge bg-panel p-7 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent-text">{p.eyebrow}</p>
            <h2 className="mt-2 font-mono text-3xl font-bold tracking-wide">{p.title}</h2>
          </div>
          <span className="shrink-0 rounded-full border border-edge px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
            Attempt {p.attempt} of 2
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-muted">{p.intro}</p>

        <div className="mt-6">{p.children}</div>

        {p.feedback && (
          <div
            className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
              p.phase === "solved"
                ? "border-success/50 bg-success-soft text-success"
                : "border-red-400/50 bg-red-500/10 text-red-500"
            }`}
          >
            {p.feedback}
          </div>
        )}

        {p.hintOpened && !done && (
          <div className="mt-3 rounded-xl border border-amber-400/60 bg-amber-400/10 px-4 py-3 text-sm">
            <span className="mr-2 font-mono text-[10px] uppercase tracking-widest text-amber-600">
              Hint · credit is now x0.5
            </span>
            {p.hint}
          </div>
        )}

        <p className="mt-6 inline-block rounded-full border border-edge px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted">
          Tutor is closed during a round · hint unlocks after a wrong first attempt
        </p>
      </section>

      <aside className="flex flex-col gap-4 rounded-2xl border border-edge bg-panel p-6 shadow-lg">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">{p.sideTitle}</p>
        <div className="flex flex-1 flex-col gap-3">{p.side}</div>

        {canHint && !p.hintOpened && (
          <button
            type="button"
            onClick={p.onHint}
            className="rounded-lg border border-amber-400/60 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-600"
          >
            Hint (credit x0.5)
          </button>
        )}

        {p.phase === "playing" && (
          <button
            type="button"
            disabled={!p.canCheck}
            onClick={p.onCheck}
            className="rounded-lg bg-accent px-4 py-3 font-mono text-sm font-bold tracking-widest text-white disabled:opacity-40"
          >
            {p.checkLabel ?? "CHECK ANSWER"}
          </button>
        )}
        {p.phase === "wrong" && (
          <button
            type="button"
            onClick={p.onRetry}
            className="rounded-lg bg-accent px-4 py-3 font-mono text-sm font-bold tracking-widest text-white"
          >
            TRY AGAIN
          </button>
        )}
        {done && (
          <p className="text-center font-mono text-xs uppercase tracking-widest text-muted">
            {p.phase === "solved" ? "Solved" : "Answer revealed"}
          </p>
        )}
      </aside>
    </div>
  );
}
