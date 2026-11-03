"use client";

import { useState } from "react";
import { SpotView } from "@/components/learning/mission/SpotView";
import { FixView } from "@/components/learning/mission/FixView";
import { BudgetView } from "@/components/learning/mission/BudgetView";
import type { MissionResult } from "@/components/learning/mission/useMissionAttempts";

const TABS = [
  { id: "spot", label: "1 SPOT IT" },
  { id: "fix", label: "2 FIX IT" },
  { id: "budget", label: "3 BEAT THE BUDGET" },
] as const;

export default function MissionPreview() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("spot");
  const [run, setRun] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const settle = (name: string) => (r: MissionResult) =>
    setLog((l) => [`${name}: ${JSON.stringify(r)}`, ...l].slice(0, 6));

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto mb-5 flex max-w-6xl flex-wrap items-center gap-2">
        <p className="mr-4 font-mono text-sm font-bold tracking-[0.2em]">MISSION PREVIEW</p>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-1.5 font-mono text-[11px] tracking-widest ${
              tab === t.id ? "border-accent bg-accent font-bold text-white" : "border-edge text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRun(run + 1)}
          className="ml-auto rounded-lg border border-edge px-3 py-1.5 text-xs text-muted hover:text-foreground"
        >
          Restart mission
        </button>
      </div>

      {tab === "spot" && <SpotView key={`s${run}`} onSettle={settle("spot")} />}
      {tab === "fix" && <FixView key={`f${run}`} onSettle={settle("fix")} />}
      {tab === "budget" && <BudgetView key={`b${run}`} onSettle={settle("budget")} />}

      <pre className="mx-auto mt-6 max-w-6xl rounded-xl border border-edge bg-panel-muted p-3 font-mono text-[11px] text-muted">
        {log.length ? log.join("\n") : "onSettle results appear here (this is what the engine will receive)"}
      </pre>
    </div>
  );
}
