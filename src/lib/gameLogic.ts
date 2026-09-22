import { ACHIEVEMENTS } from "@/data/achievements";
import {
  CHECKPOINTS,
  getCheckpoint,
  type CheckpointId,
} from "@/data/checkpoints";
import { CHALLENGES } from "@/data/questions";
import {
  BASE_COMPUTE,
  BOOT_UNLOCKS,
  EMPTY_UPGRADE_LEVELS,
  LEGACY_UPGRADE_MAP,
  STARTING_UNLOCKS,
  UPGRADE_MAP,
  UPGRADES,
  getUpgradeCost,
} from "@/data/upgrades";
import {
  computeCpuPerformance,
  formatIps,
  getCpuPerformance,
  levelsWithUpgrade,
} from "@/lib/cpuStats";
import { formatPercent } from "@/lib/format";
import type {
  Challenge,
  CheckpointResolveResult,
  CourseMastery,
  CourseUnit,
  GameState,
  QuizFeedback,
  StatDelta,
  UpgradeId,
} from "@/types/game";
import { EMPTY_COURSE_MASTERY } from "@/types/game";

export const STORAGE_KEY = "overclocked-save-v4";
export const LEGACY_STORAGE_KEY = "overclocked-save-v3";
export const LEGACY_STORAGE_KEY_OLD = "overclocked-save-v2";
export const LEGACY_STORAGE_KEY_ANCIENT = "overclocked-save-v1";
export const LEGACY_STORAGE_KEY_TYCOON = "cpu-tycoon-save-v1";

function cloneMastery(src: CourseMastery = EMPTY_COURSE_MASTERY): CourseMastery {
  return {
    CPU: { ...src.CPU },
    Memory: { ...src.Memory },
    "Boolean Logic": { ...src["Boolean Logic"] },
    GPU: { ...src.GPU },
  };
}

export function createInitialState(now = Date.now()): GameState {
  return {
    money: 0,
    totalEarned: 0,
    upgradeLevels: { ...EMPTY_UPGRADE_LEVELS },
    unlockedUpgrades: [...STARTING_UNLOCKS],
    questionsAnswered: 0,
    correctAnswers: 0,
    answeredQuestionIds: [],
    unlockedAchievements: [],
    lastTick: now,
    nextBottleneckAt: Number.MAX_SAFE_INTEGER,
    activeBottleneckId: null,
    bottlenecksResolved: 0,
    courseMastery: cloneMastery(),
    completedLearningCheckpoints: [],
    activeCheckpointId: null,
    checkpointStep: 0,
  };
}

export function isCpuOnline(state: GameState): boolean {
  return state.completedLearningCheckpoints.includes("cpu-basics");
}

export function isProductionStalled(state: GameState): boolean {
  return !isCpuOnline(state) || !!state.activeCheckpointId;
}

/** Idle compute — 0 while offline or during a mandatory checkpoint */
export function getIncomePerSecond(state: GameState): number {
  if (isProductionStalled(state)) return 0;
  const perf = getCpuPerformance(state);
  return BASE_COMPUTE + perf.computePerSecond;
}

export function getCpuLevel(state: GameState): number {
  return Object.values(state.upgradeLevels).reduce((sum, level) => sum + level, 0);
}

export function isUpgradeUnlocked(state: GameState, id: UpgradeId): boolean {
  const def = UPGRADE_MAP[id];
  if (!def.requiresUnlock) return true;
  return state.unlockedUpgrades.includes(id);
}

export function tickIncome(state: GameState, now = Date.now()): GameState {
  const elapsedMs = Math.max(0, now - state.lastTick);
  if (elapsedMs < 50) {
    return { ...state, lastTick: now };
  }

  let next: GameState = { ...state, lastTick: now };

  // No offline/online earnings while stalled or offline
  if (!isProductionStalled(state)) {
    const cappedMs = Math.min(elapsedMs, 8 * 60 * 60 * 1000);
    const earned = getIncomePerSecond(state) * (cappedMs / 1000);
    if (earned > 0) {
      next = {
        ...next,
        money: next.money + earned,
        totalEarned: next.totalEarned + earned,
      };
    }
  }

  next = maybeActivateCheckpoint(next);
  return applyAchievements(next);
}

export function purchaseUpgrade(
  state: GameState,
  id: UpgradeId
): { state: GameState; delta: StatDelta } | null {
  if (isProductionStalled(state) && isCpuOnline(state)) {
    // Allow browsing costs while stalled? User said production paused — block purchases during stall to focus learning
    return null;
  }
  if (!isCpuOnline(state)) return null;

  const def = UPGRADE_MAP[id];
  if (!def) return null;
  if (!isUpgradeUnlocked(state, id)) return null;

  const level = state.upgradeLevels[id] ?? 0;
  const cost = getUpgradeCost(def, level);
  if (state.money < cost) return null;

  const before = computeCpuPerformance(state.upgradeLevels);
  const afterLevels = levelsWithUpgrade(state.upgradeLevels, id, 1);
  const after = computeCpuPerformance(afterLevels);

  let next: GameState = {
    ...state,
    money: state.money - cost,
    upgradeLevels: afterLevels,
  };

  next = maybeActivateCheckpoint(next);

  return {
    state: applyAchievements(next),
    delta: {
      before,
      after,
      explanation: def.educationalNote,
    },
  };
}

export function getQuizBonus(state: GameState): number {
  const income = Math.max(getIncomePerSecond(state), BASE_COMPUTE);
  return Math.max(25, Math.floor(income * 20 + 50));
}

function unlockIds(state: GameState, ids: UpgradeId[]): GameState {
  const unlocked = new Set(state.unlockedUpgrades);
  for (const id of ids) unlocked.add(id);
  return { ...state, unlockedUpgrades: Array.from(unlocked) };
}

function bumpLevel(state: GameState, id: UpgradeId, amount = 1): GameState {
  return {
    ...state,
    upgradeLevels: {
      ...state.upgradeLevels,
      [id]: (state.upgradeLevels[id] ?? 0) + amount,
    },
  };
}

export function startBootSequence(state: GameState): GameState {
  if (isCpuOnline(state) || state.activeCheckpointId === "cpu-basics") {
    return state;
  }
  return {
    ...state,
    activeCheckpointId: "cpu-basics",
    checkpointStep: 0,
  };
}

export function maybeActivateCheckpoint(state: GameState): GameState {
  if (state.activeCheckpointId) return state;
  if (!isCpuOnline(state)) return state;

  const completed = new Set(state.completedLearningCheckpoints);

  for (const cp of CHECKPOINTS) {
    if (cp.id === "cpu-basics") continue;
    if (completed.has(cp.id)) continue;
    if (!cp.requires.every((r) => completed.has(r))) continue;
    if (cp.minTotalEarned != null && state.totalEarned < cp.minTotalEarned) continue;
    if (cp.minCpuLevel != null && getCpuLevel(state) < cp.minCpuLevel) continue;

    return {
      ...state,
      activeCheckpointId: cp.id,
      checkpointStep: 0,
    };
  }

  return state;
}

function trackMastery(
  state: GameState,
  unit: CourseUnit,
  correct: boolean
): GameState {
  const mastery = cloneMastery(state.courseMastery ?? EMPTY_COURSE_MASTERY);
  mastery[unit] = {
    attempted: mastery[unit].attempted + 1,
    correct: mastery[unit].correct + (correct ? 1 : 0),
  };
  return {
    ...state,
    courseMastery: mastery,
    questionsAnswered: state.questionsAnswered + 1,
    correctAnswers: state.correctAnswers + (correct ? 1 : 0),
  };
}

export function answerCheckpointStep(
  state: GameState,
  choiceIndex: number
): {
  state: GameState;
  feedback: QuizFeedback;
  completedCheckpoint: boolean;
  resolve?: CheckpointResolveResult;
} | null {
  const cp = getCheckpoint(state.activeCheckpointId);
  if (!cp) return null;

  const step = state.checkpointStep;
  const question = cp.questions[step];
  if (!question) return null;

  const correct = choiceIndex === question.correctIndex;
  let next = trackMastery(state, cp.courseUnit, correct);

  if (!correct) {
    return {
      state: applyAchievements(next),
      feedback: {
        correct: false,
        explanation: question.explanation,
        correctAnswer: question.choices[question.correctIndex],
        bonus: 0,
        courseUnit: cp.courseUnit,
        hint: question.hint,
      },
      completedCheckpoint: false,
    };
  }

  // Correct — unlock stepwise components, advance
  if (question.unlockUpgrade) {
    next = unlockIds(next, [question.unlockUpgrade]);
    if ((next.upgradeLevels[question.unlockUpgrade] ?? 0) === 0) {
      next = bumpLevel(next, question.unlockUpgrade, 1);
    }
  }

  const nextStep = step + 1;
  const finished = nextStep >= cp.questions.length;

  if (!finished) {
    return {
      state: applyAchievements({ ...next, checkpointStep: nextStep }),
      feedback: {
        correct: true,
        explanation: question.explanation,
        correctAnswer: question.choices[question.correctIndex],
        bonus: 0,
        unlockedUpgrade: question.unlockUpgrade,
        courseUnit: cp.courseUnit,
      },
      completedCheckpoint: false,
    };
  }

  const beforeRate = isCpuOnline(state)
    ? BASE_COMPUTE + computeCpuPerformance(state.upgradeLevels).computePerSecond
    : 0;
  const beforePerf = computeCpuPerformance(state.upgradeLevels);

  next = unlockIds(next, cp.unlockUpgrades);
  for (const id of cp.unlockUpgrades) {
    if ((next.upgradeLevels[id] ?? 0) === 0) {
      next = bumpLevel(next, id, 1);
    }
  }

  // Intro: ensure boot parts are at least level 1
  if (cp.id === "cpu-basics") {
    next = unlockIds(next, BOOT_UNLOCKS);
    for (const id of BOOT_UNLOCKS) {
      if ((next.upgradeLevels[id] ?? 0) < 1) next = bumpLevel(next, id, 1);
    }
  }

  const completed = [
    ...new Set([...next.completedLearningCheckpoints, cp.id]),
  ];

  next = {
    ...next,
    completedLearningCheckpoints: completed,
    activeCheckpointId: null,
    checkpointStep: 0,
    bottlenecksResolved: next.bottlenecksResolved + 1,
  };

  const afterPerf = computeCpuPerformance(next.upgradeLevels);
  const afterRate = BASE_COMPUTE + afterPerf.computePerSecond;

  const resolve = buildResolve(cp.id, cp.title, beforeRate, afterRate, beforePerf, afterPerf, cp.relevantStat);

  next = maybeActivateCheckpoint(next);

  return {
    state: applyAchievements(next),
    feedback: {
      correct: true,
      explanation: question.explanation,
      correctAnswer: question.choices[question.correctIndex],
      bonus: 0,
      unlockedUpgrade: question.unlockUpgrade,
      courseUnit: cp.courseUnit,
      wasBottleneck: true,
    },
    completedCheckpoint: true,
    resolve,
  };
}

function buildResolve(
  id: string,
  title: string,
  beforeRate: number,
  afterRate: number,
  before: ReturnType<typeof computeCpuPerformance>,
  after: ReturnType<typeof computeCpuPerformance>,
  relevant?: string
): CheckpointResolveResult {
  const bodies: Record<string, string> = {
    "cpu-basics": "Core CPU components installed. The processor can execute instructions.",
    "fetch-decode-execute": "Instruction cycle clarified. Throughput foundations improved.",
    "memory-bottleneck": "Cache installed. Memory delays reduced.",
    "cache-hierarchy": "Cache hierarchy and buses strengthened.",
    "boolean-alu": "ALU datapath logic reinforced.",
    pipeline: "Pipeline unlocked. Instruction overlap enabled.",
    "data-hazards": "Forwarding unlocked. RAW stalls reduced.",
    "branch-prediction": "Branch predictor unlocked. Fewer wasted flushes.",
    multicore: "Additional cores unlocked for parallel work.",
    "cpu-vs-gpu": "Parallel architecture choice understood. Late-game headroom unlocked.",
  };

  const result: CheckpointResolveResult = {
    title: id === "cpu-basics" ? "CPU ONLINE" : `${title.toUpperCase()} RESOLVED`,
    body: bodies[id] ?? "Architecture improved.",
    beforeRate,
    afterRate,
  };

  if (relevant === "cacheHitRate") {
    result.relevantLabel = "Cache Hit Rate";
    result.relevantBefore = formatPercent(before.cacheHitRate);
    result.relevantAfter = formatPercent(after.cacheHitRate);
  } else if (relevant === "cpi") {
    result.relevantLabel = "CPI";
    result.relevantBefore = before.cpi.toFixed(2);
    result.relevantAfter = after.cpi.toFixed(2);
  } else if (relevant === "pipelineEfficiency") {
    result.relevantLabel = "Pipeline Efficiency";
    result.relevantBefore = formatPercent(before.pipelineEfficiency);
    result.relevantAfter = formatPercent(after.pipelineEfficiency);
  } else if (relevant === "branchAccuracy") {
    result.relevantLabel = "Branch Accuracy";
    result.relevantBefore = formatPercent(before.branchAccuracy);
    result.relevantAfter = formatPercent(after.branchAccuracy);
  } else if (relevant === "coreCount") {
    result.relevantLabel = "Cores";
    result.relevantBefore = String(before.coreCount);
    result.relevantAfter = String(after.coreCount);
  } else if (relevant === "ips") {
    result.relevantLabel = "IPS";
    result.relevantBefore = formatIps(before.ips);
    result.relevantAfter = formatIps(after.ips);
  }

  return result;
}

/** Optional free-practice challenges (not mandatory) */
export function answerQuestion(
  state: GameState,
  questionId: string,
  choiceIndex: number
): { state: GameState; feedback: QuizFeedback } | null {
  if (state.activeCheckpointId) return null;

  const question = CHALLENGES.find((q) => q.id === questionId);
  if (!question) return null;

  const correct = choiceIndex === question.correctIndex;
  let next = trackMastery(state, question.courseUnit, correct);

  let bonus = 0;
  let unlockedUpgrade: UpgradeId | undefined;

  if (correct) {
    bonus = getQuizBonus(state);
    next = {
      ...next,
      money: next.money + bonus,
      totalEarned: next.totalEarned + bonus,
    };

    if (question.unlockTags?.length) {
      for (const upgrade of UPGRADES) {
        if (!upgrade.requiresUnlock || !upgrade.unlockTag) continue;
        if (next.unlockedUpgrades.includes(upgrade.id)) continue;
        if (question.unlockTags.includes(upgrade.unlockTag)) {
          next = unlockIds(next, [upgrade.id]);
          unlockedUpgrade = upgrade.id;
        }
      }
    }
  }

  next = maybeActivateCheckpoint(next);

  return {
    state: applyAchievements(next),
    feedback: {
      correct,
      explanation: question.explanation,
      correctAnswer: question.choices[question.correctIndex],
      bonus,
      unlockedUpgrade,
      courseUnit: question.courseUnit,
      hint: correct ? undefined : "Review the explanation, then try a related challenge.",
    },
  };
}

export function applyAchievements(state: GameState): GameState {
  const unlocked = new Set(state.unlockedAchievements);
  const cpuLevel = getCpuLevel(state);
  const allAdvancedUnlocked = UPGRADES.filter((u) => u.requiresUnlock).every((u) =>
    state.unlockedUpgrades.includes(u.id)
  );
  const pipeStack =
    state.unlockedUpgrades.includes("pipeline") &&
    state.unlockedUpgrades.includes("forwarding") &&
    state.unlockedUpgrades.includes("branchPrediction");

  const checks: Record<string, boolean> = {
    "first-upgrade": getCpuLevel(state) >= 1,
    "earned-1k": state.totalEarned >= 1_000,
    "earned-1m": state.totalEarned >= 1_000_000,
    "correct-10": state.correctAnswers >= 10,
    "correct-100": state.correctAnswers >= 100,
    "cpu-expert": allAdvancedUnlocked && cpuLevel >= 40,
    "flagship-2026": cpuLevel >= 80,
    "pipeline-master": pipeStack,
    "bottleneck-5": state.bottlenecksResolved >= 5 || state.completedLearningCheckpoints.length >= 5,
  };

  let changed = false;
  for (const achievement of ACHIEVEMENTS) {
    if (!unlocked.has(achievement.id) && checks[achievement.id]) {
      unlocked.add(achievement.id);
      changed = true;
    }
  }

  if (!changed) return state;
  return { ...state, unlockedAchievements: Array.from(unlocked) };
}

export function getCourseMasteryPercents(state: GameState): Record<CourseUnit, number | null> {
  const m = state.courseMastery ?? EMPTY_COURSE_MASTERY;
  const pct = (unit: CourseUnit) =>
    m[unit].attempted === 0 ? null : Math.round((m[unit].correct / m[unit].attempted) * 100);
  return {
    CPU: pct("CPU"),
    Memory: pct("Memory"),
    "Boolean Logic": pct("Boolean Logic"),
    GPU: pct("GPU"),
  };
}

export function pickRandomQuestion(state: GameState, preferUnlock = false): Challenge {
  if (preferUnlock) {
    const lockedTags = UPGRADES.filter(
      (u) => u.requiresUnlock && u.unlockTag && !state.unlockedUpgrades.includes(u.id)
    ).map((u) => u.unlockTag as string);

    const unlockQuestions = CHALLENGES.filter((q) =>
      q.unlockTags?.some((tag) => lockedTags.includes(tag))
    );

    if (unlockQuestions.length > 0) {
      return unlockQuestions[Math.floor(Math.random() * unlockQuestions.length)]!;
    }
  }

  const unanswered = CHALLENGES.filter((q) => !state.answeredQuestionIds.includes(q.id));
  const pool = unanswered.length > 0 ? unanswered : CHALLENGES;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function dismissBottleneck(state: GameState): GameState {
  // Mandatory checkpoints cannot be dismissed
  return state;
}

function migrateCompletedCheckpoints(data: Partial<GameState>): string[] {
  if (Array.isArray(data.completedLearningCheckpoints)) {
    return data.completedLearningCheckpoints.map(String);
  }

  // Legacy saves that already progressed: treat as past intro
  const levels = (data.upgradeLevels ?? {}) as Record<string, number>;
  const earned = Number(data.totalEarned) || 0;
  const unlocked = Array.isArray(data.unlockedUpgrades) ? data.unlockedUpgrades : [];
  const hasProgress =
    earned > 0 ||
    unlocked.length > 0 ||
    Object.values(levels).some((v) => Number(v) > 0);

  if (!hasProgress) return [];

  const completed: string[] = ["cpu-basics"];
  if (unlocked.includes("cache") || Number(levels.cache ?? 0) > 0) {
    completed.push("fetch-decode-execute", "memory-bottleneck");
  }
  if (unlocked.includes("buses") || Number(levels.buses ?? 0) > 0) {
    completed.push("cache-hierarchy");
  }
  if (unlocked.includes("pipeline") || Number(levels.pipeline ?? 0) > 0) {
    completed.push("boolean-alu", "pipeline");
  }
  if (unlocked.includes("forwarding") || Number(levels.forwarding ?? 0) > 0) {
    completed.push("data-hazards");
  }
  if (unlocked.includes("branchPrediction") || Number(levels.branchPrediction ?? 0) > 0) {
    completed.push("branch-prediction");
  }
  if (unlocked.includes("cores") || Number(levels.cores ?? 0) > 0) {
    completed.push("multicore");
  }
  return [...new Set(completed)];
}

export function sanitizeLoadedState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<GameState> & { upgradeLevels?: Record<string, number> };
  const base = createInitialState();
  const validIds = new Set(UPGRADES.map((u) => u.id));

  try {
    const incomingLevels = data.upgradeLevels ?? {};
    const upgradeLevels = { ...base.upgradeLevels };

    for (const [key, value] of Object.entries(incomingLevels)) {
      const mapped = (LEGACY_UPGRADE_MAP[key] ?? key) as UpgradeId;
      if (validIds.has(mapped)) {
        upgradeLevels[mapped] = Math.max(upgradeLevels[mapped] ?? 0, Number(value) || 0);
      }
    }

    const completedLearningCheckpoints = migrateCompletedCheckpoints(data);

    let unlockedUpgrades = Array.isArray(data.unlockedUpgrades)
      ? [
          ...new Set(
            (data.unlockedUpgrades as string[])
              .map((id) => (LEGACY_UPGRADE_MAP[id] ?? id) as UpgradeId)
              .filter((id) => validIds.has(id))
          ),
        ]
      : [];

    // Legacy games had free basic unlocks
    if (completedLearningCheckpoints.includes("cpu-basics")) {
      unlockedUpgrades = [...new Set([...unlockedUpgrades, ...BOOT_UNLOCKS])];
    }

    let activeCheckpointId =
      typeof data.activeCheckpointId === "string" ? data.activeCheckpointId : null;
    if (activeCheckpointId && !getCheckpoint(activeCheckpointId)) {
      activeCheckpointId = null;
    }
    // Never restore a completed checkpoint as active
    if (activeCheckpointId && completedLearningCheckpoints.includes(activeCheckpointId)) {
      activeCheckpointId = null;
    }

    let state: GameState = applyAchievements({
      money: Number(data.money) || 0,
      totalEarned: Number(data.totalEarned) || 0,
      upgradeLevels,
      unlockedUpgrades,
      questionsAnswered: Number(data.questionsAnswered) || 0,
      correctAnswers: Number(data.correctAnswers) || 0,
      answeredQuestionIds: Array.isArray(data.answeredQuestionIds)
        ? data.answeredQuestionIds.map(String)
        : [],
      unlockedAchievements: Array.isArray(data.unlockedAchievements)
        ? data.unlockedAchievements.map(String)
        : [],
      lastTick: Number(data.lastTick) || Date.now(),
      nextBottleneckAt: Number.MAX_SAFE_INTEGER,
      activeBottleneckId: null,
      bottlenecksResolved: Number(data.bottlenecksResolved) || 0,
      courseMastery: sanitizeMastery(data.courseMastery),
      completedLearningCheckpoints,
      activeCheckpointId,
      checkpointStep: Number(data.checkpointStep) || 0,
    });

    state = maybeActivateCheckpoint(state);
    return state;
  } catch {
    return null;
  }
}

function sanitizeMastery(raw: unknown): CourseMastery {
  const base = cloneMastery();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Partial<CourseMastery>;
  for (const unit of Object.keys(base) as CourseUnit[]) {
    const entry = data[unit];
    if (entry && typeof entry === "object") {
      base[unit] = {
        correct: Math.max(0, Number(entry.correct) || 0),
        attempted: Math.max(0, Number(entry.attempted) || 0),
      };
    }
  }
  return base;
}

export type { CheckpointId };
