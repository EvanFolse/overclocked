"use client";

import { useState } from "react";
import { STAGE_4_LEARN_TOPICS } from "@/data/stage4Place";
import { MemoryHierarchyVisual } from "@/components/MemoryHierarchyVisual";

interface LearnStepMemoryProps {
  onComplete: () => void;
}

/** Stage 4 Learn: same flow as Stage 1 LearnStep, with hierarchy topics + pyramid visual. */
export function LearnStepMemory({ onComplete }: LearnStepMemoryProps) {
  const topics = STAGE_4_LEARN_TOPICS;
  const [index, setIndex] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));

  const topic = topics[index]!;
  const isLast = index === topics.length - 1;

  const goTo = (i: number) => {
    setIndex(i);
    setVisited((prev) => new Set(prev).add(i));
  };

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-[300px_1fr]">
      <aside className="rounded-2xl border border-edge bg-panel p-5 shadow-lg">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
          Topics · {index + 1} of {topics.length}
        </p>
        <ul className="flex flex-col gap-2">
          {topics.map((t, i) => {
            const isActive = i === index;
            const isSeen = visited.has(i);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left font-mono text-sm transition ${
                    isActive
                      ? "bg-accent font-bold text-white"
                      : "bg-panel-muted text-muted hover:text-foreground"
                  }`}
                >
                  <span className="mr-2">{isActive ? "▶" : isSeen ? "✓" : "○"}</span>
                  {t.name}
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
            <h2 className="font-mono text-3xl font-bold text-foreground">{topic.name}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">{topic.description}</p>

            <div className="mt-6 rounded-r-xl border-l-4 border-accent bg-accent-soft p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-violet">
                Key idea
              </p>
              <p className="mt-1 text-base text-foreground">{topic.keyIdea}</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm">
              <MemoryHierarchyVisual active={topic.highlight} />
              {(topic.id === "sram" || topic.id === "dram") && (
                <p className="mt-3 text-center font-mono text-[11px] text-muted">
                  {topic.id === "sram"
                    ? "SRAM = technology for registers & caches (not a separate level)"
                    : "DRAM = technology for main memory / RAM (not a separate level)"}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => (isLast ? onComplete() : goTo(index + 1))}
            className="rounded-xl bg-accent px-8 py-3.5 font-mono text-sm font-bold tracking-widest text-white shadow-lg transition hover:opacity-90"
          >
            {isLast ? "NEXT · PLACE THE HIERARCHY →" : "NEXT TOPIC →"}
          </button>
        </div>
      </section>
    </div>
  );
}
