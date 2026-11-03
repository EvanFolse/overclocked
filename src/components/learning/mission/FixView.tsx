"use client";

import { useState } from "react";
import { checkFix, type Cell, type Instr, type Row, type Stage, type Tool } from "@/lib/pipelineMission";
import { PipelineGrid } from "./PipelineGrid";
import { MissionShell } from "./MissionShell";
import { useMissionAttempts, type MissionResult } from "./useMissionAttempts";

const ALL: Stage[] = ["IF", "ID", "EX", "MEM", "WB"];
const cells = (start: number, stages: Stage[]): Cell[] =>
  stages.map((stage, i) => ({ cycle: start + i, stage, held: false }));

const BEQ: Instr = { id: "I1", text: "BEQ R1, R2, DONE", op: "beq", srcs: ["R1", "R2"] };
const ADD: Instr = { id: "I2", text: "ADD R3, R4, R5", op: "alu", dest: "R3", srcs: ["R4", "R5"] };
const SUB: Instr = { id: "I3", text: "SUB R6, R7, R8", op: "alu", dest: "R6", srcs: ["R7", "R8"] };
const OR: Instr = { id: "I4", text: "OR R9, R10, R11", op: "alu", dest: "R9", srcs: ["R10", "R11"] };

const BEFORE: Row[] = [
  { instr: BEQ, cells: cells(1, ALL), stalls: 0 },
  { instr: ADD, cells: cells(2, ALL), stalls: 0 },
  { instr: SUB, cells: cells(3, ALL), stalls: 0 },
];
const AFTER: Row[] = [
  { instr: BEQ, cells: cells(1, ALL), stalls: 0 },
  { instr: ADD, cells: cells(2, ["IF", "ID", "EX"]), stalls: 0 },
  { instr: SUB, cells: cells(3, ["IF", "ID"]), stalls: 0 },
  { instr: OR, cells: cells(4, ALL), stalls: 0 },
];

const NOTES: Record<string, string> = {
  I1: "jumps · decided in EX",
  I2: "fetched on the wrong path",
  I3: "fetched on the wrong path",
  I4: "the jump target",
};

const TOOLS: { id: Tool; name: string; sub: string }[] = [
  { id: "stall", name: "STALL", sub: "Hold instructions back and insert a bubble." },
  { id: "forward", name: "FORWARD", sub: "Pass a result straight to the next stop." },
  { id: "flush", name: "FLUSH", sub: "Cancel instructions already in the pipeline." },
];

export function FixView({ onSettle }: { onSettle: (r: MissionResult) => void }) {
  const a = useMissionAttempts(onSettle);
  const [pick, setPick] = useState<Tool | null>(null);
  const [placed, setPlaced] = useState<{ tool: Tool; cycle: number } | null>(null);
  const [msg, setMsg] = useState("");

  const solved = a.phase === "solved";
  const locked = a.phase !== "playing";

  const place = (tool: Tool | null, cycle: number) => {
    if (locked || !tool) return;
    setPlaced({ tool, cycle });
    setPick(null);
  };

  const check = () => {
    if (!placed) return;
    const r = checkFix(placed.tool, placed.cycle);
    setMsg(a.attempt >= 2 && !r.correct ? `${r.why} The answer: Flush in cycle 4.` : r.why);
    a.judge(r.correct);
  };

  const retry = () => {
    a.retry();
    setPlaced(null);
    setMsg("");
  };

  const badge: Record<number, string> = { 3: "jump known" };
  if (placed) badge[placed.cycle] = placed.tool.toUpperCase();

  return (
    <MissionShell
      eyebrow="Round · Group A · Reasoning mission"
      title="Fix the damage"
      intro="The CPU guessed that BEQ would not jump, and kept fetching. The guess was wrong: BEQ jumps to DONE. Drag the right tool onto the cycle where the damage can still be stopped."
      attempt={a.attempt}
      phase={a.phase}
      hint="BEQ only knows it must jump when it reaches EX. Which instructions entered the pipeline before that moment?"
      hintOpened={a.hintOpened}
      onHint={a.openHint}
      feedback={msg || undefined}
      canCheck={!!placed}
      onCheck={check}
      onRetry={retry}
      sideTitle="Toolbelt"
      side={TOOLS.map((t) => (
        <button
          key={t.id}
          type="button"
          draggable={!locked}
          disabled={locked}
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", t.id);
            setPick(t.id);
          }}
          onClick={() => setPick(pick === t.id ? null : t.id)}
          className={`rounded-xl border px-3 py-3 text-left transition ${
            pick === t.id || placed?.tool === t.id ? "border-accent bg-accent-soft" : "border-edge hover:border-accent"
          }`}
        >
          <span className="block font-mono text-xs font-bold tracking-widest">{t.name}</span>
          <span className="block text-xs text-muted">{t.sub}</span>
        </button>
      ))}
    >
      <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">
        Drag a tool onto a cycle number, or click a tool and then a cycle
      </p>
      <PipelineGrid
        rows={solved ? AFTER : BEFORE}
        cols={8}
        activeCycle={placed?.cycle ?? null}
        headerBadge={badge}
        onCycleClick={locked ? undefined : (c) => place(pick, c)}
        onCycleDrop={locked ? undefined : (c) => place(pick, c)}
        note={(row) => NOTES[row.instr.id]}
        look={(row, cell) => {
          if (solved && cell.cycle === 4 && (row.instr.id === "I2" || row.instr.id === "I3")) {
            return {
              text: "✗",
              className: "fx-shake",
              style: { background: "#fee2e2", borderColor: "#ef4444", color: "#b91c1c", borderStyle: "dashed" },
            };
          }
          if (!solved && (row.instr.id === "I2" || row.instr.id === "I3")) {
            return { style: { background: "#fee2e2", borderColor: "#f87171", color: "#b91c1c" } };
          }
          return undefined;
        }}
      />
    </MissionShell>
  );
}
