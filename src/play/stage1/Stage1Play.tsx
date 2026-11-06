"use client";
import { useState } from "react";
import type { StagePlayProps } from "../types";

type PartId = "clock" | "control" | "cache" | "registers" | "alu";
type Status = "ok" | "stuck" | "waiting";

const PARTS: Record<PartId, { label: string; color: string }> = {
  clock: { label: "CLOCK", color: "#4ade80" },
  control: { label: "CONTROL UNIT", color: "#a78bfa" },
  cache: { label: "CACHE", color: "#60a5fa" },
  registers: { label: "REGISTERS", color: "#2dd4bf" },
  alu: { label: "ALU", color: "#fbbf24" },
};
const ORDER: PartId[] = ["clock", "control", "cache", "registers", "alu"];

interface Fault {
  missing: PartId;
  event: string;
  rows: [string, Status][];
  probes: { label: string; result: string }[];
  wrong: Partial<Record<PartId, string>>;
  hint: string;
  fixed: string;
}

const FAULTS: Record<"main" | "unseen", Fault> = {
  main: {
    missing: "alu",
    event: "A power glitch hit the die. Run it again and read the symptom.",
    rows: [["Fetch", "ok"], ["Decode", "ok"], ["Execute", "stuck"], ["Write-back", "waiting"]],
    probes: [
      { label: "Control Unit", result: "Control Unit: issuing orders normally." },
      { label: "Registers", result: "Registers: R2 = 5 and R3 = 3 are readable." },
      { label: "Socket @ Execute", result: "Socket @ Execute: the signal arrives, but nothing comes out." },
    ],
    wrong: {
      clock: "Clock ticks, but Execute still produces nothing. R1 is still ???.",
      control: "Orders were already arriving. Execute still produces nothing.",
      registers: "R2 and R3 were already readable. Still no sum.",
      cache: "Fast memory holds data; it does not calculate. Still no sum.",
    },
    hint: "Find the first step that gets stuck, then probe the socket at that step.",
    fixed: "R1 = 8. The ALU added 5 + 3.",
  },
  unseen: {
    missing: "registers",
    event: "New fault. A different part is gone. Read the symptom first.",
    rows: [["Fetch", "ok"], ["Decode", "stuck"], ["Execute", "waiting"], ["Write-back", "waiting"]],
    probes: [
      { label: "Control Unit", result: "Control Unit: issuing orders normally." },
      { label: "ALU", result: "ALU: ready, but no operands are arriving." },
      { label: "Socket @ Decode", result: "Socket @ Decode: the operand request goes out, nobody answers." },
    ],
    wrong: {
      clock: "Clock ticks fine, but Decode still cannot find R2 and R3.",
      control: "Orders were already arriving. Decode still has no operands.",
      alu: "The ALU is ready, but it still receives no operands.",
      cache: "Cache keeps copies of memory; it is not where R2 and R3 live.",
    },
    hint: "Which step stalls first? Ask what that step needs to read.",
    fixed: "R1 = 8. Registers held the operands.",
  },
};

const panel = { border: "1px solid #1e3a5f", borderRadius: 12, padding: 12, background: "#07122a" } as const;
const small = { fontSize: 11, letterSpacing: 1, opacity: 0.6, textTransform: "uppercase" } as const;
const btn = {
  padding: "6px 10px", borderRadius: 8, border: "1px solid #1e3a5f",
  background: "#0b1b3a", color: "#e6f1ff", cursor: "pointer", fontSize: 12,
} as const;
const statusColor: Record<Status, string> = { ok: "#34d399", stuck: "#f87171", waiting: "#fbbf24" };

export function Stage1Play({ phase, onDone }: StagePlayProps) {
  const fault = FAULTS[phase];
  const [step, setStep] = useState<"build" | "diagnose">(phase === "main" ? "build" : "diagnose");
  const [placed, setPlaced] = useState<PartId[]>([]);
  const [selected, setSelected] = useState<PartId | null>(null);
  const [flash, setFlash] = useState<PartId | null>(null);
  const [wrongDrops, setWrongDrops] = useState(0);
  const [repairs, setRepairs] = useState(0);
  const [hints, setHints] = useState(0);
  const [probesUsed, setProbesUsed] = useState<number[]>([]);
  const [fixed, setFixed] = useState(false);
  const [note, setNote] = useState(
    phase === "main" ? "Drag each part onto the die. Build a working CPU." : fault.event
  );

  function drop(slot: PartId, part: PartId) {
    if (fixed) return;
    setSelected(null);
    if (step === "build") {
      if (placed.includes(part)) return;
      if (part !== slot) {
        setWrongDrops((n) => n + 1);
        setFlash(slot);
        setTimeout(() => setFlash(null), 450);
        setNote("That part doesn't belong there. Try another spot.");
        return;
      }
      const next = [...placed, part];
      setPlaced(next);
      if (next.length === ORDER.length) {
        setNote("All five parts online. Running ADD R1, R2, R3 ...");
        setTimeout(() => {
          setStep("diagnose");
          setNote(fault.event);
        }, 1200);
      } else {
        setNote(`${PARTS[part].label} online.`);
      }
      return;
    }
    if (slot !== fault.missing) return;
    setRepairs((n) => n + 1);
    if (part === fault.missing) {
      setFixed(true);
      setNote(fault.fixed);
    } else {
      setNote(fault.wrong[part] ?? "Still broken.");
    }
  }

  function useProbe(i: number) {
    setProbesUsed((u) => (u.includes(i) ? u : [...u, i]));
  }

  function useHint() {
    setHints((n) => n + 1);
    setNote(fault.hint);
  }

  function finish() {
    const metrics: Record<string, number | string> = {
      "Parts online": 5,
      "Probes used": probesUsed.length,
      "Repair tries": repairs,
    };
    if (phase === "main") metrics["Wrong placements"] = wrongDrops;
    onDone({ attempts: repairs, hints, metrics });
  }

  const tray = step === "build" ? ORDER.filter((p) => !placed.includes(p)) : ORDER;
  const r1 = fixed ? "8" : "???";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
      {/* Left: the die and the parts */}
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ ...panel, display: "grid", gap: 8 }}>
          <div style={small}>CPU die</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {ORDER.map((part) => {
              const isSocket = step === "diagnose" && part === fault.missing && !fixed;
              const filled = step === "build" ? placed.includes(part) : !isSocket;
              const p = PARTS[part];
              return (
                <div
                  key={part}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("text/plain") as PartId;
                    if (id in PARTS) drop(part, id);
                  }}
                  onClick={() => selected && drop(part, selected)}
                  style={{
                    gridColumn: part === "alu" ? "span 2" : undefined,
                    minHeight: 64, display: "grid", placeItems: "center", borderRadius: 10,
                    fontWeight: 700, fontSize: 13,
                    background: filled ? p.color : "transparent",
                    color: filled ? "#04101f" : isSocket ? "#f87171" : "#7a8aa8",
                    border: filled
                      ? "2px solid transparent"
                      : `2px dashed ${flash === part ? "#f87171" : isSocket ? "#f87171" : "#34507a"}`,
                    cursor: selected && !filled ? "pointer" : "default",
                  }}
                >
                  {filled ? p.label : isSocket ? "?" : p.label}
                </div>
              );
            })}
          </div>
        </div>

        <div style={panel}>
          <div style={small}>{step === "build" ? "Parts tray" : "Spare parts bin"}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, minHeight: 40 }}>
            {tray.map((part) => (
              <button
                key={part}
                draggable={!fixed}
                onDragStart={(e) => e.dataTransfer.setData("text/plain", part)}
                onClick={() => setSelected(selected === part ? null : part)}
                style={{
                  ...btn, background: PARTS[part].color, color: "#04101f", fontWeight: 700,
                  outline: selected === part ? "3px solid #e6f1ff" : "none",
                  opacity: fixed ? 0.5 : 1,
                }}
              >
                {PARTS[part].label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...panel, background: "#0b1b3a" }}>{note}</div>
      </div>

      {/* Right: program, symptom, probes */}
      <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <div style={panel}>
          <div style={small}>Instruction</div>
          <div style={{ fontFamily: "monospace", fontSize: 16, margin: "6px 0" }}>ADD R1, R2, R3</div>
          <div style={{ fontFamily: "monospace", display: "flex", gap: 14 }}>
            <span>R1 = {r1}</span><span>R2 = 5</span><span>R3 = 3</span>
          </div>
        </div>

        {step === "diagnose" && (
          <>
            <div style={panel}>
              <div style={small}>Symptom</div>
              {fault.rows.map(([name, status]) => {
                const shown: Status = fixed ? "ok" : status;
                return (
                  <div key={name} style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span>{name}</span>
                    <span style={{ color: statusColor[shown] }}>{shown === "ok" ? "ok" : shown}</span>
                  </div>
                );
              })}
            </div>

            <div style={panel}>
              <div style={small}>Probes</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {fault.probes.map((pr, i) => (
                  <button key={pr.label} style={btn} onClick={() => useProbe(i)}>
                    Probe {pr.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 8, display: "grid", gap: 4, fontSize: 13 }}>
                {probesUsed.map((i) => (
                  <div key={i}>{fault.probes[i].result}</div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              {!fixed && <button style={btn} onClick={useHint}>Hint ({hints})</button>}
              {fixed && <button style={{ ...btn, background: "#34d399", color: "#04101f", fontWeight: 700 }} onClick={finish}>Continue</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
