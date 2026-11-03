"use client";

import { useState } from "react";
import type { CheckpointQuestion } from "@/data/checkpoints";
import type { QuizFeedback } from "@/types/game";

interface Stage2MissionViewProps {
  question: CheckpointQuestion;
  step: number;
  totalMissions: number;
  feedback: QuizFeedback | null;
  hintOpened: boolean;
  attempt: number;
  selectedChoice: number | null;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onContinue: () => void;
  onOpenHint: () => void;
}

export function Stage2MissionView({
  question,
  step,
  totalMissions,
  feedback,
  hintOpened,
  attempt,
  selectedChoice,
  onSelect,
  onSubmit,
  onContinue,
  onOpenHint,
}: Stage2MissionViewProps) {
  // Determine mission sub-step mode based on current step index (1: Spot it, 2: Fix it, 3: Beat Budget)
  const mode = step === 0 ? "spot" : step === 1 ? "fix" : "budget";

  const [selectedCycle, setSelectedCycle] = useState<number | null>(4);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const instrs = [
    { id: "I1", text: "LW R1, 0(R2)", desc: "loads R1" },
    { id: "I2", text: "ADD R4, R5, R6", desc: "fetched on wrong path" },
    { id: "I3", text: "SUB R7, R8, R9", desc: "independent" },
    { id: "I4", text: "OR R10, R11, R12", desc: "the jump target" },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Top Header Navigation Indicators */}
      <div className="flex items-center justify-between border-b border-edge/60 pb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            ROUND · GROUP A · REASONING MISSION
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 font-mono text-xs ${mode === "spot" ? "bg-accent text-white font-bold" : "border border-edge text-muted"}`}>
            1 SPOT IT
          </span>
          <span className={`rounded-full px-3 py-1 font-mono text-xs ${mode === "fix" ? "bg-accent text-white font-bold" : "border border-edge text-muted"}`}>
            2 FIX IT
          </span>
          <span className={`rounded-full px-3 py-1 font-mono text-xs ${mode === "budget" ? "bg-accent text-white font-bold" : "border border-edge text-muted text-opacity-50"}`}>
            3 BEAT THE BUDGET
          </span>
          <span className="ml-3 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-0.5 font-mono text-xs font-semibold text-rose-500">
            ATTEMPT {attempt} OF 2
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_320px]">
        {/* Left Side: Interactive Pipeline Time-Space Diagram Grid */}
        <div className="rounded-2xl border border-edge bg-panel p-6 shadow-sm">
          <h2 className="font-mono text-2xl font-bold uppercase tracking-tight text-foreground">
            {mode === "spot" && "SPOT THE COLLISION"}
            {mode === "fix" && "FIX THE DAMAGE"}
            {mode === "budget" && "BEAT THE CYCLE BUDGET"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {question.scenario}
          </p>

          {/* Clock Cycle Grid */}
          <div className="mt-8 overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Cycle Numbers Header */}
              <div className="grid grid-cols-[140px_repeat(8,1fr)] gap-2 font-mono text-xs text-muted text-center mb-2">
                <div></div>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
                  <div key={c} className={c === selectedCycle ? "font-bold text-accent" : ""}>
                    {c}
                  </div>
                ))}
              </div>

              {/* Instruction Rows */}
              {instrs.map((inst, rIdx) => (
                <div key={inst.id} className="grid grid-cols-[140px_repeat(8,1fr)] gap-2 items-center my-2">
                  <div className="font-mono text-xs">
                    <span className="font-bold text-foreground mr-1.5">{inst.id}</span>
                    <span className="text-muted text-[11px]">{inst.text}</span>
                  </div>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => {
                    const stagePos = c - rIdx;
                    const stageNames = ["IF", "ID", "EX", "MEM", "WB"];
                    const stageName = stagePos >= 1 && stagePos <= 5 ? stageNames[stagePos - 1] : null;

                    const isCollision = mode === "spot" && c === 4 && (rIdx === 0 || rIdx === 3);

                    return (
                      <div
                        key={c}
                        onClick={() => setSelectedCycle(c)}
                        className={`flex h-9 items-center justify-center rounded-lg font-mono text-xs font-semibold cursor-pointer transition border ${
                          stageName
                            ? isCollision
                              ? "border-rose-500 bg-rose-500/20 text-rose-500 font-bold animate-pulse"
                              : "border-edge bg-panel-muted text-foreground"
                            : "border-transparent"
                        }`}
                      >
                        {stageName}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend Badges */}
          <div className="mt-6 flex items-center gap-3 font-mono text-xs text-muted border-t border-edge/40 pt-4">
            <span className="rounded bg-sky-500/20 px-2 py-0.5 text-sky-400">IF</span>
            <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-indigo-400">ID</span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-400">EX</span>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-400">MEM</span>
            <span className="rounded bg-pink-500/20 px-2 py-0.5 text-pink-400">WB</span>
            {mode === "fix" && <span className="rounded bg-rose-500/20 px-2 py-0.5 text-rose-400">RED = wrong path</span>}
          </div>

          {/* Attempt Feedback Box */}
          {feedback && !feedback.correct && (
            <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 font-mono text-xs text-rose-400">
              <span className="font-bold uppercase">ATTEMPT {attempt}: </span>
              {feedback.explanation || "Not quite right. Review the hazard timing and try again."}
            </div>
          )}
        </div>

        {/* Right Side: Toolbelt and Answer Option Cards */}
        <div className="flex flex-col justify-between rounded-2xl border border-edge bg-panel p-6 shadow-sm">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
              {mode === "fix" ? "TOOLBELT" : "YOUR ANSWER"}
            </p>

            {/* Display Toolbelt in Fix mode */}
            {mode === "fix" ? (
              <div className="mt-4 flex flex-col gap-3">
                {[
                  { id: "stall", name: "STALL", desc: "Hold instructions back and insert a bubble." },
                  { id: "forward", name: "FORWARD", desc: "Pass a result straight to the next stop." },
                  { id: "flush", name: "FLUSH", desc: "Cancel instructions already in the pipeline." },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setSelectedTool(tool.id)}
                    className={`rounded-xl border p-3.5 text-left transition ${
                      selectedTool === tool.id
                        ? "border-accent bg-accent/15 text-accent font-bold"
                        : "border-edge bg-panel-muted hover:border-accent/50"
                    }`}
                  >
                    <p className="font-mono text-xs font-bold uppercase">{tool.name}</p>
                    <p className="mt-1 text-xs text-muted leading-relaxed">{tool.desc}</p>
                  </button>
                ))}
              </div>
            ) : (
              /* Display Choice Options in Spot mode */
              <div className="mt-4 flex flex-col gap-2.5">
                {question.choices.map((choice, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!!feedback}
                    onClick={() => onSelect(idx)}
                    className={`rounded-xl border p-3 text-left font-mono text-xs transition ${
                      selectedChoice === idx
                        ? "border-accent bg-accent/15 text-accent font-bold"
                        : "border-edge bg-panel-muted hover:border-accent/40"
                    }`}
                  >
                    <span className="mr-2 text-muted">{String.fromCharCode(65 + idx)}.</span>
                    {choice}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-6 border-t border-edge/60 pt-4">
            {!feedback ? (
              <button
                type="button"
                disabled={selectedChoice === null && !selectedTool}
                onClick={onSubmit}
                className="w-full rounded-xl bg-accent px-4 py-3 font-mono text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                CHECK ANSWER
              </button>
            ) : (
              <button
                type="button"
                onClick={onContinue}
                className="w-full rounded-xl bg-accent px-4 py-3 font-mono text-xs font-bold text-white transition hover:opacity-90"
              >
                CONTINUE →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Optional Hint Pop-up Window */}
      {hintOpened && question.hint && (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-amber-400/60 bg-panel p-4 shadow-2xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber-500 font-bold">HINT · CREDIT IS NOW ×0.5</p>
          <p className="mt-2 text-xs leading-relaxed text-foreground">{question.hint}</p>
          <button
            type="button"
            onClick={() => {}}
            className="mt-3 w-full rounded-lg bg-accent px-3 py-1.5 font-mono text-xs font-bold text-white"
          >
            GOT IT
          </button>
        </div>
      )}
    </div>
  );
}
