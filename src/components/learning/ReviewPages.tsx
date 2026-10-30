"use client";

import { useState } from "react";
import { StageLayout } from "@/components/learning/StageLayout";
import type { ReviewPage } from "@/lib/review";

interface ReviewPagesProps {
    pages: ReviewPage[];
    /** Called after the last page is confirmed */
    onDone: () => void;
}

/** Paged explanation after a failed round (design doc 6.1). The player confirms each page. */
export function ReviewPages({ pages, onDone }: ReviewPagesProps) {
    const [index, setIndex] = useState(0);
    const page = pages[index];
    if (!page) return null;

    const isLast = index === pages.length - 1;

    return (
        <StageLayout title="TUTOR · LET’S REVIEW" subtitle="LEARN → PLACE → ROUND → UNLOCK" currentStep="round">
            <div className="mx-auto max-w-2xl">
                <section className="rounded-2xl border border-edge bg-panel p-8 shadow-xl">
                    <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
                            Page {index + 1} of {pages.length}
                        </p>
                        {page.partName && (
                            <span className="rounded-full border border-amber-400/60 bg-amber-400/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-600">
                                Weak spot · {page.partName}
                            </span>
                        )}
                    </div>

                    <h2 className="mt-4 text-2xl font-medium leading-snug">{page.title}</h2>
                    <p className="mt-4 whitespace-pre-line leading-relaxed">{page.body}</p>

                    <div className="mt-8 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setIndex((i) => Math.max(0, i - 1))}
                            disabled={index === 0}
                            className="rounded-lg border border-edge px-4 py-2 font-mono text-sm text-muted transition hover:border-accent disabled:opacity-40"
                        >
                            ← Back
                        </button>
                        <button
                            type="button"
                            onClick={() => (isLast ? onDone() : setIndex((i) => i + 1))}
                            className="rounded-lg bg-accent px-6 py-2 font-mono text-sm font-bold text-white transition hover:opacity-90"
                        >
                            {isLast ? "Back to stages" : "Next →"}
                        </button>
                    </div>
                </section>
            </div>
        </StageLayout>
    );
}
