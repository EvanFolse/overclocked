"use client";

import type { Question, QuizFeedback } from "@/types/game";
import { formatMoney } from "@/lib/format";
import { UPGRADE_MAP } from "@/data/upgrades";

interface QuizPanelProps {
  open: boolean;
  question: Question | null;
  selectedChoice: number | null;
  feedback: QuizFeedback | null;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  onClose: () => void;
}

export function QuizPanel({
  open,
  question,
  selectedChoice,
  feedback,
  onSelect,
  onSubmit,
  onNext,
  onClose,
}: QuizPanelProps) {
  if (!open || !question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-violet/30 bg-panel p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-violet">
              Knowledge Check · {question.topic}
            </p>
            <h2 className="mt-1 font-mono text-lg font-semibold text-foreground">
              Computer Science Quiz
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-edge px-2 py-1 text-xs text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>

        <p className="text-sm leading-relaxed text-foreground">{question.question}</p>

        <div className="mt-4 flex flex-col gap-2">
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
                disabled={!!feedback}
                onClick={() => onSelect(index)}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-violet/40 ${style}`}
              >
                <span className="mr-2 font-mono text-xs text-muted">
                  {String.fromCharCode(65 + index)}.
                </span>
                {choice}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div
            className={`mt-4 rounded-xl border p-3 text-sm ${
              feedback.correct
                ? "border-success/40 bg-success-soft text-success"
                : "border-warning/40 bg-warning/10 text-warning"
            }`}
          >
            <p className="font-mono text-xs font-semibold uppercase tracking-wider">
              {feedback.correct ? "Correct!" : "Not quite"}
            </p>
            {feedback.correct ? (
              <p className="mt-1 text-foreground">
                Bonus:{" "}
                <span className="font-mono text-success">{formatMoney(feedback.bonus)}</span>
              </p>
            ) : (
              <p className="mt-1 text-foreground">
                Correct answer:{" "}
                <span className="font-semibold">{feedback.correctAnswer}</span>
              </p>
            )}
            <p className="mt-2 text-xs leading-relaxed text-muted">{feedback.explanation}</p>
            {feedback.unlockedUpgrade && (
              <p className="mt-2 font-mono text-xs text-accent-text">
                Unlocked: {UPGRADE_MAP[feedback.unlockedUpgrade].name}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {!feedback ? (
            <button
              type="button"
              disabled={selectedChoice === null}
              onClick={onSubmit}
              className="rounded-lg border border-violet/50 bg-violet-soft px-4 py-2 font-mono text-sm font-semibold text-violet transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit Answer
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="rounded-lg border border-accent/40 bg-accent-soft px-4 py-2 font-mono text-sm font-semibold text-accent-text transition hover:opacity-90"
            >
              Next Question
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-edge px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
