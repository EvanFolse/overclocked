"use client";

import { useEffect, useState } from "react";
import { getTutorTopics, type TutorTopic } from "@/data/tutor";

interface TutorLauncherProps {
    /** Highest stage unlocked or being read. Decides which topics are shown. */
    stage: number;
}

/**
 * Tutor chatbot (design doc 6.2): a hard-coded question tree, no live AI.
 * A button in the bottom-left corner opens a panel from the right:
 * pick a topic -> pick a question -> read the fixed answer.
 * The parent decides where it is shown (never during a round).
 */
export function TutorLauncher({ stage }: TutorLauncherProps) {
    const [open, setOpen] = useState(false);
    const [topic, setTopic] = useState<TutorTopic | null>(null);
    const [qIndex, setQIndex] = useState<number | null>(null);

    const topics = getTutorTopics(stage);
    const item = topic && qIndex !== null ? topic.items[qIndex] : null;

    const openPanel = () => {
        setTopic(null);
        setQIndex(null);
        setOpen(true);
    };
    const close = () => setOpen(false);

    const back = () => {
        if (qIndex !== null) setQIndex(null);
        else if (topic) setTopic(null);
    };

    // Escape closes the panel
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const optionClass =
        "w-full rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-left text-base text-accent-text transition hover:border-accent hover:shadow-sm";

    return (
        <>
            <button
                type="button"
                onClick={openPanel}
                className="fixed bottom-6 left-4 z-[65] w-60 rounded-xl border border-violet/40 bg-violet-soft px-3 py-3 font-mono text-xs font-semibold text-violet shadow-lg transition hover:opacity-90"
            >
                💬 TUTOR · ask about a part
            </button>

            {/* Dimmed backdrop: click to close */}
            <div
                onClick={close}
                className={`fixed inset-0 z-[66] bg-black/30 transition-opacity duration-300 ${
                    open ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
            />

            <aside
                role="dialog"
                aria-label="Tutor"
                aria-hidden={!open}
                className={`fixed right-0 top-0 z-[67] flex h-full w-full max-w-md flex-col border-l border-edge bg-panel shadow-2xl transition-[transform,visibility] duration-300 ${
                    open ? "visible translate-x-0" : "invisible translate-x-full"
                }`}
            >
                <div className="flex items-center justify-between px-6 pt-6">
                    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">Tutor</p>
                    <button
                        type="button"
                        onClick={close}
                        aria-label="Close tutor"
                        className="rounded-md px-2 py-1 font-mono text-sm text-muted transition hover:text-foreground"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {(topic || item) && (
                        <button
                            type="button"
                            onClick={back}
                            className="mt-4 font-mono text-xs text-accent-text transition hover:opacity-80"
                        >
                            ← {item ? "More questions" : "Topics"}
                        </button>
                    )}

                    <h2 className="mt-4 font-mono text-2xl font-bold uppercase tracking-[0.15em]">
                        {item ? "Answer" : topic ? topic.title : "Pick a topic"}
                    </h2>

                    {/* Step 1: topics */}
                    {!topic && (
                        <div className="mt-6 flex flex-col gap-3">
                            {topics.length === 0 && <p className="text-sm text-muted">No topics yet.</p>}
                            {topics.map((t) => (
                                <button key={t.id} type="button" onClick={() => setTopic(t)} className={optionClass}>
                                    {t.title}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 2: questions of the topic */}
                    {topic && !item && (
                        <div className="mt-6 flex flex-col gap-3">
                            {topic.items.map((qa, i) => (
                                <button key={i} type="button" onClick={() => setQIndex(i)} className={optionClass}>
                                    {qa.question}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 3: the fixed answer */}
                    {item && (
                        <div className="mt-6">
                            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Question</p>
                            <p className="mt-1 text-base font-medium">{item.question}</p>
                            <div className="mt-5 rounded-xl border border-edge bg-panel-muted p-5">
                                <p className="leading-relaxed">{item.answer}</p>
                            </div>
                        </div>
                    )}
                </div>

                <p className="border-t border-edge px-6 py-3 font-mono text-[10px] tracking-wider text-muted">
                    Fixed answers, no live AI. Not available during a round.
                </p>
            </aside>
        </>
    );
}
