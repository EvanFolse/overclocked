"use client";

import { useMemo, useState } from "react";
import { SPOT_PROGRAM, checkSpot, memoryCollisions, memoryUsers, schedule, type Hazard } from "@/lib/pipelineMission";
import { PipelineGrid } from "./PipelineGrid";
import { MissionShell } from "./MissionShell";
import { useMissionAttempts, type MissionResult } from "./useMissionAttempts";

const HAZARDS: { id: Hazard; name: string; sub: string }[] = [
  { id: "data", name: "DATA", sub: "A value is not ready yet" },
  { id: "structural", name: "STRUCTURAL", sub: "Two need the same hardware" },
  { id: "control", name: "CONTROL", sub: "A jump changes the path" },
];

export function SpotView({ onSettle }: { onSettle: (r: MissionResult) => void }) {
  const a = useMissionAttempts(onSettle);
  const sched = useMemo(() => schedule(SPOT_PROGRAM), []);
  const hits = useMemo(() => memoryCollisions(sched), [sched]);
  const users = useMemo(() => memoryUsers(sched), [sched]);
  const [cycle, setCycle] = useState<number | null>(null);
  const [hazard, setHazard] = useState<Hazard | null>(null);
  const [msg, setMsg] = useState("");

  const done = a.phase === "solved" || a.phase === "revealed";
  const locked = a.phase !== "playing";
  const collision = hits[0] ?? 0;

  const check = () => {
    const r = checkSpot({ cycle, hazard });
    const final = !r.correct && a.attempt >= 2;
    if (r.correct) {
      setMsg(`Cycle ${collision}: I4 is fetched while I1 reads memory in MEM. One memory port, two users: a structural hazard.`);
    } else if (final) {
      setMsg(`The collision is in cycle ${collision}: I4 (IF) and I1 (MEM) both need the one shared memory. That is a structural hazard.`);
    } else if (!r.cycleOk) {
      setMsg("Not this cycle. In the cycle you picked, the memory is used at most once.");
    } else {
      setMsg("Right cycle. Now ask what is colliding: a value, the hardware, or a jump?");
    }
    a.judge(r.correct);
  };

  const retry = () => {
    a.retry();
    setCycle(null);
    setHazard(null);
    setMsg("");
  };

  return (
    <MissionShell
      eyebrow="Round · Group A · Reasoning mission"
      title="Spot the collision"
      intro="This CPU has one memory, shared by fetching instructions and by loads. Click the cycle where two instructions need it at the same time."
      attempt={a.attempt}
      phase={a.phase}
      hint="Every instruction reads memory in IF. Loads and stores use it again in MEM."
      hintOpened={a.hintOpened}
      onHint={a.openHint}
      feedback={msg || undefined}
      canCheck={cycle !== null && hazard !== null}
      onCheck={check}
      onRetry={retry}
      sideTitle="Your answer"
      side={
        <>
          <div className="rounded-xl border border-edge px-3 py-2 text-sm">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">1 · Which cycle?</p>
            <p className="mt-1 font-mono text-lg font-bold">{cycle ? `Cycle ${cycle}` : "click a column"}</p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">2 · Which hazard?</p>
          {HAZARDS.map((h) => (
            <button
              key={h.id}
              type="button"
              disabled={locked}
              onClick={() => setHazard(h.id)}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                hazard === h.id ? "border-accent bg-accent-soft" : "border-edge hover:border-accent"
              }`}
            >
              <span className="block font-mono text-xs font-bold tracking-widest">{h.name}</span>
              <span className="block text-xs text-muted">{h.sub}</span>
            </button>
          ))}
        </>
      }
    >
      <PipelineGrid
        rows={sched.rows}
        cols={8}
        activeCycle={cycle}
        onCycleClick={locked ? undefined : setCycle}
        look={(row, cell) =>
          done && hits.includes(cell.cycle) && (cell.stage === "IF" || (cell.stage === "MEM" && row.instr.op === "lw"))
            ? { className: "fx-ring", style: { boxShadow: "0 0 0 3px #ef4444" } }
            : undefined
        }
      />
      {done && (
        <div className="mt-3 grid items-center gap-1.5" style={{ gridTemplateColumns: "180px repeat(8, minmax(52px, 1fr))" }}>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted">Memory · 1 port</div>
          {Array.from({ length: 8 }, (_, i) => {
            const u = users[i + 1] ?? [];
            const bad = u.length > 1;
            return (
              <div
                key={i}
                className={`rounded-md border px-1 py-2 text-center font-mono text-[11px] ${
                  bad ? "border-red-500 bg-red-500/10 font-bold text-red-500" : u.length ? "border-edge" : "border-dashed border-edge text-muted"
                }`}
              >
                {u.length ? u.join(" + ") : "free"}
              </div>
            );
          })}
        </div>
      )}
    </MissionShell>
  );
}
