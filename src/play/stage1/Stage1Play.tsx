"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Mood, StagePlayProps } from "../types";
import { PART_INFO } from "../tutor/script";

type PartId = "clock" | "control" | "cache" | "registers" | "alu";
type Status = "ok" | "stuck" | "waiting";

const PARTS: Record<PartId, { label: string; color: string }> = {
  clock: { label: "CLOCK", color: "#5fd3a0" },
  control: { label: "CONTROL UNIT", color: "#a994f5" },
  cache: { label: "CACHE", color: "#5b8def" },
  registers: { label: "REGISTERS", color: "#4ec3d0" },
  alu: { label: "ALU", color: "#f5c242" },
};
const TRAY: PartId[] = ["alu", "control", "registers", "clock", "cache"];
const SLOTS: { id: PartId; span: number }[] = [
  { id: "clock", span: 2 }, { id: "control", span: 2 }, { id: "cache", span: 2 },
  { id: "registers", span: 3 }, { id: "alu", span: 3 },
];

interface Fault {
  missing: PartId;
  event: string;
  symptom: string;
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
    symptom: "The instruction runs, but no sum is ever produced.",
    rows: [["Fetch", "ok"], ["Decode", "ok"], ["Execute", "stuck"], ["Write-back", "waiting"]],
    probes: [
      { label: "Control Unit", result: "Control Unit: issuing orders normally." },
      { label: "Registers", result: "Registers: R2 = 5 and R3 = 3 are readable." },
      { label: "Socket @ Execute", result: "Socket @ Execute: the signal arrives, but nothing comes out." },
    ],
    wrong: {
      clock: "Clock ticks, but Execute still produces nothing. R1 is still ?.",
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
    symptom: "The instruction stalls before it can even start executing.",
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

const statusColor: Record<Status, string> = { ok: "#34d399", stuck: "#f87171", waiting: "#fbbf24" };
const label = { fontSize: 11, letterSpacing: 2, opacity: 0.6, textTransform: "uppercase" } as const;
const box = {
  border: "1px solid rgba(56,189,248,0.22)", borderRadius: 14,
  background: "rgba(5,11,26,0.6)", padding: 14,
} as const;
const smallBtn = {
  padding: "7px 12px", borderRadius: 8, border: "1px solid #1e3a5f",
  background: "#0b1b3a", color: "#e6f1ff", cursor: "pointer", fontSize: 12,
} as const;

export function Stage1Play({ phase, panelEl, onEvidence, onCoach, onGoal, onAdvance, onDone }: StagePlayProps) {
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
  const [busy, setBusy] = useState(false);
  const timers = useRef<number[]>([]);

  const say = (tag: string, text: string, color?: string, mood?: Mood) =>
    onCoach({ tag, text, color, mood });
  const describe = (id: PartId) => PART_INFO[id].what;
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    if (phase === "unseen") {
      onCoach({ tag: "UNSEEN", text: fault.event });
      onEvidence({ status: "DIAGNOSING" });
    }
    const ids = timers.current;
    return () => ids.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once repaired, give the player a moment to see the result, then move on.
  useEffect(() => {
    if (!fixed) return;
    const t = window.setTimeout(() => {
      const metrics: Record<string, number | string> = {
        "Parts online": 5,
        "Probes used": probesUsed.length,
        "Repair tries": repairs,
      };
      if (phase === "main") metrics["Wrong placements"] = wrongDrops;
      onDone({ attempts: repairs, hints, metrics });
    }, 1600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixed]);

  function grab(id: PartId) {
    if (step === "build") onAdvance("play");
    say(PARTS[id].label, describe(id), PARTS[id].color, "idle");
  }

  function drop(slot: PartId, part: PartId) {
    if (fixed || busy) return;
    setSelected(null);

    if (step === "build") {
      if (placed.includes(part)) return;
      if (part !== slot) {
        setWrongDrops((n) => n + 1);
        setFlash(slot);
        later(() => setFlash(null), 450);
        say(PARTS[part].label, `${describe(part)} Wrong spot, try another.`, PARTS[part].color, "oops");
        return;
      }
      const next = [...placed, part];
      setPlaced(next);
      onAdvance("play");
      onEvidence({ status: "BUILDING" });
      if (next.length === TRAY.length) {
        setBusy(true);
        say(PARTS[part].label, `${describe(part)} That's all five. Running the instruction...`, PARTS[part].color, "cheer");
        later(() => {
          setStep("diagnose");
          setBusy(false);
          say("EVENT", fault.event);
          onEvidence({ status: "DIAGNOSING" });
        }, 1500);
      } else {
        say(PARTS[part].label, `${describe(part)} Online ✓`, PARTS[part].color, "cheer");
      }
      return;
    }

    if (slot !== fault.missing) return;
    const n = repairs + 1;
    setRepairs(n);
    if (part === fault.missing) {
      setFixed(true);
      say("RESULT", fault.fixed, undefined, "cheer");
      onEvidence({ attempts: n, status: "FIXED" });
    } else {
      say(PARTS[part].label, `${describe(part)} ${fault.wrong[part] ?? "Still broken."}`, PARTS[part].color, "oops");
      onEvidence({ attempts: n, status: "WRONG PART" });
    }
  }

  function runProbe(i: number) {
    setProbesUsed((u) => (u.includes(i) ? u : [...u, i]));
    say("NOTE", fault.probes[i].result);
  }

  function hint() {
    const n = hints + 1;
    setHints(n);
    onEvidence({ hints: n });
    say("HINT", fault.hint);
  }

  const goalText = fixed
    ? "Nice work! Moving on..."
    : step === "build"
      ? busy
        ? "Watch the instruction run..."
        : `Drag a part onto the die · ${placed.length} of ${TRAY.length} placed`
      : probesUsed.length === 0
        ? "Probe the chip, then fill the empty socket."
        : "Put the right part into the empty socket.";
  useEffect(() => {
    onGoal(goalText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalText]);

  const missingRegs = step === "diagnose" && fault.missing === "registers" && !fixed;
  const regs: [string, string][] = [
    ["R1", fixed ? "8" : "?"],
    ["R2", missingRegs ? "?" : "5"],
    ["R3", missingRegs ? "?" : "3"],
  ];
  const isFilled = (id: PartId) =>
    step === "build" ? placed.includes(id) : id !== fault.missing || fixed;
  const isSocket = (id: PartId) => step === "diagnose" && id === fault.missing && !fixed;

  /* ---------- right-hand mission panel (portaled into the shell) ---------- */
  const mission = (
    <div style={{ display: "grid", gap: 14 }}>
      {step === "build" ? (
        <div style={box}>
          <div style={label}>Mission · Build</div>
          <div style={{ fontWeight: 700, margin: "6px 0 10px" }}>Assemble the five core parts</div>
          {TRAY.map((id) => (
            <div key={id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: placed.includes(id) ? PARTS[id].color : "#1c2a48" }} />
                {PARTS[id].label}
              </span>
              <span style={{ color: placed.includes(id) ? "#34d399" : "#6b7c99", fontSize: 12 }}>
                {placed.includes(id) ? "online" : "—"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{ ...box, borderColor: "rgba(248,113,113,0.5)", background: "rgba(248,113,113,0.07)" }}>
            <div style={{ ...label, color: "#f87171", opacity: 1 }}>Symptom</div>
            <div style={{ fontFamily: "monospace", margin: "6px 0" }}>ADD R1, R2, R3 &nbsp;·&nbsp; R1 = {fixed ? "8" : "???"}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>{fault.symptom}</div>
          </div>

          <div style={box}>
            {fault.rows.map(([name, status]) => {
              const shown: Status = fixed ? "ok" : status;
              return (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}>
                  <span>{name}</span>
                  <span style={{ color: statusColor[shown], fontWeight: 700 }}>{shown}</span>
                </div>
              );
            })}
          </div>

          <div style={box}>
            <div style={label}>Probe log</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0" }}>
              {fault.probes.map((pr, i) =>
                probesUsed.includes(i) ? null : (
                  <button key={pr.label} style={smallBtn} onClick={() => runProbe(i)} disabled={fixed}>
                    Probe {pr.label}
                  </button>
                ),
              )}
            </div>
            <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
              {probesUsed.map((i) => (
                <div key={i}>{fault.probes[i].result}</div>
              ))}
            </div>
          </div>

          {!fixed && (
            <div>
              <button style={smallBtn} onClick={hint}>Hint ({hints})</button>
            </div>
          )}
        </>
      )}
    </div>
  );

  /* ---------- left-hand play area ---------- */
  return (
    <>
      {panelEl && createPortal(mission, panelEl)}

      <div style={{ display: "grid", gap: "clamp(18px, 3vh, 34px)", justifyItems: "center", width: "100%" }}>
        {/* instruction + registers */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(20px, 4vw, 56px)", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "monospace", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 800, letterSpacing: 1 }}>
              ADD R1, R2, R3
            </div>
            <div style={{ ...label, marginTop: 4 }}>One instruction · R1 = R2 + R3</div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {regs.map(([name, value]) => (
              <div
                key={name}
                style={{
                  width: 92, padding: "8px 12px", borderRadius: 12, textAlign: "left",
                  border: `1.5px solid ${value === "?" ? "rgba(248,113,113,0.6)" : "rgba(56,189,248,0.5)"}`,
                  background: "rgba(8,16,40,0.85)",
                }}
              >
                <div style={{ fontSize: 10, letterSpacing: 1.5, opacity: 0.6 }}>{name}</div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CPU die */}
        <div
          style={{
            width: "min(100%, 820px)", padding: 14, borderRadius: 28,
            border: "9px dotted rgba(27,136,201,0.4)",
          }}
        >
          <div
            style={{
              position: "relative", borderRadius: 20, border: "2px solid #2a8fd0",
              background: "linear-gradient(160deg, #0b2147, #071230)",
              padding: "34px 22px 22px", boxShadow: "0 0 40px rgba(56,189,248,0.18)",
            }}
          >
            <div style={{ position: "absolute", top: 10, left: 0, right: 0, textAlign: "center", ...label, color: "#38bdf8", opacity: 1 }}>
              CPU DIE
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
              {SLOTS.map(({ id, span }) => {
                const filled = isFilled(id);
                const socket = isSocket(id);
                const p = PARTS[id];
                return (
                  <div
                    key={id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const part = e.dataTransfer.getData("text/plain") as PartId;
                      if (part in PARTS) drop(id, part);
                    }}
                    onClick={() => selected && drop(id, selected)}
                    style={{
                      gridColumn: `span ${span}`, minHeight: "clamp(88px, 14vh, 140px)",
                      display: "grid", placeItems: "center", borderRadius: 12, fontWeight: 800,
                      fontSize: "clamp(13px, 1.3vw, 17px)", letterSpacing: 0.5,
                      background: filled ? p.color : `${p.color}14`,
                      color: filled ? "#0b1226" : socket ? "#f87171" : p.color,
                      border: filled
                        ? "2px solid transparent"
                        : `2px dashed ${flash === id ? "#f87171" : socket ? "#f87171" : `${p.color}99`}`,
                      boxShadow: filled ? `0 0 22px ${p.color}55` : "none",
                      cursor: selected && !filled ? "pointer" : "default",
                      transition: "background 0.3s, box-shadow 0.3s",
                    }}
                  >
                    {socket ? "?" : p.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* parts tray */}
        <div style={{ ...box, width: "min(100%, 980px)" }}>
          <div style={label}>{step === "build" ? "Parts tray" : "Spare parts bin"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginTop: 10 }}>
            {TRAY.map((id) => {
              const available = step === "build" ? !placed.includes(id) : true;
              if (!available) {
                return <div key={id} style={{ height: 64, borderRadius: 12, border: "2px dashed rgba(160,190,230,0.15)" }} />;
              }
              return (
                <button
                  key={id}
                  draggable={!fixed && !busy}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", id);
                    grab(id);
                  }}
                  onClick={() => {
                    grab(id);
                    setSelected(selected === id ? null : id);
                  }}
                  style={{
                    height: 64, borderRadius: 12, border: "none", cursor: fixed ? "default" : "grab",
                    background: PARTS[id].color, color: "#0b1226", fontWeight: 800, fontSize: 13,
                    boxShadow: "0 5px 0 rgba(0,0,0,0.35)",
                    outline: selected === id ? "3px solid #e6f1ff" : "none", outlineOffset: 2,
                    opacity: fixed ? 0.5 : 1,
                  }}
                >
                  {PARTS[id].label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
