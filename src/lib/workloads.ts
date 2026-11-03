/**
 * Overclocked workload-mode prototype.
 *
 * This deliberately uses simplified relative units rather than pretending to be
 * a cycle-accurate CPU simulator. The important learning outcomes are the tradeoffs:
 * parallel fraction (Amdahl's law), serial clock speed, and data bottlenecks.
 */
import { UPGRADES } from "@/data/upgrades";
import { computeCpuPerformance } from "@/lib/cpuStats";
import { createInitialState } from "@/lib/gameLogic";
import type { GameState, UpgradeId } from "@/types/game";

export type JobKind = "serial" | "parallel" | "batch" | "register" | "memory" | "branch";

export interface WorkloadDefinition {
  kind: JobKind;
  title: string;
  short: string;
  description: string;
  bestFor: string;
  accent: string;
  baseWork: number;
  reward: number;
}

export const WORKLOADS: Record<JobKind, WorkloadDefinition> = {
  serial: {
    kind: "serial", title: "Serial math", short: "1 THREAD", description: "One task with steps that must run in order.",
    bestFor: "Clock speed, ALU and pipeline; extra cores don't shorten this job.", accent: "#fbbf24", baseWork: 21, reward: 26,
  },
  parallel: {
    kind: "parallel", title: "Parallel render", short: "PARALLEL", description: "Independent pieces of a render can run on multiple cores.",
    bestFor: "More cores, even if each is modest. Some work still remains serial.", accent: "#a78bfa", baseWork: 30, reward: 42,
  },
  batch: {
    kind: "batch", title: "Batch requests", short: "THROUGHPUT", description: "Lots of small independent requests can be split across cores.",
    bestFor: "Core count and bus bandwidth. Many simpler cores can outperform one fast core.", accent: "#fb923c", baseWork: 30, reward: 38,
  },
  register: {
    kind: "register", title: "Register loop", short: "ON-CHIP", description: "A tight calculation constantly reuses working values.",
    bestFor: "Registers, then ALU and clock. Reducing spills matters.", accent: "#34d399", baseWork: 24, reward: 32,
  },
  memory: {
    kind: "memory", title: "Memory stream", short: "DATA TRANSFER", description: "Move lots of data through the memory system.",
    bestFor: "Bus bandwidth and cache; faster cores won't fix a clogged bus.", accent: "#38bdf8", baseWork: 27, reward: 37,
  },
  branch: {
    kind: "branch", title: "Branch-heavy code", short: "CONTROL FLOW", description: "Unpredictable conditional branches disrupt instruction flow.",
    bestFor: "Branch prediction, control unit and forwarding.", accent: "#f472b6", baseWork: 24, reward: 34,
  },
};

export const JOB_KINDS = Object.keys(WORKLOADS) as JobKind[];

export interface WorkloadJob {
  id: number;
  kind: JobKind;
  remaining: number;
  initialWork: number;
  timeLeft: number;
  lifetime: number;
  reward: number;
}

export interface QuizState {
  answer: number | null;
  canSwap: boolean;
}

export interface WorkloadSession {
  jobs: WorkloadJob[]; // On-screen offers; only these fall and expire.
  accepted: WorkloadJob[]; // First entry runs, second entry waits in the CPU queue.
  next: JobKind[];
  rng: number;
  sequence: number;
  spawnIn: number;
  processed: number;
  missed: number;
  quizAt: number;
  questionIndex: number;
  quiz: QuizState | null;
  lastEvent: { title: string; reward: number; sequence: number } | null;
}

export interface WorkloadGameState {
  cpu: GameState;
  workload: WorkloadSession;
  lastTick: number;
}

/** Deterministic PRNG so the preview ALWAYS matches the blocks that actually arrive. */
function nextRandom(seed: number): [number, number] {
  const nextSeed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return [nextSeed, nextSeed / 4294967296];
}
function drawKind(seed: number): [number, JobKind] {
  const [newSeed, random] = nextRandom(seed);
  return [newSeed, JOB_KINDS[Math.floor(random * JOB_KINDS.length)]!];
}

export function createWorkloadGame(now = Date.now()): WorkloadGameState {
  let seed = 45123;
  const next: JobKind[] = [];
  for (let i = 0; i < 3; i++) {
    const result = drawKind(seed);
    seed = result[0];
    next.push(result[1]);
  }
  return {
    cpu: {
      ...createInitialState(now),
      // One core exists at launch; the first core purchase adds a second.
      upgradeLevels: { ...createInitialState(now).upgradeLevels, cores: 1 },
      // In this version, hardware is unlocked by playing, not passing quiz rounds.
      unlockedUpgrades: UPGRADES.map((upgrade) => upgrade.id),
    },
    lastTick: now,
    workload: {
      jobs: [], accepted: [], next, rng: seed, sequence: 0, spawnIn: 2.2,
      processed: 0, missed: 0,
      quizAt: 7, questionIndex: 0, quiz: null, lastEvent: null,
    },
  };
}

export const WORKLOAD_PRICES: Record<UpgradeId, number> = {
  controlUnit: 35,
  alu: 45,
  registers: 45,
  clock: 65,
  cache: 130,
  buses: 85,
  cores: 105,
  pipeline: 190,
  forwarding: 165,
  branchPrediction: 160,
  overclocking: 300,
  cooling: 350,
};

export function workloadUpgradeCost(id: UpgradeId, level: number): number {
  return Math.round(WORKLOAD_PRICES[id] * Math.pow(1.38, level));
}

/**
 * Gameplay rate in abstract units / second. The gain from parallelism uses
 * Amdahl's Law: 1 / ((1 - parallelFraction) + parallelFraction / cores).
 * Upgrading a core does not magically fix a bus-bound job.
 */
export function workRate(kind: JobKind, cpu: GameState): number {
  const l = cpu.upgradeLevels;
  const stats = computeCpuPerformance(l);
  const clock = 1 + Math.log2(Math.max(1, stats.clockHz / 5_000_000)) * 0.24;
  const alu = 1 + l.alu * 0.30;
  const pipeline = 1 + l.pipeline * 0.22 + l.forwarding * 0.08;
  const coreCount = stats.coreCount;
  const parallelSpeedup = (parallelFraction: number) =>
    1 / ((1 - parallelFraction) + parallelFraction / coreCount);
  const bus = 1 + l.buses * 0.75;
  const cache = 1 + l.cache * 0.45;
  const registers = 1 + l.registers * 0.75;
  const branch = 1 + l.branchPrediction * 0.72 + l.controlUnit * 0.15;
  const base = 1.3;
  switch (kind) {
    case "serial": return base * clock * alu * pipeline;
    case "parallel": return base * clock * (1 + l.alu * 0.12) * parallelSpeedup(0.87);
    case "batch": return base * (1 + (clock - 1) * 0.35) * parallelSpeedup(0.96) * (1 + l.buses * 0.16);
    case "register": return base * clock * registers * (1 + l.alu * 0.12);
    case "memory": return base * (1 + (clock - 1) * 0.1) * bus * cache;
    case "branch": return base * (1 + (clock - 1) * 0.35) * branch * (1 + l.forwarding * 0.2);
  }
}

export function estimatedSeconds(kind: JobKind, cpu: GameState): number {
  return WORKLOADS[kind].baseWork / workRate(kind, cpu);
}

export const JOB_LIFETIME = 72;
export const ACCEPTED_QUEUE_LIMIT = 2;

/** Estimates each offer including its current difficulty scaling. */
export function jobProcessingSeconds(job: WorkloadJob, cpu: GameState): number {
  return job.remaining / workRate(job.kind, cpu);
}

function difficultyPressure(completed: number): number {
  return Math.min(1.6, completed / 75);
}

function contractFor(kind: JobKind, completed: number): Pick<WorkloadJob, "initialWork" | "remaining" | "reward"> {
  const pressure = difficultyPressure(completed);
  const initialWork = WORKLOADS[kind].baseWork * (1 + pressure * 0.27);
  return {
    initialWork,
    remaining: initialWork,
    reward: Math.round(WORKLOADS[kind].reward * (1 + pressure * 0.35)),
  };
}

/**
 * Only accepted contracts get processed. Offers on the board do not use CPU time.
 * Unaccepted offers expire at the bottom; accepted contracts cannot expire.
 */
export function advanceWorkloads(current: WorkloadGameState, now: number): WorkloadGameState {
  let seconds = Math.min(0.5, Math.max(0, (now - current.lastTick) / 1000));
  if (seconds <= 0) return current;
  const cpu = { ...current.cpu };
  const w: WorkloadSession = {
    ...current.workload,
    jobs: current.workload.jobs.map((job) => ({ ...job })),
    accepted: current.workload.accepted.map((job) => ({ ...job })),
    next: [...current.workload.next],
  };
  while (seconds > 0.00001) {
    const dt = Math.min(0.1, seconds);
    seconds -= dt;
    w.spawnIn -= dt;

    // The CPU works only on the first accepted contract. Additional ones queue up.
    const running = w.accepted[0];
    if (running) {
      running.remaining -= workRate(running.kind, cpu) * dt;
      if (running.remaining <= 0) {
        cpu.money += running.reward;
        cpu.totalEarned += running.reward;
        w.processed += 1;
        w.lastEvent = { title: WORKLOADS[running.kind].title, reward: running.reward, sequence: running.id };
        w.accepted.shift();
      }
    }

    // Only unaccepted contracts continue falling and can time out.
    for (const job of w.jobs) job.timeLeft -= dt;
    const surviving = w.jobs.filter((job) => job.timeLeft > 0);
    w.missed += w.jobs.length - surviving.length;
    w.jobs = surviving;

    if (w.spawnIn <= 0) {
      const kind = w.next.shift()!;
      const [seed, nextKind] = drawKind(w.rng);
      w.rng = seed;
      w.next.push(nextKind);
      w.sequence += 1;
      w.jobs.push({
        id: w.sequence, kind, ...contractFor(kind, w.processed),
        lifetime: JOB_LIFETIME, timeLeft: JOB_LIFETIME,
      });
      // Slow, predictable arrivals; the game grows slightly busier with progress.
      w.spawnIn += Math.max(9.5, 13 - w.processed * 0.04);
    }
    // Do not trigger a swap question if there are no visible offers to exchange.
    if (w.processed >= w.quizAt && !w.quiz && w.jobs.length > 0) {
      w.quiz = { answer: null, canSwap: false };
    }
  }
  return { cpu, workload: w, lastTick: now };
}

/** Clicking ACCEPT commits an offer to the processor; no automatic acceptance. */
export function acceptWorkload(state: WorkloadGameState, id: number): WorkloadGameState {
  const w = state.workload;
  const chosen = w.jobs.find((job) => job.id === id);
  if (!chosen || w.accepted.length >= ACCEPTED_QUEUE_LIMIT || w.quiz) return state;
  return {
    ...state,
    workload: {
      ...w,
      jobs: w.jobs.filter((job) => job.id !== id),
      accepted: [...w.accepted, chosen],
    },
  };
}

/** Preserve upgrades/progress when opening saves created by the earlier prototype. */
export function migrateWorkloadGame(state: WorkloadGameState): WorkloadGameState {
  if (Array.isArray(state.workload.accepted)) return { ...state, lastTick: Date.now() };
  const legacy = state.workload as WorkloadSession & { activeId?: number | null };
  const accepted = legacy.jobs.filter((job) => job.id === legacy.activeId);
  const offers = legacy.jobs.filter((job) => job.id !== legacy.activeId).map((job) => ({
    ...job,
    ...contractFor(job.kind, legacy.processed),
    lifetime: JOB_LIFETIME,
    timeLeft: JOB_LIFETIME * Math.max(0, Math.min(1, job.timeLeft / job.lifetime)),
  }));
  return {
    ...state,
    lastTick: Date.now(),
    workload: { ...legacy, jobs: offers, accepted, spawnIn: Math.max(1, legacy.spawnIn) },
  };
}

export interface WorkloadQuestion {
  question: string;
  choices: readonly [string, string, string, string];
  correct: number;
  explanation: string;
}

export const WORKLOAD_QUESTIONS: readonly WorkloadQuestion[] = [
  {
    question: "Which upgrade will help an independent batch of tasks the most?",
    choices: ["More CPU cores", "More register names", "A louder cooling fan", "A bigger instruction pointer"],
    correct: 0,
    explanation: "Independent tasks can run at the same time on different cores. This workload has a very high parallel fraction.",
  },
  {
    question: "Why might a single-threaded math task ignore your extra cores?",
    choices: ["Cores cannot do mathematics", "Its steps must run in order", "All RAM is broken", "Bus speed always wins"],
    correct: 1,
    explanation: "A dependent sequence cannot be split across cores. Faster execution on one core helps more.",
  },
  {
    question: "Your memory-stream blocks are falling behind. Which part should you try first?",
    choices: ["More branches", "More cores", "System bus", "Clock wallpaper"],
    correct: 2,
    explanation: "A memory transfer can be limited by bandwidth. Bus upgrades help move data even when compute is fast.",
  },
  {
    question: "Which upgrade reduces the need to move temporary values into slower memory?",
    choices: ["Branch predictor", "Registers", "Cooling", "Extra mouse buttons"],
    correct: 1,
    explanation: "Registers hold working values directly inside the CPU, reducing expensive spills to memory.",
  },
  {
    question: "A stream of unpredictable IF statements slows a CPU. What helps?",
    choices: ["Bigger screen", "More disk space", "Branch prediction", "More RAM slots only"],
    correct: 2,
    explanation: "Predictors reduce the cost of guessing which instruction path will be needed next.",
  },
  {
    question: "Can four slower cores always finish one serial task faster than a fast single core?",
    choices: ["Yes, always", "Only with RGB lighting", "No, the serial portion limits speedup", "Yes, if cache is empty"],
    correct: 2,
    explanation: "Amdahl's law: the non-parallel part limits the speedup, even with many cores.",
  },
];

export function answerWorkloadQuestion(state: WorkloadGameState, choice: number): WorkloadGameState {
  const w = state.workload;
  if (!w.quiz || w.quiz.answer !== null || choice < 0 || choice > 3) return state;
  const question = WORKLOAD_QUESTIONS[w.questionIndex % WORKLOAD_QUESTIONS.length]!;
  return {
    ...state,
    workload: {
      ...w,
      quiz: { answer: choice, canSwap: choice === question.correct },
    },
  };
}

/** After a correct answer, replace one CURRENT on-screen offer, preserving its deadline. */
export function closeWorkloadQuestion(
  state: WorkloadGameState,
  targetId?: number,
  replacement?: JobKind
): WorkloadGameState {
  const w = state.workload;
  if (!w.quiz) return state;
  const canReplace = w.quiz.canSwap && targetId !== undefined && replacement !== undefined &&
    !!WORKLOADS[replacement] && w.jobs.some((job) => job.id === targetId);
  const jobs = canReplace
    ? w.jobs.map((job) => job.id === targetId
      ? { ...job, kind: replacement!, ...contractFor(replacement!, w.processed) }
      : job)
    : w.jobs;
  return {
    ...state,
    workload: {
      // Schedule from the actual completed count, not an old quiz threshold.
      // Migrated saves can have processed >> quizAt; without this guard, skipping
      // instantly reopens another question and makes the game appear frozen.
      ...w, jobs, quiz: null, quizAt: Math.max(w.quizAt, w.processed) + 7, questionIndex: w.questionIndex + 1,
    },
  };
}

export function buyWorkloadUpgrade(state: WorkloadGameState, id: UpgradeId): WorkloadGameState {
  const level = state.cpu.upgradeLevels[id] ?? 0;
  const price = workloadUpgradeCost(id, level);
  if (state.cpu.money < price) return state;
  return {
    ...state,
    cpu: {
      ...state.cpu,
      money: state.cpu.money - price,
      upgradeLevels: { ...state.cpu.upgradeLevels, [id]: level + 1 },
    },
  };
}
