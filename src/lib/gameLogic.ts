import { ACHIEVEMENTS } from "@/data/achievements";
import { CHALLENGES } from "@/data/questions";
import {
  BASE_COMPUTE,
  EMPTY_UPGRADE_LEVELS,
  LEGACY_UPGRADE_MAP,
  STARTING_UNLOCKS,
  UPGRADE_MAP,
  UPGRADES,
  getUpgradeCost,
} from "@/data/upgrades";
import {
  computeCpuPerformance,
  getCpuPerformance,
  levelsWithUpgrade,
} from "@/lib/cpuStats";
import type {
  BottleneckType,
  Challenge,
  CourseMastery,
  CourseUnit,
  GameState,
  QuizFeedback,
  StatDelta,
  UpgradeId,
} from "@/types/game";
import { EMPTY_COURSE_MASTERY } from "@/types/game";

export const STORAGE_KEY = "overclocked-save-v3";
export const LEGACY_STORAGE_KEY = "overclocked-save-v2";
export const LEGACY_STORAGE_KEY_OLD = "overclocked-save-v1";
export const LEGACY_STORAGE_KEY_ANCIENT = "cpu-tycoon-save-v1";

const BOTTLENECK_MIN_MS = 45_000;
const BOTTLENECK_MAX_MS = 90_000;

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
    nextBottleneckAt: now + BOTTLENECK_MIN_MS,
    activeBottleneckId: null,
    bottlenecksResolved: 0,
    courseMastery: cloneMastery(),
  };
}

/** Idle compute generation derived from educational CPU performance model */
export function getIncomePerSecond(state: GameState): number {
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

  const cappedMs = Math.min(elapsedMs, 8 * 60 * 60 * 1000);
  const seconds = cappedMs / 1000;
  const earned = getIncomePerSecond(state) * seconds;

  let next: GameState = {
    ...state,
    lastTick: now,
  };

  if (earned > 0) {
    next = {
      ...next,
      money: next.money + earned,
      totalEarned: next.totalEarned + earned,
    };
  }

  // Schedule bottleneck if due and none active
  if (!next.activeBottleneckId && now >= next.nextBottleneckAt) {
    const challenge = pickBottleneckChallenge(next);
    if (challenge) {
      next = { ...next, activeBottleneckId: challenge.id };
    } else {
      next = { ...next, nextBottleneckAt: now + randomBottleneckDelay() };
    }
  }

  return applyAchievements(next);
}

export function purchaseUpgrade(
  state: GameState,
  id: UpgradeId
): { state: GameState; delta: StatDelta } | null {
  const def = UPGRADE_MAP[id];
  if (!def) return null;
  if (!isUpgradeUnlocked(state, id)) return null;

  const level = state.upgradeLevels[id] ?? 0;
  const cost = getUpgradeCost(def, level);
  if (state.money < cost) return null;

  const before = computeCpuPerformance(state.upgradeLevels);
  const afterLevels = levelsWithUpgrade(state.upgradeLevels, id, 1);
  const after = computeCpuPerformance(afterLevels);

  const next: GameState = {
    ...state,
    money: state.money - cost,
    upgradeLevels: afterLevels,
  };

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
  const income = getIncomePerSecond(state);
  return Math.max(25, Math.floor(income * 20 + 50));
}

function unlockUpgradesFromTags(
  state: GameState,
  tags: string[] | undefined
): { state: GameState; unlockedUpgrade?: UpgradeId } {
  if (!tags?.length) return { state };

  let unlockedUpgrade: UpgradeId | undefined;
  const unlocked = [...state.unlockedUpgrades];

  for (const upgrade of UPGRADES) {
    if (!upgrade.requiresUnlock || !upgrade.unlockTag) continue;
    if (unlocked.includes(upgrade.id)) continue;
    if (tags.includes(upgrade.unlockTag)) {
      unlocked.push(upgrade.id);
      unlockedUpgrade = upgrade.id;
    }
  }

  if (!unlockedUpgrade) return { state };

  return {
    state: { ...state, unlockedUpgrades: unlocked },
    unlockedUpgrade,
  };
}

export function answerQuestion(
  state: GameState,
  questionId: string,
  choiceIndex: number
): { state: GameState; feedback: QuizFeedback } | null {
  const question = CHALLENGES.find((q) => q.id === questionId);
  if (!question) return null;

  const correct = choiceIndex === question.correctIndex;
  const wasBottleneck = state.activeBottleneckId === questionId;

  const mastery = cloneMastery(state.courseMastery ?? EMPTY_COURSE_MASTERY);
  const unit = question.courseUnit;
  mastery[unit] = {
    attempted: mastery[unit].attempted + 1,
    correct: mastery[unit].correct + (correct ? 1 : 0),
  };

  let next: GameState = {
    ...state,
    questionsAnswered: state.questionsAnswered + 1,
    correctAnswers: state.correctAnswers + (correct ? 1 : 0),
    answeredQuestionIds: state.answeredQuestionIds.includes(questionId)
      ? state.answeredQuestionIds
      : [...state.answeredQuestionIds, questionId],
    courseMastery: mastery,
  };

  let bonus = 0;
  let unlockedUpgrade: UpgradeId | undefined;

  if (correct) {
    bonus = getQuizBonus(state) * (wasBottleneck ? 1.5 : 1);
    bonus = Math.floor(bonus);
    next = {
      ...next,
      money: next.money + bonus,
      totalEarned: next.totalEarned + bonus,
    };

    const unlockResult = unlockUpgradesFromTags(next, question.unlockTags);
    next = unlockResult.state;
    unlockedUpgrade = unlockResult.unlockedUpgrade;

    if (wasBottleneck) {
      next = {
        ...next,
        activeBottleneckId: null,
        bottlenecksResolved: next.bottlenecksResolved + 1,
        nextBottleneckAt: Date.now() + randomBottleneckDelay(),
      };
    }
  }

  next = applyAchievements(next);

  return {
    state: next,
    feedback: {
      correct,
      explanation: question.explanation,
      correctAnswer: question.choices[question.correctIndex],
      bonus,
      unlockedUpgrade,
      wasBottleneck,
      courseUnit: unit,
    },
  };
}

export function dismissBottleneck(state: GameState): GameState {
  if (!state.activeBottleneckId) return state;
  return {
    ...state,
    activeBottleneckId: null,
    nextBottleneckAt: Date.now() + randomBottleneckDelay(),
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
    "bottleneck-5": state.bottlenecksResolved >= 5,
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

function randomBottleneckDelay(): number {
  return (
    BOTTLENECK_MIN_MS +
    Math.floor(Math.random() * (BOTTLENECK_MAX_MS - BOTTLENECK_MIN_MS))
  );
}

function preferredBottleneckType(state: GameState): BottleneckType {
  const levels = state.upgradeLevels;
  const unlocked = new Set(state.unlockedUpgrades);
  const mastery = state.courseMastery ?? EMPTY_COURSE_MASTERY;

  if (!unlocked.has("cache") || (levels.cache ?? 0) < 2) return "memory-latency";
  if (!unlocked.has("pipeline")) return "low-throughput";
  if (unlocked.has("pipeline") && !unlocked.has("forwarding")) return "data-hazard";
  if (unlocked.has("pipeline") && !unlocked.has("branchPrediction")) return "branch-flush";
  if (!unlocked.has("cores")) return "parallel-workload";

  // Sprinkle logic / GPU challenges once core CPU path is open
  const logicRate =
    mastery["Boolean Logic"].attempted === 0
      ? 0
      : mastery["Boolean Logic"].correct / mastery["Boolean Logic"].attempted;
  const gpuRate =
    mastery.GPU.attempted === 0 ? 0 : mastery.GPU.correct / mastery.GPU.attempted;

  if (mastery["Boolean Logic"].attempted < 3 || logicRate < 0.6) return "logic-circuit";
  if (getCpuLevel(state) >= 25 && (mastery.GPU.attempted < 2 || gpuRate < 0.6)) {
    return "gpu-workload";
  }

  const perf = getCpuPerformance(state);
  if (perf.cacheHitRate < 0.55) return "memory-latency";
  if (perf.cpi > 2.2) return "data-hazard";
  if (perf.branchAccuracy < 0.75) return "branch-flush";
  if (perf.coreCount < 4) return "parallel-workload";
  return "low-throughput";
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

export function pickBottleneckChallenge(state: GameState): Challenge | null {
  const type = preferredBottleneckType(state);
  const lockedTags = UPGRADES.filter(
    (u) => u.requiresUnlock && u.unlockTag && !state.unlockedUpgrades.includes(u.id)
  ).map((u) => u.unlockTag as string);

  const typed = CHALLENGES.filter((c) => c.bottleneckType === type);
  const unlockHelpful = typed.filter((c) =>
    c.unlockTags?.some((tag) => lockedTags.includes(tag))
  );
  const pool = unlockHelpful.length > 0 ? unlockHelpful : typed.length > 0 ? typed : CHALLENGES;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function pickRandomQuestion(state: GameState, preferUnlock = false): Challenge {
  if (state.activeBottleneckId) {
    const active = CHALLENGES.find((c) => c.id === state.activeBottleneckId);
    if (active) return active;
  }

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

    const unlockedUpgrades = Array.isArray(data.unlockedUpgrades)
      ? [
          ...new Set([
            ...STARTING_UNLOCKS,
            ...(data.unlockedUpgrades as string[])
              .map((id) => (LEGACY_UPGRADE_MAP[id] ?? id) as UpgradeId)
              .filter((id) => validIds.has(id)),
          ]),
        ]
      : base.unlockedUpgrades;

    return applyAchievements({
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
      nextBottleneckAt: Number(data.nextBottleneckAt) || Date.now() + BOTTLENECK_MIN_MS,
      activeBottleneckId:
        typeof data.activeBottleneckId === "string" ? data.activeBottleneckId : null,
      bottlenecksResolved: Number(data.bottlenecksResolved) || 0,
      courseMastery: sanitizeMastery(data.courseMastery),
    });
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
