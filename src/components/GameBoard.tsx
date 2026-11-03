"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CpuVisual } from "@/components/CpuVisual";
import { ThemeProvider } from "@/lib/theme";
import { getCpuRank } from "@/lib/cpuRanks";
import { computeCpuPerformance, formatClockHz } from "@/lib/cpuStats";
import { formatMoney } from "@/lib/format";
import { UPGRADES } from "@/data/upgrades";
import type { UpgradeId } from "@/types/game";
import {
  ACCEPTED_QUEUE_LIMIT, JOB_KINDS, WORKLOADS, WORKLOAD_QUESTIONS, acceptWorkload, advanceWorkloads,
  answerWorkloadQuestion, buyWorkloadUpgrade, closeWorkloadQuestion,
  createWorkloadGame, estimatedSeconds, jobProcessingSeconds, migrateWorkloadGame,
  workloadUpgradeCost, type JobKind, type WorkloadGameState,
  type WorkloadJob,
} from "@/lib/workloads";

const SAVE_KEY = "overclocked-workload-mode-v2";
const LEGACY_SAVE_KEY = "overclocked-workload-mode-v1";
const HELP_KEY = "overclocked-workload-help-v2";

function isSavedGame(candidate: unknown): candidate is WorkloadGameState {
  if (!candidate || typeof candidate !== "object") return false;
  const value = candidate as Partial<WorkloadGameState>;
  return !!value.cpu?.upgradeLevels && typeof value.cpu.money === "number" &&
    Array.isArray(value.workload?.jobs) && Array.isArray(value.workload?.next) &&
    typeof value.workload?.quizAt === "number";
}

function useWorkloadGame(paused: boolean) {
  const [game, setGame] = useState(createWorkloadGame);
  const [ready, setReady] = useState(false);
  const latestGame = useRef(game);

  useEffect(() => { latestGame.current = game; }, [game]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(LEGACY_SAVE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isSavedGame(parsed)) {
          // The simulation pauses when the browser tab is away; no off-screen job losses.
          // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved state on mount
          setGame(migrateWorkloadGame(parsed));
        }
      }
    } catch { /* a malformed or unavailable save starts a fresh session */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      setGame((prev) => {
        const now = Date.now();
        if (paused || prev.workload.quiz || document.hidden) return { ...prev, lastTick: now };
        return advanceWorkloads(prev, now);
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [ready, paused]);

  // Save every two seconds, not on every animation frame.
  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(latestGame.current)); } catch { /* ignore blocked storage */ }
    }, 2000);
    return () => window.clearInterval(id);
  }, [ready]);

  const buy = useCallback((id: UpgradeId) => setGame((prev) => buyWorkloadUpgrade(prev, id)), []);
  const accept = useCallback((id: number) => setGame((prev) => acceptWorkload(prev, id)), []);
  const answer = useCallback((choice: number) => setGame((prev) => answerWorkloadQuestion(prev, choice)), []);
  const dismiss = useCallback((targetId?: number, replacement?: JobKind) => setGame((prev) => closeWorkloadQuestion(prev, targetId, replacement)), []);
  const reset = useCallback(() => {
    if (!window.confirm("Start a new CPU build and clear workload-mode progress?")) return;
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    setGame(createWorkloadGame());
  }, []);

  return { game, ready, buy, accept, answer, dismiss, reset };
}

function JobCard({ job, cpu, onAccept, canAccept }: {
  job: WorkloadJob; cpu: WorkloadGameState["cpu"];
  onAccept: () => void; canAccept: boolean;
}) {
  const def = WORKLOADS[job.kind];
  const lifePct = Math.min(100, Math.max(0, (job.timeLeft / job.lifetime) * 100));
  return (
    <button
      type="button"
      onClick={onAccept}
      disabled={!canAccept}
      title={`${def.title}. ${def.bestFor}`}
      aria-label={`Accept ${def.title}, worth ${job.reward} compute points, approximately ${Math.ceil(jobProcessingSeconds(job, cpu))} seconds of CPU processing`}
      className="group absolute left-1 right-1 z-10 rounded-lg border border-white/20 p-2 text-left shadow-lg transition-[border-color,box-shadow] enabled:hover:border-white/70 enabled:hover:shadow-[0_0_20px_rgba(56,189,248,0.24)] disabled:cursor-not-allowed disabled:opacity-60 sm:left-2 sm:right-2"
      style={{
        top: `${Math.min(75, Math.max(2, 2 + (1 - job.timeLeft / job.lifetime) * 73))}%`,
        background: `linear-gradient(135deg, ${def.accent}30, rgba(15,23,42,0.96) 65%)`,
        borderLeft: `3px solid ${def.accent}`,
      }}
    >
      <span className="block truncate font-mono text-[10px] font-bold sm:text-xs" style={{ color: def.accent }}>
        {def.title}
      </span>
      <span className="mt-1 block font-mono text-[9px] text-slate-200 sm:text-[10px]">
        +{job.reward} CP · ~{jobProcessingSeconds(job, cpu).toFixed(0)}s CPU
      </span>
      <span className="mt-1 flex items-center justify-between gap-1 font-mono text-[9px]">
        <span className="text-slate-400">{Math.ceil(job.timeLeft)}s to decide</span>
        <span className={`rounded px-1.5 py-0.5 font-bold ${canAccept ? "bg-emerald-400/20 text-emerald-300" : "bg-slate-600/50 text-slate-400"}`}>
          {canAccept ? "ACCEPT" : "QUEUE FULL"}
        </span>
      </span>
      <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/15">
        <span className="block h-full rounded-full bg-cyan-400/80" style={{ width: `${lifePct}%` }} />
      </span>
    </button>
  );
}

function QuestionCard({ game, answer, dismiss }: {
  game: WorkloadGameState;
  answer: (index: number) => void;
  dismiss: (targetId?: number, replacement?: JobKind) => void;
}) {
  const [swapTargetId, setSwapTargetId] = useState<number | null>(null);
  const quiz = game.workload.quiz;
  if (!quiz) return null;
  const question = WORKLOAD_QUESTIONS[game.workload.questionIndex % WORKLOAD_QUESTIONS.length]!;
  const solved = quiz.answer !== null;
  const selectedOffer = game.workload.jobs.find((job) => job.id === swapTargetId);
  return (
    <div className="rounded-xl border border-violet-400/50 bg-[#17142d]/95 p-3 shadow-[0_0_30px_rgba(167,139,250,0.12)]">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">Contract reroute</p>
        <span className="font-mono text-[9px] text-slate-400">GAME PAUSED</span>
      </div>
      <p className="mt-2 text-sm font-medium text-white">{question.question}</p>
      <div className="mt-3 grid gap-1.5">
        {question.choices.map((choice, index) => (
          <button
            type="button"
            key={choice}
            disabled={solved}
            onClick={() => answer(index)}
            className={`rounded-md border px-2.5 py-2 text-left text-xs transition ${
              solved && index === question.correct ? "border-emerald-400 bg-emerald-400/20 text-emerald-100" :
                solved && index === quiz.answer ? "border-rose-400 bg-rose-400/20 text-rose-100" :
                  "border-white/15 bg-white/5 text-slate-200 hover:border-violet-400/70 disabled:cursor-default"
            }`}
          >
            <span className="mr-1.5 font-mono text-slate-400">{index + 1}.</span> {choice}
          </button>
        ))}
      </div>
      {solved ? (
        <div className="mt-3 border-t border-white/15 pt-3">
          <p className={`text-xs font-semibold ${quiz.canSwap ? "text-emerald-300" : "text-amber-300"}`}>
            {quiz.canSwap ? "Correct! Exchange one of the falling offers." : "Not quite. Your on-screen offers stay the same."}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{question.explanation}</p>
          {quiz.canSwap && (
            <div className="mt-3">
              <p className="font-mono text-[10px] text-violet-200">1 · SELECT A FALLING OFFER</p>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {game.workload.jobs.map((job) => (
                  <button
                    type="button"
                    key={job.id}
                    onClick={() => setSwapTargetId(job.id)}
                    className={`rounded-md border p-1.5 text-left text-[10px] ${swapTargetId === job.id ? "border-violet-300 bg-violet-400/20" : "border-white/15 bg-white/5 hover:border-violet-400/70"}`}
                  >
                    <span className="block font-semibold">#{job.id} {WORKLOADS[job.kind].title}</span>
                    <span className="text-slate-400">{Math.ceil(job.timeLeft)}s left</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 font-mono text-[10px] text-violet-200">2 · CHOOSE ITS REPLACEMENT</p>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {JOB_KINDS.map((kind) => (
                  <button
                    type="button"
                    key={kind}
                    disabled={!selectedOffer}
                    onClick={() => { dismiss(selectedOffer?.id, kind); setSwapTargetId(null); }}
                    className="rounded-md border border-white/20 bg-white/5 p-1.5 text-left text-[10px] enabled:hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderLeftColor: WORKLOADS[kind].accent, borderLeftWidth: "3px" }}
                  >
                    {WORKLOADS[kind].title}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-400">Replacement keeps the original offer&apos;s remaining deadline.</p>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-[10px] leading-relaxed text-slate-400">Answer correctly to swap a block already on screen. This question is optional.</p>
      )}
      <button
        type="button"
        onClick={() => { dismiss(); setSwapTargetId(null); }}
        className="mt-3 w-full rounded-md border border-violet-400/40 px-2 py-2 font-mono text-[11px] text-violet-200 hover:bg-violet-400/10"
      >
        {solved ? "Keep current offers and continue" : "Skip this question"}
      </button>
    </div>
  );
}

function WorkloadBoard({ game, accept }: { game: WorkloadGameState; accept: (id: number) => void }) {
  const w = game.workload;
  const running = w.accepted[0];
  const waiting = w.accepted[1];
  const available = w.accepted.length < ACCEPTED_QUEUE_LIMIT && !w.quiz;
  return (
    <div className="flex h-[min(63dvh,630px)] min-h-[500px] flex-col overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-950/80 shadow-2xl backdrop-blur-md lg:h-full">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 p-3 sm:p-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">Incoming contracts</p>
          <p className="mt-0.5 text-xs text-slate-300">Choose which jobs are worth accepting. Unaccepted offers expire.</p>
        </div>
        <div className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-xs text-white">
          Next arrival: {w.spawnIn.toFixed(1)}s
        </div>
      </div>
      <div className="relative min-h-[230px] flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(30,41,59,0.24),rgba(15,23,42,0.95))]">
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="relative border-r border-dashed border-white/10 last:border-0">
              <p className="absolute inset-x-0 top-2 text-center font-mono text-[9px] uppercase tracking-widest text-slate-600">
                LANE {index + 1}
              </p>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-11 border-t-2 border-dashed border-rose-400/80 bg-rose-950/35 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-rose-300">
          Deadline · Unaccepted offers expire
        </div>
        <div className="absolute inset-0 grid grid-cols-3">
          {Array.from({ length: 3 }, (_, lane) => (
            <div key={lane} className="relative">
              {w.jobs.filter((job) => job.id % 3 === lane).map((job) => (
                <JobCard key={job.id} job={job} cpu={game.cpu} canAccept={available} onAccept={() => accept(job.id)} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="shrink-0 border-t border-white/10 bg-slate-900/95 px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-300">CPU · Accepted contracts {w.accepted.length}/{ACCEPTED_QUEUE_LIMIT}</p>
            <p className="truncate text-sm font-semibold text-white">
              {running ? `Processing: ${WORKLOADS[running.kind].title}` : "Idle · click ACCEPT on a falling offer"}
            </p>
            {waiting && <p className="mt-0.5 truncate font-mono text-[10px] text-amber-200">Queued: {WORKLOADS[waiting.kind].title}</p>}
          </div>
          <div className="shrink-0 text-right">
            {running && <p className="font-mono text-[11px] text-slate-300">~{jobProcessingSeconds(running, game.cpu).toFixed(0)}s left</p>}
            {w.lastEvent && <p className="font-mono text-[10px] text-emerald-300">Last: +{w.lastEvent.reward} CP</p>}
          </div>
        </div>
        {running ? (
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full rounded-full bg-cyan-400 transition-[width] duration-100" style={{ width: `${Math.min(100, Math.max(0, (1 - running.remaining / running.initialWork) * 100))}%` }} />
          </div>
        ) : <div className="mt-2 h-2 rounded-full bg-slate-800" />}
      </div>
    </div>
  );
}

/** Compact specification sheet, positioned to the left of the CPU / contract board. */
function CpuSpecs({ cpu }: { cpu: WorkloadGameState["cpu"] }) {
  const levels = cpu.upgradeLevels;
  const perf = computeCpuPerformance(levels);
  const specs: { short: string; full: string; value: string }[] = [
    { short: "CORE", full: "Number of CPU cores", value: String(perf.coreCount) },
    { short: "TOP", full: "Fastest single core clock (all cores are identical in this model)", value: formatClockHz(perf.clockHz) },
    { short: "CU", full: "Control unit level", value: `L${levels.controlUnit}` },
    { short: "ALU", full: "Arithmetic logic unit level", value: `L${levels.alu}` },
    { short: "REG", full: "Register upgrade level", value: `L${levels.registers}` },
    { short: "CLK", full: "Clock upgrade level", value: `L${levels.clock}` },
    { short: "CCH", full: "Cache upgrade level", value: `L${levels.cache}` },
    { short: "BUS", full: "Bus upgrade level", value: `L${levels.buses}` },
    { short: "PIPE", full: "Pipeline upgrade level", value: `L${levels.pipeline}` },
    { short: "FWD", full: "Forwarding upgrade level", value: `L${levels.forwarding}` },
    { short: "BP", full: "Branch prediction upgrade level", value: `L${levels.branchPrediction}` },
    { short: "OC", full: "Overclocking upgrade level", value: `L${levels.overclocking}` },
    { short: "COOL", full: "Cooling upgrade level", value: `L${levels.cooling}` },
  ];
  return (
    <aside className="self-start rounded-xl border border-cyan-400/25 bg-slate-900/90 p-2.5 shadow-xl backdrop-blur-md lg:self-auto" aria-label="CPU specifications">
      <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-300">CPU SPECS</p>
      <div className="grid grid-cols-3 gap-x-3 gap-y-1 sm:grid-cols-4 lg:grid-cols-1 lg:gap-0">
        {specs.map(({ short, full, value }) => (
          <div key={short} title={full} className="flex min-w-0 justify-between gap-1 border-b border-white/5 py-1 font-mono text-[10px] last:border-b-0">
            <span className="text-slate-400">{short}</span>
            <span className="truncate font-semibold text-cyan-100">{value}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 hidden text-[9px] leading-relaxed text-slate-500 lg:block">TOP = per-core clock. L = upgrade level. Hover for names.</p>
    </aside>
  );
}

function UpgradeDrawer({ game, open, onClose, onBuy, onReset }: {
  game: WorkloadGameState; open: boolean; onClose: () => void;
  onBuy: (id: UpgradeId) => void; onReset: () => void;
}) {
  return (
    <>
      {open && <button type="button" aria-label="Close upgrades" className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />}
      <aside className={`fixed inset-y-0 right-0 z-50 flex w-[min(100vw,27rem)] flex-col border-l border-cyan-400/30 bg-slate-950 text-slate-100 shadow-2xl transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`} aria-hidden={!open}>
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">CPU workshop</p>
            <p className="mt-1 text-xs text-slate-400">Tune hardware to clear more jobs.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-white/20 px-3 py-2 text-xs hover:bg-white/10">Close</button>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
          {UPGRADES.map((u) => {
            const level = game.cpu.upgradeLevels[u.id] ?? 0;
            const price = workloadUpgradeCost(u.id, level);
            const enabled = game.cpu.money >= price;
            return (
              <div key={u.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{u.name} <span className="font-mono text-xs font-normal text-cyan-300">Lv {level}</span></p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{u.educationalNote}</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-300">{u.formatSpec(level)} → {u.formatSpec(level + 1)}</p>
                  </div>
                  <button type="button" disabled={!enabled} onClick={() => onBuy(u.id)} className="shrink-0 rounded-lg border border-cyan-400/40 bg-cyan-400/15 px-3 py-2 font-mono text-[11px] font-semibold text-cyan-200 enabled:hover:bg-cyan-400/30 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500">
                    {formatMoney(price)} CP
                  </button>
                </div>
              </div>
            );
          })}
          <div className="pt-4">
            <button type="button" onClick={onReset} className="rounded-md border border-rose-400/40 px-3 py-2 text-xs text-rose-300 hover:bg-rose-400/10">Reset game progress</button>
          </div>
        </div>
      </aside>
    </>
  );
}

function GameBoardInner() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { game, ready, buy, accept, answer, dismiss, reset } = useWorkloadGame(drawerOpen || helpOpen);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show help once for new players
    try { if (!localStorage.getItem(HELP_KEY)) setHelpOpen(true); } catch { setHelpOpen(true); }
  }, []);
  const closeHelp = () => {
    try { localStorage.setItem(HELP_KEY, "yes"); } catch { /* ignore */ }
    setHelpOpen(false);
  };
  const cpu = game.cpu;
  const w = game.workload;
  if (!ready) return <div className="flex h-screen items-center justify-center bg-slate-950 font-mono text-cyan-300">BOOTING OVERCLOCKED…</div>;

  return (
    <div className="relative h-[100dvh] min-h-[560px] overflow-y-auto bg-slate-950 text-slate-100 lg:overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <CpuVisual immersive offline={false} state={cpu} levels={cpu.upgradeLevels} cpuLevel={Object.values(cpu.upgradeLevels).reduce((a, b) => a + b, 0)} upgradeFlash={0} rank={getCpuRank(cpu.completedLearningCheckpoints)} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/80" />
      <header className="relative z-10 mx-auto flex h-[88px] max-w-7xl items-start justify-between gap-3 px-3 pt-3 sm:px-6 sm:pt-4">
        <div>
          <h1 className="font-mono text-sm font-black tracking-[0.2em] text-cyan-300 sm:text-lg">OVERCLOCKED</h1>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-slate-400">Workload lab</p>
        </div>
        <div className="rounded-xl border border-cyan-400/25 bg-slate-900/85 px-4 py-2 text-center backdrop-blur-md">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-300">Compute points</p>
          <p className="font-mono text-xl font-bold tabular-nums text-emerald-300 sm:text-2xl">{formatMoney(cpu.money)}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setHelpOpen(true)} className="rounded-xl border border-white/20 bg-slate-900/90 px-3 py-3 font-mono text-xs hover:bg-slate-800">?</button>
          <button type="button" onClick={() => setDrawerOpen(true)} className="rounded-xl border border-cyan-400/50 bg-cyan-400/15 px-3 py-3 font-mono text-xs font-bold text-cyan-200 hover:bg-cyan-400/25 sm:px-5">UPGRADES</button>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-3 px-3 pb-3 sm:px-6 lg:h-[calc(100dvh-100px)] lg:min-h-[440px] lg:grid-cols-[156px_minmax(0,1fr)_292px]">
        <CpuSpecs cpu={cpu} />
        <WorkloadBoard game={game} accept={accept} />
        <section className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/85 p-3 backdrop-blur-md lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["COMPLETED", w.processed, "text-emerald-300"],
              ["MISSED", w.missed, "text-rose-300"],
              ["OFFERS", w.jobs.length, "text-cyan-300"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-slate-900/90 p-2 text-center">
                <p className="font-mono text-[9px] tracking-wider text-slate-400">{label}</p>
                <p className={`mt-1 font-mono text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-cyan-400/20 bg-slate-900/90 p-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-cyan-300">Next workloads</p>
            </div>
            <div className="mt-2 space-y-1.5">
              {w.next.map((kind, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2.5 py-2" style={{ borderLeft: `3px solid ${WORKLOADS[kind].accent}` }}>
                  <div>
                    <p className="font-mono text-[10px] text-slate-400">{index === 0 ? "NEXT" : `+${index}`}</p>
                    <p className="text-xs font-semibold">{WORKLOADS[kind].title}</p>
                  </div>
                  <span className="font-mono text-xs text-slate-300">~{estimatedSeconds(kind, cpu).toFixed(1)}s</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400">Times are estimates at your CPU&apos;s current settings.</p>
          </div>
          <QuestionCard game={game} answer={answer} dismiss={dismiss} />
          {!w.quiz && (
            <div className="rounded-xl border border-violet-400/20 bg-slate-900/90 p-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-violet-300">Control signal</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">One question appears every 7 completed contracts. A correct answer lets you replace one falling block already on the screen.</p>
              <p className="mt-2 font-mono text-[10px] text-slate-400">Next question in {Math.max(0, w.quizAt - w.processed)} completed jobs</p>
            </div>
          )}
          <div className="rounded-xl border border-white/10 bg-slate-900/90 p-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-300">Workload guide</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-300">Core count excels at parallel and batch jobs. Clock/ALU help serial jobs. Registers, cache, buses and branch prediction solve other bottlenecks.</p>
            <button type="button" onClick={() => setDrawerOpen(true)} className="mt-2 rounded-md border border-cyan-400/40 px-3 py-2 font-mono text-[10px] text-cyan-200 hover:bg-cyan-400/10">Tune your CPU</button>
          </div>
        </section>
      </main>

      <UpgradeDrawer game={game} open={drawerOpen} onClose={() => setDrawerOpen(false)} onBuy={buy} onReset={() => { reset(); }} />
      {helpOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-400/35 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">Welcome to workload lab</p>
            <h2 className="mt-2 text-xl font-bold">Learn CPU design by running jobs.</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
              <p><strong className="text-white">1. Watch offers fall.</strong> Each block is a contract. You decide whether the reward is worth its CPU processing time.</p>
              <p><strong className="text-white">2. Accept contracts.</strong> Click ACCEPT on an offer to send it to your CPU. Your CPU only works on jobs you accept. It can hold two accepted jobs: one running and one queued. Unaccepted offers expire.</p>
              <p><strong className="text-white">3. Upgrade your CPU.</strong> Spend CP on more cores, faster clocks, registers, buses and other hardware. Each helps different jobs.</p>
              <p><strong className="text-white">4. Swap a falling block.</strong> Every seven completed contracts, an optional question pauses the game. Answer correctly to choose an on-screen offer and replace its workload type.</p>
            </div>
            <p className="mt-4 rounded-lg bg-white/5 p-2 text-[11px] text-slate-400">Processing speed is a simplified gameplay model of real CPU tradeoffs, not a cycle-accurate simulator.</p>
            <button type="button" onClick={closeHelp} className="mt-5 w-full rounded-xl bg-cyan-400 px-4 py-3 font-mono text-sm font-bold text-slate-950 hover:bg-cyan-300">START PLAYING</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function GameBoard() {
  return <ThemeProvider><GameBoardInner /></ThemeProvider>;
}
