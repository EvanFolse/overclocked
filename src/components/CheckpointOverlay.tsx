"use client";

import type { LearningCheckpoint } from "@/data/checkpoints";
import type { QuizFeedback } from "@/types/game";
import { CpuCycleVisual } from "@/components/CpuCycleVisual";
import { MemoryHierarchyVisual } from "@/components/MemoryHierarchyVisual";

interface CheckpointOverlayProps {
  checkpoint: LearningCheckpoint;
  step: number;
  selectedChoice: number | null;
  feedback: QuizFeedback | null;
  lessonOpen: boolean;
  onOpenLesson: () => void;
  onCloseLesson: () => void;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onContinue: () => void;
}

export function CheckpointOverlay({
  checkpoint,
  step,
  selectedChoice,
  feedback,
  lessonOpen,
  onOpenLesson,
  onCloseLesson,
  onSelect,
  onSubmit,
  onContinue,
}: CheckpointOverlayProps) {
  const question = checkpoint.questions[step];
  const isBoot = checkpoint.id === "cpu-basics";

  if (!lessonOpen) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4">
        <div className="w-full max-w-md rounded-2xl border border-warning/40 bg-panel/95 p-6 text-center shadow-2xl backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-warning">
            {checkpoint.stallHeadline}
          </p>
          <h2 className="mt-2 font-mono text-xl font-bold text-foreground">
            {checkpoint.stallSubtitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{checkpoint.stallBody}</p>
          <p className="mt-3 font-mono text-[11px] text-accent-text">
            Compute/sec paused at 0 until this is resolved.
          </p>
          <button
            type="button"
            onClick={onOpenLesson}
            className="mt-5 w-full rounded-xl border border-warning/50 bg-warning/15 px-4 py-3 font-mono text-sm font-semibold text-warning transition hover:opacity-90"
          >
            {isBoot ? "Build Your First CPU" : "Diagnose"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-violet/30 bg-panel p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet">
              {checkpoint.courseUnit} · Required · Step {step + 1}/
              {checkpoint.questions.length}
            </p>
            <h2 className="mt-1 font-mono text-lg font-semibold text-foreground">
              {checkpoint.title}
            </h2>
          </div>
          {!isBoot && (
            <button
              type="button"
              onClick={onCloseLesson}
              className="rounded-lg border border-edge px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              Minimize
            </button>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-edge bg-panel-muted p-3">
          <p className="text-sm leading-relaxed text-foreground">{checkpoint.reading}</p>
        </div>

        {(checkpoint.highlightCycle || checkpoint.highlightMemory) && (
          <div className="mt-3 flex flex-col gap-2">
            {checkpoint.highlightCycle && (
              <CpuCycleVisual active={checkpoint.highlightCycle} compact />
            )}
            {checkpoint.highlightMemory && (
              <MemoryHierarchyVisual active={checkpoint.highlightMemory} compact />
            )}
          </div>
        )}

        {question && (
          <>
            <p className="mt-4 text-sm font-medium leading-relaxed text-foreground">
              {question.scenario}
            </p>

            <div className="mt-3 flex flex-col gap-2">
              {question.choices.map((choice, index) => {
                const isSelected = selectedChoice === index;
                let style =
                  "border-edge bg-panel-muted text-foreground hover:border-violet/40";
                if (feedback) {
                  if (index === question.correctIndex) {
                    style = "border-success/60 bg-success-soft text-success";
                  } else if (isSelected && !feedback.correct) {
                    style = "border-rose-400/50 bg-rose-500/10 text-rose-500";
                  } else {
                    style = "border-edge/50 bg-panel text-muted";
                  }
                } else if (isSelected) {
                  style = "border-violet/60 bg-violet-soft text-violet";
                }

                return (
                  <button
                    key={choice}
                    type="button"
                    disabled={!!feedback?.correct}
                    onClick={() => onSelect(index)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${style}`}
                  >
                    <span className="mr-2 font-mono text-xs text-muted">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {choice}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {feedback && (
          <div
            className={`mt-4 rounded-xl border p-3 text-sm ${
              feedback.correct
                ? "border-success/40 bg-success-soft text-success"
                : "border-warning/40 bg-warning/10 text-warning"
            }`}
          >
            <p className="font-mono text-xs font-semibold uppercase tracking-wider">
              {feedback.correct
                ? feedback.unlockedUpgrade
                  ? `${feedback.unlockedUpgrade} unlocked`
                  : "Correct"
                : "Not quite"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{feedback.explanation}</p>
            {!feedback.correct && feedback.hint && (
              <p className="mt-2 text-xs text-warning">Hint: {feedback.hint}</p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {!feedback ? (
            <button
              type="button"
              disabled={selectedChoice == null}
              onClick={onSubmit}
              className="rounded-lg border border-violet/50 bg-violet-soft px-4 py-2 font-mono text-sm font-semibold text-violet disabled:opacity-40"
            >
              Submit
            </button>
          ) : feedback.correct ? (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-lg border border-accent/40 bg-accent-soft px-4 py-2 font-mono text-sm font-semibold text-accent-text"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-2 font-mono text-sm font-semibold text-warning"
            >
              Try Again
            </button>
          )}
        </div>

        <p className="mt-5 border-t border-edge pt-3 text-[10px] leading-relaxed text-muted">
          <span className="font-semibold text-foreground">Course basis:</span> CSC 3501 —
          Computer Organization and Design
          {checkpoint.sources[0] && (
            <>
              <br />
              <span className="font-semibold text-foreground">Further reading:</span>{" "}
              <a
                href={checkpoint.sources[0].url}
                target="_blank"
                rel="noreferrer"
                className="text-accent-text underline-offset-2 hover:underline"
              >
                {checkpoint.sources[0].label}
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
