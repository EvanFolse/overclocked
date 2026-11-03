"use client";

import { useMemo, useState } from "react";
import {
  BUDGET_CYCLES,
  BUDGET_PROGRAM,
  checkBudget,
  isLegalOrder,
  schedule,
  type Instr,
} from "@/lib/pipelineMission";
import { PipelineGrid } from "./PipelineGrid";
import { MissionShell } from "./MissionShell";
import { useMissionAttempts, type MissionResult } from "./useMissionAttempts";

const COLS = 10;

export function BudgetView({ onSettle }: { onSettle: (r: MissionResult) => void }) {
  const a = useMissionAttempts(onSettle);
  const [order, setOrder] = useState<Instr[]>(BUDGET_PROGRAM);
  const [drag, setDrag] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [msg, setMsg] = useState("");
  const sched = useMemo(() => schedule(order, true), [order]);
  const locked = a.phase !== "playing";
  const over = sched.cycles > BUDGET_CYCLES;

  const move = (from: number, to: number) => {
    if (locked || from === to || to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    if (!isLegalOrder(BUDGET_PROGRAM, next)) {
      setNotice("That order breaks a dependency: an instruction would run before the one it needs. Nothing was spent.");
      return;
    }
    setNotice("");
    setOrder(next);
  };

  const submit = () => {
    const r = checkBudget(order);
    if (r.correct) {
      setMsg(`${r.cycles} cycles. An independent instruction now fills the load delay, so nothing has to wait.`);
    } else if (a.attempt >= 2) {
      setMsg(`${r.cycles} cycles is over the budget of ${BUDGET_CYCLES}. One answer: LW, SUB, ADD, OR. SUB runs while the loaded value arrives.`);
    } else {
      setMsg(`${r.cycles} cycles is over the budget of ${BUDGET_CYCLES}.`);
    }
    a.judge(r.correct);
  };

  const retry = () => {
    a.retry();
    setMsg("");
  };

  return (
    <MissionShell
      eyebrow="Round · Group A · Reasoning mission"
      title="Beat the cycle budget"
      intro={`Forwarding is on, but a loaded value is still not ready one cycle early. Drag instructions into an order that finishes in ${BUDGET_CYCLES} cycles or fewer.`}
      attempt={a.attempt}
      phase={a.phase}
      hint="A loaded value arrives one cycle late. Which instruction does not need R1 and could run while LW finishes?"
      hintOpened={a.hintOpened}
      onHint={a.openHint}
      feedback={msg || undefined}
      canCheck
      checkLabel="SUBMIT ORDER"
      onCheck={submit}
      onRetry={retry}
      sideTitle="Cycle budget"
      side={
        <>
          <div className={`rounded-xl border px-3 py-3 ${over ? "border-red-400/60 bg-red-500/10" : "border-success/50 bg-success-soft"}`}>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Your order</p>
            <p className="mt-1 font-mono text-4xl font-bold">{sched.cycles}</p>
            <p className="text-xs text-muted">
              cycles to finish · budget {BUDGET_CYCLES} · {sched.stalls} stall{sched.stalls === 1 ? "" : "s"}
            </p>
          </div>
          <div className="relative h-2.5 rounded-full bg-edge">
            <div
              className={`h-full rounded-full ${over ? "bg-red-500" : "bg-success"}`}
              style={{ width: `${Math.min(100, (sched.cycles / COLS) * 100)}%` }}
            />
            <span
              className="absolute -top-1 h-4.5 w-0.5 bg-foreground"
              style={{ left: `${(BUDGET_CYCLES / COLS) * 100}%`, height: 18 }}
            />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {over ? "Over budget" : "On budget"}
          </p>
          <button
            type="button"
            disabled={locked}
            onClick={() => {
              setOrder(BUDGET_PROGRAM);
              setNotice("");
            }}
            className="rounded-lg border border-edge px-3 py-2 font-mono text-xs tracking-widest text-muted hover:text-foreground disabled:opacity-40"
          >
            RESET ORDER
          </button>
        </>
      }
    >
      <ul className="mb-5 flex flex-col gap-2">
        {order.map((ins, i) => (
          <li
            key={ins.id}
            draggable={!locked}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", ins.id);
              setDrag(i);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (drag !== null) move(drag, i);
              setDrag(null);
            }}
            className={`flex items-center gap-3 rounded-xl border border-edge bg-panel-muted px-3 py-2 ${locked ? "" : "cursor-grab"}`}
          >
            <span className="font-mono text-muted">⋮⋮</span>
            <span className="rounded bg-panel px-1.5 py-0.5 font-mono text-[10px] text-muted">{ins.id}</span>
            <span className="font-mono text-sm font-bold">{ins.text}</span>
            <span className="text-xs text-muted">
              {ins.dest ? `writes ${ins.dest}` : ""} {ins.dest ? "·" : ""} reads {ins.srcs.join(", ")}
            </span>
            <span className="ml-auto flex gap-1">
              <button type="button" disabled={locked || i === 0} onClick={() => move(i, i - 1)} className="rounded border border-edge px-2 text-xs disabled:opacity-30">↑</button>
              <button type="button" disabled={locked || i === order.length - 1} onClick={() => move(i, i + 1)} className="rounded border border-edge px-2 text-xs disabled:opacity-30">↓</button>
            </span>
          </li>
        ))}
      </ul>
      {notice && <p className="mb-3 text-sm text-amber-600">{notice}</p>}
      <PipelineGrid rows={sched.rows} cols={COLS} />
      <p className="mt-2 text-xs text-muted">The timeline re-runs live while you drag. Dashed boxes mean the instruction is waiting.</p>
    </MissionShell>
  );
}
