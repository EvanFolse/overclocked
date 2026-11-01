"use client";

import { useState } from "react";
import { GameBoard } from "@/components/GameBoard";

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);

  return (
    <>
      <GameBoard />
      {!hasStarted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="w-full max-w-3xl rounded-2xl border border-violet/30 bg-panel px-8 py-8 shadow-2xl sm:px-12 sm:py-10">
            <h2 className="font-mono text-xl font-bold tracking-[0.2em] text-foreground sm:text-2xl">
              WELCOME TO OVERCLOCKED
            </h2>

            <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-muted sm:text-base">
              {[
                ["Learn & Place", "meet each CPU part, then put it where it belongs on the chip."],
                ["Solve missions", "find what's broken, trace instructions, choose designs."],
                ["Pass the round", "70% or more unlocks the next stage."],
                ["CP grows by itself", "it sets the pace; knowledge opens the gate."],
              ].map(([title, text], i) => (
                <p key={title}>
                  <span className="font-semibold text-accent-text">
                    {i + 1} · {title}
                  </span>{" "}
                  — {text}
                </p>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setHasStarted(true)}
                className="rounded-xl border border-accent/60 bg-accent px-12 py-3.5 font-mono text-sm font-bold tracking-widest text-white shadow-lg transition hover:opacity-90 active:scale-[0.98]"
              >
                START BUILDING
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}