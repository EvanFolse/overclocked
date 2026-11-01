"use client";

import { useEffect, useState } from "react";
import { StageLayout } from "@/components/learning/StageLayout";
import type { ReviewPage } from "@/lib/review";

/** After a FAILED round the player must stay on each page at least this long (design doc 6.1). */
const MIN_PAGE_SECONDS = 30;

interface ReviewPagesProps {
    pages: ReviewPage[];
    /** "fail": full-screen pages with a reading timer. "pass": a pop-up without a timer. */
    mode: "pass" | "fail";
    /** Called after the last page is confirmed */
    onDone: () => void;
}

/** Corrections after a round: what was confused, what each thing is, how to tell them apart. */
export function ReviewPages({ pages, mode, onDone }: ReviewPagesProps) {
    const timed = mode === "fail";
    const [index, setIndex] = useState(0);
    // Pages that were already on screen long enough. Going back to one does not lock it again.
    const [readPages, setReadPages] = useState<Set<number>>(new Set());
    const [elapsed, setElapsed] = useState(0);

    const isRead = !timed || readPages.has(index);

    const go = (i: number) => {
        setIndex(i);
        setElapsed(0);
    };

    // Count the seconds on a page that has not been read long enough
    useEffect(() => {
        if (isRead) return;
        const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
        return () => window.clearInterval(id);
    }, [index, isRead]);

    // Unlock the page when the time is up
    useEffect(() => {
        if (timed && elapsed >= MIN_PAGE_SECONDS) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- mark the page as read
            setReadPages((prev) => new Set(prev).add(index));
        }
    }, [elapsed, timed, index]);

    const page = pages[index];
    if (!page) return null;

    const isLast = index === pages.length - 1;
    const secondsLeft = Math.max(0, MIN_PAGE_SECONDS - elapsed);

    const body = (
        <>
            <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
                    Page {index + 1} of {pages.length}
                </p>
                {page.weakSpot && (
                    <span className="rounded-full border border-amber-400/60 bg-amber-400/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-600">
                        Weak spot · {page.weakSpot}
                    </span>
                )}
            </div>

            {page.question && <p className="mt-4 text-sm text-muted">Question: {page.question}</p>}

            <h2 className="mt-3 text-2xl font-medium leading-snug">{page.title}</h2>
            <p className="mt-3 text-lg font-medium leading-relaxed text-accent-text">{page.lead}</p>

            <div className="mt-5 flex flex-col gap-3">
                {page.sections.map((s, i) => (
                    <div
                        key={i}
                        className={`rounded-xl border p-4 ${
                            s.tone === "contrast"
                                ? "border-amber-400/50 bg-amber-400/10"
                                : "border-edge bg-panel-muted"
                        }`}
                    >
                        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-violet">
                            {s.heading}
                        </p>
                        <p className="mt-1.5 leading-relaxed">{s.text}</p>
                    </div>
                ))}
            </div>

            {page.why && (
                <p className="mt-4 text-sm leading-relaxed text-muted">
                    <b className="text-foreground">Why: </b>
                    {page.why}
                </p>
            )}

            {timed && (
                <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-edge">
                    <div
                        className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
                            isRead ? "bg-success" : "bg-accent"
                        }`}
                        style={{ width: isRead ? "100%" : `${(elapsed / MIN_PAGE_SECONDS) * 100}%` }}
                    />
                </div>
            )}

            <div className="mt-6 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => go(Math.max(0, index - 1))}
                    disabled={index === 0}
                    className="rounded-lg border border-edge px-4 py-2 font-mono text-sm text-muted transition hover:border-accent disabled:opacity-40"
                >
                    ← Back
                </button>
                <button
                    type="button"
                    disabled={!isRead}
                    onClick={() => (isLast ? onDone() : go(index + 1))}
                    className="rounded-lg bg-accent px-6 py-2 font-mono text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isRead
                        ? isLast
                            ? mode === "pass"
                                ? "Got it →"
                                : "Back to stages"
                            : "Next →"
                        : `Take your time · ${secondsLeft}s`}
                </button>
            </div>
        </>
    );

    // Passed round: a pop-up, no time limit
    if (!timed) {
        return (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4">
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-edge bg-panel p-7 shadow-2xl">
                    <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-success">
                        Nice, you passed · a quick fix before you go on
                    </p>
                    {body}
                </div>
            </div>
        );
    }

    // Failed round: full page, big reminder, reading timer
    return (
        <StageLayout title="TUTOR · LET’S REVIEW" subtitle="LEARN → PLACE → ROUND → UNLOCK" currentStep="round">
            <div className="mx-auto max-w-2xl">
                <p className="mb-6 text-center font-mono text-3xl font-bold leading-tight tracking-wide text-accent-text md:text-4xl">
                    Correcting mistakes is part of learning.
                </p>
                <section className="rounded-2xl border border-edge bg-panel p-8 shadow-xl">{body}</section>
            </div>
        </StageLayout>
    );
}
