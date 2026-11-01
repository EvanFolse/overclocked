"use client";

interface ReadingStepProps {
    /** The stage's reading text (the bank's `reading` field) */
    reading: string;
    onComplete: () => void;
}

/** Default Learn screen for stages without a custom one: read a short text, then continue. */
export function ReadingStep({ reading, onComplete }: ReadingStepProps) {
    return (
        <div className="mx-auto max-w-3xl">
            <section className="rounded-2xl border border-edge bg-panel p-8 shadow-lg">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-violet">
                    Learn · Not graded
                </p>
                <h2 className="mt-3 text-2xl font-medium">Read this first</h2>
                <p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{reading}</p>
                <div className="mt-8 flex justify-end">
                    <button
                        type="button"
                        onClick={onComplete}
                        className="rounded-xl bg-accent px-8 py-3.5 font-mono text-sm font-bold tracking-widest text-white shadow-lg transition hover:opacity-90"
                    >
                        CONTINUE →
                    </button>
                </div>
            </section>
        </div>
    );
}
