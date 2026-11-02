"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { FixId, GridSpec, PipelineSpec, StageName, WalkSpec } from "@/data/bank/pipelineSpec";
import { COLS, simulate, type SimCell, type SimRow } from "@/lib/pipelineSim";

/**
 * Left panel of the Stage 2 missions: a dark "scope" view of the pipeline.
 * Walk mode (M1): step one instruction through the five stages and watch the parts light up.
 * Grid mode (M2 to M4): a time-space diagram. The player tries all four fixes freely;
 * the diagram and the cycle count change live. Nothing here is graded.
 */

const STAGES: StageName[] = ["IF", "ID", "EX", "MEM", "WB"];

const STAGE_COLOR: Record<StageName, string> = {
    IF: "#22d3ee",
    ID: "#a78bfa",
    EX: "#fbbf24",
    MEM: "#4ade80",
    WB: "#f472b6",
};

const STAGE_NAME: Record<StageName, string> = {
    IF: "Fetch",
    ID: "Decode",
    EX: "Execute",
    MEM: "Memory",
    WB: "Write back",
};

const FIXES: { id: FixId; name: string; tip: string }[] = [
    { id: "stall", name: "Stall", tip: "insert idle cycles" },
    { id: "forward", name: "Forward", tip: "bypass the result" },
    { id: "predict", name: "Predict + flush", tip: "guess not taken" },
    { id: "split", name: "Split memories", tip: "code and data apart" },
];

const CSS = `
@keyframes pv-pop{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}
@keyframes pv-pulse{0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,0)}50%{box-shadow:0 0 0 4px rgba(248,113,113,.45)}}
.pv-pop{animation:pv-pop .25s ease-out both}
.pv-bad{animation:pv-pulse 1.4s ease-in-out infinite}
.pv-lines{background-image:linear-gradient(rgba(148,163,184,.07) 1px,transparent 1px);background-size:100% 22px}
@media (prefers-reduced-motion:reduce){.pv-root *{animation:none!important}}
`;

function Header({ title, command, locked }: { title: string; command: string; locked: boolean }) {
    return (
        <>
            <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-300">{title}</p>
                {locked && (
                    <span className="rounded-full border border-emerald-400/50 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                        Locked in ✓
                    </span>
                )}
            </div>
            <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100">
                {command}
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ walk (M1) */

function Walk({ spec, command, locked }: { spec: WalkSpec; command: string; locked: boolean }) {
    const [i, setI] = useState(0);
    const step = spec.steps[i] ?? spec.steps[0];
    if (!step) return null;
    const color = STAGE_COLOR[step.stage];

    return (
        <>
            <Header title="Pipeline · trace" command={command} locked={locked} />

            <div className="mt-4 grid grid-cols-5 gap-1.5">
                {spec.steps.map((s, k) => {
                    const c = STAGE_COLOR[s.stage];
                    const on = k === i;
                    return (
                        <button
                            key={s.stage}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setI(k)}
                            className="rounded-md border px-1 py-2 text-center font-mono transition"
                            style={{
                                borderColor: on ? c : "#334155",
                                background: on ? `${c}26` : "transparent",
                                color: on ? c : "#94a3b8",
                                boxShadow: on ? `0 0 14px ${c}55` : "none",
                            }}
                        >
                            <span className="block text-sm font-bold">{s.stage}</span>
                            <span className="block text-[9px] uppercase tracking-wider opacity-80">
                                {STAGE_NAME[s.stage]}
                            </span>
                        </button>
                    );
                })}
            </div>

            <ul className="pv-lines mt-4 flex flex-col gap-1.5 rounded-lg border border-slate-800 p-3">
                {spec.parts.map((p) => {
                    const lit = step.lit.includes(p);
                    return (
                        <li
                            key={p}
                            className="flex items-center gap-3 rounded-md border px-3 py-2 font-mono text-sm transition"
                            style={{
                                borderColor: lit ? color : "#1e293b",
                                background: lit ? `${color}1f` : "transparent",
                                color: lit ? "#f8fafc" : "#64748b",
                                boxShadow: lit ? `0 0 16px ${color}44` : "none",
                            }}
                        >
                            <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: lit ? color : "#334155", boxShadow: lit ? `0 0 8px ${color}` : "none" }}
                            />
                            {p}
                            {lit && <span className="ml-auto text-[10px] uppercase tracking-widest" style={{ color }}>busy</span>}
                        </li>
                    );
                })}
            </ul>

            <p className="mt-3 min-h-[2.75rem] text-sm leading-relaxed text-slate-300">
                <b style={{ color }}>{step.stage}</b> · {step.note}
            </p>

            <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Not graded. Click through the stages, then answer on the right.</p>
                <button
                    type="button"
                    onClick={() => setI((i + 1) % spec.steps.length)}
                    className="shrink-0 rounded-md border border-cyan-400/60 bg-cyan-400/10 px-3 py-1.5 font-mono text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/20"
                >
                    Step →
                </button>
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ grid (M2 to M4) */

function cellStyle(cell: SimCell): CSSProperties {
    if (cell.kind === "wait") {
        return {
            borderColor: "#64748b",
            borderStyle: "dashed",
            color: "#94a3b8",
            background: "repeating-linear-gradient(45deg,#1e293b,#1e293b 4px,#0f172a 4px,#0f172a 8px)",
        };
    }
    if (cell.kind === "flush") {
        return { borderColor: "#f87171", borderStyle: "dashed", color: "#f87171", background: "#450a0a" };
    }
    if (cell.kind === "wrong") {
        return { borderColor: "#ef4444", color: "#fecaca", background: "#7f1d1d" };
    }
    const c = cell.stage ? STAGE_COLOR[cell.stage] : "#e2e8f0";
    const s: CSSProperties = { borderColor: c, color: c, background: `${c}22` };
    if (cell.bad) {
        s.borderColor = "#ef4444";
        s.color = "#ffffff";
        s.background = "#b91c1c";
    }
    if (cell.fwd) s.boxShadow = `0 0 0 2px ${c}, 0 0 14px ${c}`;
    return s;
}

function Grid({ spec, command, locked }: { spec: GridSpec; command: string; locked: boolean }) {
    const [fix, setFix] = useState<FixId | null>(null);
    const [taken, setTaken] = useState(false);
    const sim = useMemo(() => simulate(spec, fix, taken), [spec, fix, taken]);
    const cols = COLS[spec.hazard];
    const penalty = sim.cycles - sim.ideal;
    const runKey = `${fix ?? "none"}-${taken ? "t" : "n"}`;

    const badge =
        sim.status === "cleared"
            ? { text: "Hazard cleared", cls: "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" }
            : sim.status === "open"
              ? { text: "Hazard still here", cls: "border-red-400/60 bg-red-500/15 text-red-300" }
              : { text: "No hazard this time", cls: "border-slate-500/60 bg-slate-500/10 text-slate-300" };

    return (
        <>
            <Header title={`Pipeline · ${spec.hazard === "raw" ? "data" : spec.hazard} hazard`} command={command} locked={locked} />

            <div className="mt-4 flex flex-wrap gap-1.5">
                {FIXES.map((f) => {
                    const on = fix === f.id;
                    return (
                        <button
                            key={f.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setFix(on ? null : f.id)}
                            title={f.tip}
                            className="rounded-md border px-2.5 py-1.5 text-left font-mono transition"
                            style={{
                                borderColor: on ? "#22d3ee" : "#334155",
                                background: on ? "rgba(34,211,238,.15)" : "transparent",
                                color: on ? "#a5f3fc" : "#cbd5e1",
                            }}
                        >
                            <span className="block text-xs font-bold">{f.name}</span>
                            <span className="block text-[9px] uppercase tracking-wider opacity-70">{f.tip}</span>
                        </button>
                    );
                })}
                {fix && (
                    <button
                        type="button"
                        onClick={() => setFix(null)}
                        className="rounded-md px-2 py-1.5 font-mono text-[11px] text-slate-400 underline-offset-2 hover:underline"
                    >
                        no fix
                    </button>
                )}
            </div>

            {spec.hazard === "control" && (
                <div className="mt-3 flex items-center gap-2 font-mono text-xs text-slate-400">
                    <span className="uppercase tracking-widest">Branch</span>
                    {([false, true] as const).map((t) => (
                        <button
                            key={String(t)}
                            type="button"
                            aria-pressed={taken === t}
                            onClick={() => setTaken(t)}
                            className="rounded-md border px-2.5 py-1 font-bold transition"
                            style={{
                                borderColor: taken === t ? "#fbbf24" : "#334155",
                                background: taken === t ? "rgba(251,191,36,.15)" : "transparent",
                                color: taken === t ? "#fde68a" : "#94a3b8",
                            }}
                        >
                            {t ? "Taken" : "Not taken"}
                        </button>
                    ))}
                </div>
            )}

            <div className="pv-lines mt-4 overflow-x-auto rounded-lg border border-slate-800 p-2">
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `136px repeat(${cols}, minmax(34px, 1fr))`,
                        gap: 4,
                        minWidth: 136 + cols * 38,
                    }}
                >
                    <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500">cycle</div>
                    {Array.from({ length: cols }, (_, c) => (
                        <div key={c} className="text-center font-mono text-[10px] text-slate-500">
                            {c + 1}
                        </div>
                    ))}

                    {sim.rows.map((row, r) => (
                        <RowView key={r} row={row} cols={cols} runKey={`${runKey}-${r}`} />
                    ))}
                </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-slate-500">
                {STAGES.map((s) => (
                    <span key={s} className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm" style={{ background: STAGE_COLOR[s] }} />
                        {s}
                    </span>
                ))}
                <span>⏸ idle</span>
                <span>✗ flushed</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2.5 font-mono text-xs">
                <span className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-200">
                    CYCLES <b className="text-sm text-white">{sim.cycles}</b>
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-400">
                    IDEAL {sim.ideal}
                </span>
                <span
                    className={`rounded-md border px-2.5 py-1 font-bold ${
                        penalty > 0 ? "border-amber-400/60 bg-amber-400/10 text-amber-300" : "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                    }`}
                >
                    +{penalty}
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${badge.cls}`}>
                    {badge.text}
                </span>
            </div>
            <p className="mt-3 min-h-[3.5rem] text-sm leading-relaxed text-slate-300">{sim.message}</p>
            <p className="text-xs text-slate-500">Free sandbox: nothing here is graded. Try every fix, then answer on the right.</p>
        </>
    );
}

function RowView({ row, cols, runKey }: { row: SimRow; cols: number; runKey: string }) {
    return (
        <>
            <div
                title={row.label}
                className={`flex h-9 items-center truncate font-mono text-[11px] ${row.skipped ? "text-slate-600 line-through" : "text-slate-200"}`}
            >
                {row.label}
            </div>
            {Array.from({ length: cols }, (_, c) => {
                const cell = row.cells[c + 1];
                if (!cell) return <div key={c} className="h-9 rounded-md border border-slate-800/70" />;
                return (
                    <div
                        key={`${runKey}-${c}`}
                        className={`pv-pop flex h-9 items-center justify-center rounded-md border font-mono text-[11px] font-bold ${cell.bad ? "pv-bad" : ""}`}
                        style={cellStyle(cell)}
                    >
                        {cell.text}
                    </div>
                );
            })}
        </>
    );
}

/* ------------------------------------------------------------------ entry point */

interface PipelineViewProps {
    spec: PipelineSpec;
    command: string;
    /** The question has been answered (right, or revealed after two misses) */
    solved: boolean;
    correct: boolean;
}

export function PipelineView({ spec, command, solved, correct }: PipelineViewProps) {
    const locked = solved && correct;
    return (
        <section className="pv-root rounded-2xl border border-slate-700 bg-slate-950 p-5 text-slate-100 shadow-lg">
            <style>{CSS}</style>
            {spec.kind === "walk" ? (
                <Walk spec={spec} command={command} locked={locked} />
            ) : (
                <Grid spec={spec} command={command} locked={locked} />
            )}
        </section>
    );
}
