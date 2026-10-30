"use client";

import { useEffect, useState } from "react";
import type { CheckpointQuestion } from "@/data/checkpoints";
import type { QuizFeedback } from "@/types/game";
import { STAGE_1_BANK } from "@/data/bank/stage1";
import { STAGE_1_CPU_VIEWS, STAGE_1_EMPHASIS } from "@/data/bank/stage1CpuViews";

interface RoundViewProps {
    question: CheckpointQuestion | undefined;
    step: number;
    total: number;
    selectedChoice: number | null;
    feedback: QuizFeedback | null;
    hintOpened: boolean;
    isLastQuestion: boolean;
    onSelect: (index: number) => void;
    onSubmit: () => void;
    onContinue: () => void;
    onOpenHint: () => void;
}

const LETTERS = ["A", "B", "C", "D", "E"];

const NODE_STYLE = {
    ok: { box: "bg-success", icon: "✓" },
    fail: { box: "bg-red-500", icon: "✗" },
    idle: { box: "bg-edge", icon: "–" },
} as const;

export function RoundView({
    question,
    step,
    total,
    selectedChoice,
    feedback,
    hintOpened,
    isLastQuestion,
    onSelect,
    onSubmit,
    onContinue,
    onOpenHint,
}: RoundViewProps) {
    // Local display state only. Scoring, hints and rewards stay in the game engine.
    const [history, setHistory] = useState<(number | null)[]>(() => Array(total).fill(null));
    const [wrongSteps, setWrongSteps] = useState<number[]>([]); // questions that already had a wrong attempt
    const [hintFor, setHintFor] = useState<number | null>(null); // question whose hint pop-up is open

    // Clicking an option grades it right away (the engine's submit uses the selected option).
    useEffect(() => {
        if (selectedChoice !== null && !feedback) onSubmit();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChoice]);

    if (!question) return null;

    const meta = STAGE_1_BANK.mc.find((m) => m.scenario === question.scenario);
    const isMission = meta?.group === "mission";
    const view = isMission && meta ? STAGE_1_CPU_VIEWS[meta.id] : undefined;
    const missionCount = STAGE_1_BANK.mc.filter((m) => m.group === "mission" && !m.spare).length;

    const wrongOnce = wrongSteps.includes(step);
    const solved = !!feedback && (feedback.correct || !!feedback.revealed);
    const notQuite = !!feedback && !feedback.correct && !feedback.revealed;
    const attempt = wrongOnce || (feedback && !feedback.correct) ? 2 : 1;
    const correctText = question.choices[question.correctIndex];

    const creditNow: number | null = !solved
        ? null
        : (feedback.credit ?? (feedback.correct ? (wrongOnce ? (hintOpened ? 0.5 : 0.75) : 1) : 0));

    // Streak for display: +1 on a first-try correct, reset on a failed question, unchanged otherwise.
    const credits = history.map((c, i) => (i === step && solved ? creditNow : c));
    let streak = 0;
    for (const c of credits) {
        if (c === null) continue;
        if (c === 1) streak += 1;
        else if (c === 0) streak = 0;
    }

    const label = isMission
        ? `Mission ${step + 1} of ${missionCount} · What's broken?`
        : `Question ${step + 1} of ${total} · Multiple choice`;

    // Mission: first sentence is the headline and the rest is the subtitle. Multiple choice: the whole sentence.
    const [headline, ...rest] = isMission ? question.scenario.split(/(?<=[.?!])\s+/) : [question.scenario];
    const subtitle = rest.join(" ");
    const emphasis = view?.emphasis ?? (meta ? STAGE_1_EMPHASIS[meta.id] : undefined);

    const renderHeadline = () => {
        if (emphasis && headline.includes(emphasis)) {
            const [a, b] = headline.split(emphasis);
            return (
                <>
                    {a}
                    <b>{emphasis}</b>
                    {b}
                </>
            );
        }
        return headline;
    };

    const dotClass = (c: number | null, i: number) => {
        if (c === null) return i === step ? "bg-accent" : "bg-edge";
        if (c >= 1) return "bg-success";
        if (c > 0) return "bg-amber-400";
        return "bg-red-500";
    };

    const optionClass = (index: number) => {
        const base =
            "flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left text-base transition";
        if (feedback) {
            if (index === question.correctIndex && solved) {
                return `${base} border-success bg-success/10 font-semibold`;
            }
            if (index === selectedChoice && !feedback.correct) {
                return `${base} border-red-500/60 bg-red-500/10 text-muted line-through`;
            }
            return `${base} border-edge text-muted`;
        }
        return `${base} border-edge bg-panel hover:border-accent hover:shadow-sm`;
    };

    const canHint = !!question.hint && !solved && (wrongOnce || notQuite);

    const showHint = () => {
        if (!hintOpened) onOpenHint();
        setHintFor(step);
    };

    const handleContinue = () => {
        if (solved) {
            setHistory((h) => h.map((c, i) => (i === step ? creditNow : c)));
        } else if (notQuite) {
            setWrongSteps((w) => (w.includes(step) ? w : [...w, step]));
        }
        setHintFor(null);
        onContinue();
    };

    return (
        <div className="mx-auto flex max-w-6xl flex-col gap-5">
            {/* Progress + streak + attempt */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    {credits.map((c, i) => (
                        <span key={i} className={`h-2.5 w-9 rounded-full ${dotClass(c, i)}`} />
                    ))}
                </div>
                <p className="font-mono text-xs tracking-widest text-muted">
                    STREAK <b className="text-foreground">{streak}</b> · ATTEMPT{" "}
                    <b className="text-foreground">{attempt}</b> / 2
                </p>
            </div>

            <div
                className={
                    view ? "grid items-start gap-5 md:grid-cols-[minmax(280px,1fr)_2fr]" : "mx-auto w-full max-w-3xl"
                }
            >
                {/* Left: CPU VIEW (only for missions that have view data) */}
                {view && (
                    <section className="rounded-2xl border border-edge bg-panel p-6">
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">CPU view</p>
                        <div className="mt-4 rounded-xl bg-slate-900 px-4 py-3 font-mono text-sm text-slate-100">
                            {view.command}
                        </div>

                        <ul className="mt-5">
                            {view.nodes.map((n, i) => {
                                const fixed = n.label === "???" && !!feedback?.correct;
                                const s = NODE_STYLE[fixed ? "ok" : n.state];
                                return (
                                    <li key={i} className="relative flex items-center gap-4 pb-5 last:pb-0">
                                        {i < view.nodes.length - 1 && (
                                            <span className="absolute left-[19px] top-10 h-5 w-px bg-edge" />
                                        )}
                                        <span
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold text-white ${s.box}`}
                                        >
                                            {s.icon}
                                        </span>
                                        <div>
                                            <p className="font-mono text-sm font-bold">
                                                {fixed ? correctText.toUpperCase() : n.label}
                                            </p>
                                            <p className="text-sm text-muted">
                                                {fixed ? (view.fixedDetail ?? "working") : n.detail}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                )}

                {/* Right: question */}
                <section className="rounded-2xl border border-edge bg-panel p-8">
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">{label}</p>
                    <h2 className={`mt-3 font-medium leading-snug ${isMission ? "text-3xl" : "text-2xl"}`}>
                        {renderHeadline()}
                    </h2>
                    {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}

                    <div className="mt-8 flex max-w-xl flex-col gap-3">
                        {question.choices.map((choice, index) => (
                            <button
                                key={index}
                                type="button"
                                disabled={!!feedback}
                                onClick={() => onSelect(index)}
                                className={optionClass(index)}
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-background font-mono text-xs text-muted">
                                    {LETTERS[index]}
                                </span>
                                {choice}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 min-h-[3.5rem] max-w-xl">
                        {!feedback && wrongOnce && (
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-sm text-muted">Second attempt. The options were reshuffled.</p>
                                {canHint && (
                                    <button
                                        type="button"
                                        onClick={showHint}
                                        className="shrink-0 rounded-lg border border-amber-400/60 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-600 transition hover:opacity-90"
                                    >
                                        {hintOpened ? "Show hint again" : "Hint"}
                                    </button>
                                )}
                            </div>
                        )}

                        {notQuite && (
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-sm text-red-500">Not quite. Try again.</p>
                                <div className="flex shrink-0 gap-2">
                                    {canHint && (
                                        <button
                                            type="button"
                                            onClick={showHint}
                                            className="rounded-lg border border-amber-400/60 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-600 transition hover:opacity-90"
                                        >
                                            {hintOpened ? "Show hint again" : "Hint"}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleContinue}
                                        className="rounded-lg bg-accent px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
                                    >
                                        Try again
                                    </button>
                                </div>
                            </div>
                        )}

                        {solved && feedback && (
                            <div className="flex items-center justify-between gap-4">
                                <p className={`text-sm ${feedback.correct ? "text-success" : "text-red-500"}`}>
                                    {!feedback.correct && `The answer is ${feedback.correctAnswer || correctText}. `}
                                    {feedback.explanation}
                                    {creditNow !== null && (
                                        <span className="ml-2 font-mono text-xs text-muted">×{creditNow}</span>
                                    )}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleContinue}
                                    className="shrink-0 rounded-lg bg-accent px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
                                >
                                    {isLastQuestion ? "See result" : "Next"}
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Hint pop-up: bottom-right, stays until confirmed */}
            {hintFor === step && !solved && question.hint && (
                <div className="fixed bottom-6 right-6 z-[60] w-80 rounded-2xl border border-amber-400/60 bg-panel p-5 shadow-2xl">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-600">Hint</p>
                    <p className="mt-2 text-sm leading-relaxed">{question.hint}</p>
                    <p className="mt-2 text-xs text-muted">Using the hint caps this question at ×0.5 credit.</p>
                    <button
                        type="button"
                        onClick={() => setHintFor(null)}
                        className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                    >
                        Got it
                    </button>
                </div>
            )}
        </div>
    );
}
