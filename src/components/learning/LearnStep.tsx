"use client";

import { ReactNode, useState } from "react";
import { STAGE_1_PARTS } from "@/data/stage1Place";
import { HubDiagram } from "@/components/learning/HubDiagram";

const LEARN_ORDER = ["cu", "decoder", "alu", "registers", "pc", "cache", "clock", "biu"];

const KEY_IDEAS: Record<string, string> = {
    cu: "The CU doesn't compute or store anything — it sequences the whole CPU.",
    decoder: "The decoder turns binary instructions into the control signals the CU sends out.",
    alu: "The ALU is where the actual math and logic happens.",
    registers: "Registers are the fastest storage there is, but there are only a few of them.",
    pc: "The PC always points at the next instruction, so the CPU never loses its place.",
    cache: "Cache keeps recently used data close to the cores so they wait less on memory.",
    clock: "Every step of the CPU is timed by the clock; a faster clock means more steps per second.",
    biu: "The BIU is the CPU's doorway to memory and the outside world.",
};


const DIAGRAMS: Record<string, ReactNode> = {
    cu: (
        <HubDiagram
            center={{ label: "CU", color: "#6A9ADA" }}
            nodes={[
                { side: "top", label: "Decoder", color: "#8190DA", width: 110, arrowLabel: "control signals" },
                { side: "left", label: "Regs", color: "#5FA987" },
                { side: "right", label: "Clock", color: "#D9A843" },
                { side: "bottom", label: "ALU", color: "#9B82D0", width: 100 },
            ]}
        />
    ),
};
interface LearnStepProps {
    onComplete: () => void;
}

export function LearnStep({ onComplete }: LearnStepProps) {
    const parts = LEARN_ORDER.map((id) => STAGE_1_PARTS.find((p) => p.id === id)!).filter(Boolean);
    const [index, setIndex] = useState(0);
    const [visited, setVisited] = useState<Set<number>>(new Set([0]));

    const part = parts[index];
    const isLast = index === parts.length - 1;

    const goTo = (i: number) => {
        setIndex(i);
        setVisited((prev) => new Set(prev).add(i));
    };

    return (
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-[300px_1fr]">
            
            <aside className="rounded-2xl border border-edge bg-panel p-5 shadow-lg">
                <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
                    Parts · {index + 1} of {parts.length}
                </p>
                <ul className="flex flex-col gap-2">
                    {parts.map((p, i) => {
                        const isActive = i === index;
                        const isSeen = visited.has(i);
                        return (
                            <li key={p.id}>
                                <button
                                    type="button"
                                    onClick={() => goTo(i)}
                                    className={`w-full rounded-lg px-3 py-2.5 text-left font-mono text-sm transition ${isActive
                                        ? "bg-accent font-bold text-white"
                                        : "bg-panel-muted text-muted hover:text-foreground"
                                        }`}
                                >
                                    <span className="mr-2">{isActive ? "▶" : isSeen ? "✓" : "○"}</span>
                                    {p.name}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </aside>

            <section className="flex min-h-[520px] flex-col rounded-2xl border border-edge bg-panel p-8 shadow-lg">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-violet">
                    Learn · Not graded · Instant feedback
                </p>

                <div className="mt-2 grid flex-1 grid-cols-1 gap-8 lg:grid-cols-2">
                    <div>
                        <h2 className="font-mono text-3xl font-bold text-foreground">{part.name}</h2>
                        <p className="mt-4 text-lg leading-relaxed text-muted">{part.description}</p>

                        <div className="mt-6 rounded-r-xl border-l-4 border-accent bg-accent-soft p-4">
                            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-violet">Key idea</p>
                            <p className="mt-1 text-base text-foreground">{KEY_IDEAS[part.id]}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">{DIAGRAMS[part.id]}</div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        onClick={() => (isLast ? onComplete() : goTo(index + 1))}
                        className="rounded-xl bg-accent px-8 py-3.5 font-mono text-sm font-bold tracking-widest text-white shadow-lg transition hover:opacity-90"
                    >
                        {isLast ? "NEXT · PLACE IT ON THE CPU →" : "NEXT PART →"}
                    </button>
                </div>
            </section>
        </div>
    );
}