import { ACHIEVEMENTS } from "@/data/achievements";
import { getCheckpoint, type CheckpointId } from "@/data/checkpoints";
import { STAGES, getStage, getStageByCheckpoint, type StageDef } from "@/data/stages";
import { CHALLENGES } from "@/data/questions";
import { LEARNING_CONFIG } from "@/lib/learningConfig";
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
import {
  drawRoundIds,
  getBank,
  getRoundItems,
  getRoundQuestions,
  weightOf,
} from "@/lib/rounds";
import type {
  AnswerRecord,
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

export const STORAGE_KEY = "overclocked-save-v5";
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
    upgradeLevels: { ...EMPTY_UPGRADE_LEVELS, clock: 1 },
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
    checkpointAttempt: 1,
    checkpointHintOpened: false,
    checkpointMissStreak: 0,
    bonusSuspended: false,
    checkpointScore: 0,
    pendingUnlocks: [],
    roundQuestionIds: [],
    failedQuestionIds: [],
    answerLog: [],
  };
}

export function isCpuOnline(state: GameState): boolean {
  return (
    state.unlockedUpgrades.includes("clock") ||
    state.completedLearningCheckpoints.includes("cpu-basics")
  );
}

export function isProductionStalled(state: GameState): boolean {
  // return !isCpuOnline(state) || !!state.activeCheckpointId;
  return false;
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

  next = settlePendingUnlocks(next);
  next = maybeActivateCheckpoint(next);
  return applyAchievements(next);
}

export function purchaseUpgrade(
  state: GameState,
  id: UpgradeId
): { state: GameState; delta: StatDelta } | null {

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

export function isStageComplete(state: GameState, stage: StageDef): boolean {
  return state.completedLearningCheckpoints.includes(stage.checkpointId);
}

export function getNextStage(state: GameState): StageDef | null {
  if (state.activeCheckpointId) return null;
  for (const stage of STAGES) {
    if (isStageComplete(state, stage)) continue;
    const previous = getStage(stage.id - 1);
    if (previous && !isStageComplete(state, previous)) return null;
    return stage;
  }
  return null;
}

export type StageStatus = "done" | "pending" | "available" | "locked";

export function getStageStatus(state: GameState, stage: StageDef): StageStatus {
  if (isStageComplete(state, stage)) return "done";
  if (state.pendingUnlocks.includes(stage.checkpointId)) return "pending";
  const previous = getStage(stage.id - 1);
  if (previous && !isStageComplete(state, previous)) return "locked";
  return "available";
}

export function startStage(state: GameState, stageId: number): GameState {
  const stage = getStage(stageId);
  if (!stage) return state;
  if (state.activeCheckpointId) return state;
  if (isStageComplete(state, stage)) return state;
  const previous = getStage(stage.id - 1);
  if (previous && !isStageComplete(state, previous)) return state;
  // Round already passed, just waiting for enough CP
  if (state.pendingUnlocks.includes(stage.checkpointId)) return state;
  const bank = getBank(stage.checkpointId);
  return {
    ...state,
    activeCheckpointId: stage.checkpointId,
    checkpointStep: 0,
    checkpointAttempt: 1,
    checkpointHintOpened: false,
    checkpointScore: 0,
    roundQuestionIds: bank ? drawRoundIds(bank, state.failedQuestionIds) : [],
  };
}

export function startBootSequence(state: GameState): GameState {
  return startStage(state, 1);
}

/** A passed round waiting for CP unlocks as soon as the player can afford it */
export function settlePendingUnlocks(state: GameState): GameState {
  if (state.activeCheckpointId) return state;
  for (const stage of STAGES) {
    if (!state.pendingUnlocks.includes(stage.checkpointId)) continue;
    if (state.money < stage.price) return state;
    const cp = getCheckpoint(stage.checkpointId);
    if (!cp) return state;
    return finishCheckpoint(state, cp, state).state;
  }
  return state;
}

export function maybeActivateCheckpoint(state: GameState): GameState {
  return state;
}

function stageClearBonus(checkpointId: string): number {
  const stage = getStageByCheckpoint(checkpointId);
  if (!stage) return 40;
  return Math.max(40, Math.floor(stage.price * 0.3) || 40);
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

const MAX_ANSWER_LOG = 500;

/**
 * Called exactly once per question or matching set, when it is settled
 * (answered correctly on any attempt, or wrong on the last attempt).
 * Updates the course mastery counters and appends one record to the answer log.
 */
function recordSettled(
  state: GameState,
  unit: CourseUnit,
  record: AnswerRecord
): GameState {
  const solved = record.attemptCorrect !== null;
  const withMastery = trackMastery(state, unit, solved);
  return {
    ...withMastery,
    answerLog: [...withMastery.answerLog, record].slice(-MAX_ANSWER_LOG),
  };
}

/** Accuracy numbers for the stage summary (design doc 6.3). Display only. */
export function getLearningStats(state: GameState) {
  const log = state.answerLog;
  const total = log.length;
  const firstTry = log.filter((r) => r.attemptCorrect === 1).length;
  const solved = log.filter((r) => r.attemptCorrect !== null).length;

  const byConcept = new Map<string, { total: number; firstTry: number }>();
  for (const r of log) {
    for (const concept of r.concepts) {
      const entry = byConcept.get(concept) ?? { total: 0, firstTry: 0 };
      entry.total += 1;
      if (r.attemptCorrect === 1) entry.firstTry += 1;
      byConcept.set(concept, entry);
    }
  }
  const weakest = [...byConcept.entries()]
    .map(([concept, e]) => ({ concept, total: e.total, firstTryRate: e.firstTry / e.total }))
    .sort((a, b) => a.firstTryRate - b.firstTryRate || b.total - a.total)
    .slice(0, 3);

  return {
    total,
    /** Share of questions answered right on the first attempt (the better measure of understanding) */
    firstTryRate: total > 0 ? firstTry / total : null,
    /** Share of questions finally answered right (retries can inflate this) */
    finalRate: total > 0 ? solved / total : null,
    weakest,
  };
}

export const PASS_RATIO = LEARNING_CONFIG.passLine;

/** Credit per question: 1 on the first attempt, 0.75 on the second, 0.5 if the hint was opened */
function attemptCredit(attempt: number, hintUsed: boolean): number {
  const { first, second, withHint } = LEARNING_CONFIG.credit;
  if (attempt <= 1) return first;
  return hintUsed ? withHint : second;
}

type LearningCp = NonNullable<ReturnType<typeof getCheckpoint>>;

function endRound(
  next: GameState,
  cp: LearningCp,
  beforeState: GameState,
): {
  state: GameState;
  resolve?: CheckpointResolveResult;
  bonus: number;
  passed: boolean;
  percent: number;
  pending: boolean;
} {
  const percent = next.checkpointScore;
  const reset = {
    activeCheckpointId: null,
    checkpointStep: 0,
    checkpointAttempt: 1,
    checkpointHintOpened: false,
    checkpointScore: 0,
    roundQuestionIds: [] as string[],
  };

  // Failed round: nothing is paid, nothing unlocks
  if (percent + 1e-9 < PASS_RATIO) {
    return { state: { ...next, ...reset }, bonus: 0, passed: false, percent, pending: false };
  }

  const price = getStageByCheckpoint(cp.id)?.price ?? 0;

  // Passed, but not enough CP: remember the pass, unlock later
  if (next.money < price) {
    return {
      state: {
        ...next,
        ...reset,
        pendingUnlocks: [...new Set([...next.pendingUnlocks, cp.id])],
      },
      bonus: 0,
      passed: true,
      percent,
      pending: true,
    };
  }

  // Passed and affordable: pay, unlock, reward
  const done = finishCheckpoint(next, cp, beforeState);
  return { ...done, passed: true, percent, pending: false };
}

/** The player opens the hint. Only possible from the second attempt on. */
export function openHint(state: GameState): GameState {
  if (!state.activeCheckpointId) return state;
  if (state.checkpointAttempt < 2 || state.checkpointHintOpened) return state;
  return { ...state, checkpointHintOpened: true };
}

export function answerCheckpointStep(
  state: GameState,
  choiceIndex: number,
): {
  state: GameState;
  feedback: QuizFeedback;
} | null {
  const cp = getCheckpoint(state.activeCheckpointId);
  if (!cp) return null;
  const attempt = state.checkpointAttempt;
  const hintUsed = state.checkpointHintOpened;
  const roundQs = getRoundQuestions(state);
  const step = state.checkpointStep;
  const question = roundQs[step];
  if (!question) return null;

  const correct = choiceIndex === question.correctIndex;
  let next: GameState = state;

  // Wrong on the first attempt: let the player retry (attempt 2 is saved)
  if (!correct && attempt < LEARNING_CONFIG.maxAttempts) {
    return {
      state: applyAchievements({ ...next, checkpointAttempt: attempt + 1 }),
      feedback: {
        correct: false,
        explanation: "",
        correctAnswer: "",
        bonus: 0,
        courseUnit: cp.courseUnit,
        hint: question.hint,
        hint2: undefined,
        attempt,
        revealed: false,
      },
    };
  }

  // The question is settled: correct (any attempt) or wrong on attempt 2
  const credit = correct ? attemptCredit(attempt, hintUsed) : 0;
  next = recordSettled(next, cp.courseUnit, {
    id: question.id,
    concepts: [question.concept],
    attemptCorrect: correct ? (attempt <= 1 ? 1 : 2) : null,
    hintUsed,
  });
  if (correct) {
    next = {
      ...next,
      checkpointScore: next.checkpointScore + credit * weightOf(getRoundItems(state), step),
    };
    if (question.unlockUpgrade) {
      next = unlockIds(next, [question.unlockUpgrade]);
      if ((next.upgradeLevels[question.unlockUpgrade] ?? 0) === 0) {
        next = bumpLevel(next, question.unlockUpgrade, 1);
      }
    }
  }
  next = {
    ...next,
    checkpointMissStreak: 0,
    bonusSuspended: false,
    checkpointAttempt: 1,
    checkpointHintOpened: false,
  };

  // Remember questions that were failed on both attempts (bank stages only)
  if (!correct && getBank(cp.id)) {
    next = {
      ...next,
      failedQuestionIds: [...new Set([...next.failedQuestionIds, question.id])],
    };
  }

  const baseFeedback = {
    correct,
    explanation: question.explanation,
    correctAnswer: question.choices[question.correctIndex],
    courseUnit: cp.courseUnit,
    credit,
    ...(correct
      ? { unlockedUpgrade: question.unlockUpgrade }
      : { attempt, revealed: true }),
  };

  // The saved step moves on right away (so a refresh can never re-answer this question),
  // but the round only ends when the player clicks the button after the last question.
  return {
    state: applyAchievements({ ...next, checkpointStep: step + 1 }),
    feedback: { ...baseFeedback, bonus: 0 },
  };
}

/**
 * Checks a matching set. answer[i] is the right-hand card the player linked to left item i.
 * Cards 0 to 3 are the four correct descriptions, card 4 is the distractor,
 * so the correct link for left item i is the card with the same number i.
 */
export function answerMatchingStep(
  state: GameState,
  answer: number[],
): { state: GameState; feedback: QuizFeedback } | null {
  const cp = getCheckpoint(state.activeCheckpointId);
  if (!cp) return null;
  const attempt = state.checkpointAttempt;
  const hintUsed = state.checkpointHintOpened;
  const items = getRoundItems(state);
  const step = state.checkpointStep;
  const item = items[step];
  if (!item || item.kind !== "match") return null;

  const matchResult = item.pairs.map((_, i) => answer[i] === i);
  const allCorrect = matchResult.every(Boolean);
  let next: GameState = state;

  // Not all pairs right on the first check: the player gets a second attempt
  if (!allCorrect && attempt < LEARNING_CONFIG.maxAttempts) {
    return {
      state: applyAchievements({ ...next, checkpointAttempt: attempt + 1 }),
      feedback: {
        correct: false,
        explanation: "",
        correctAnswer: "",
        bonus: 0,
        courseUnit: cp.courseUnit,
        hint: item.hint,
        attempt,
        revealed: false,
        matchResult,
      },
    };
  }

  // The set is settled: all pairs right (any attempt), or not all right on attempt 2
  const credit = allCorrect ? attemptCredit(attempt, hintUsed) : 0;
  next = recordSettled(next, cp.courseUnit, {
    id: item.id,
    concepts: item.concepts,
    attemptCorrect: allCorrect ? (attempt <= 1 ? 1 : 2) : null,
    hintUsed,
  });
  next = {
    ...next,
    checkpointScore: next.checkpointScore + credit * weightOf(items, step),
    checkpointMissStreak: 0,
    bonusSuspended: false,
    checkpointAttempt: 1,
    checkpointHintOpened: false,
    failedQuestionIds: allCorrect
      ? next.failedQuestionIds
      : [...new Set([...next.failedQuestionIds, item.id])],
  };

  return {
    state: applyAchievements({ ...next, checkpointStep: step + 1 }),
    feedback: {
      correct: allCorrect,
      explanation: "",
      correctAnswer: "",
      bonus: 0,
      courseUnit: cp.courseUnit,
      credit,
      matchResult,
      ...(allCorrect ? {} : { attempt, revealed: true }),
    },
  };
}

/**
 * Ends the round once every question is settled (saved step is past the last question).
 * Returns null while the round is still in progress.
 */
export function finishRound(state: GameState): {
  state: GameState;
  resolve?: CheckpointResolveResult;
  bonus: number;
  passed: boolean;
  percent: number;
  pending: boolean;
} | null {
  const cp = getCheckpoint(state.activeCheckpointId);
  if (!cp) return null;
  const items = getRoundItems(state);
  if (items.length === 0 || state.checkpointStep < items.length) return null;
  const end = endRound(state, cp, state);
  return { ...end, state: applyAchievements(end.state) };
}

function finishCheckpoint(
  next: GameState,
  cp: NonNullable<ReturnType<typeof getCheckpoint>>,
  beforeState: GameState
): { state: GameState; resolve: CheckpointResolveResult; bonus: number } {
  const beforeRate = isCpuOnline(beforeState)
    ? BASE_COMPUTE + computeCpuPerformance(beforeState.upgradeLevels).computePerSecond
    : 0;
  const beforePerf = computeCpuPerformance(beforeState.upgradeLevels);

  next = unlockIds(next, cp.unlockUpgrades);
  for (const id of cp.unlockUpgrades) {
    if ((next.upgradeLevels[id] ?? 0) === 0) {
      next = bumpLevel(next, id, 1);
    }
  }

  if (cp.id === "cpu-basics") {
    next = unlockIds(next, BOOT_UNLOCKS);
    for (const id of BOOT_UNLOCKS) {
      if ((next.upgradeLevels[id] ?? 0) < 1) next = bumpLevel(next, id, 1);
    }
  }
  const price = getStageByCheckpoint(cp.id)?.price ?? 0;
  const bank = getBank(cp.id);
  const bonus = stageClearBonus(cp.id);
  const completed = [...new Set([...next.completedLearningCheckpoints, cp.id])];

  next = {
    ...next,
    money: next.money - price + bonus,
    totalEarned: next.totalEarned + bonus,
    completedLearningCheckpoints: completed,
    pendingUnlocks: next.pendingUnlocks.filter((id) => id !== cp.id),
    activeCheckpointId: null,
    checkpointStep: 0,
    checkpointAttempt: 1,
    checkpointHintOpened: false,
    checkpointScore: 0,
    roundQuestionIds: [],
    failedQuestionIds: bank
      ? next.failedQuestionIds.filter(
        (id) => !bank.mc.some((q) => q.id === id) && !bank.matching.some((m) => m.id === id)
      )
      : next.failedQuestionIds,
    bottlenecksResolved: next.bottlenecksResolved + 1,
  };

  const afterPerf = computeCpuPerformance(next.upgradeLevels);
  const afterRate = BASE_COMPUTE + afterPerf.computePerSecond;
  const resolve = buildResolve(
    cp.id,
    cp.title,
    beforeRate,
    afterRate,
    beforePerf,
    afterPerf,
    cp.relevantStat
  );

  return { state: maybeActivateCheckpoint(next), resolve, bonus };
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
      checkpointAttempt: Number(data.checkpointAttempt) === 2 ? 2 : 1,
      checkpointHintOpened: Boolean(data.checkpointHintOpened),
      checkpointMissStreak: Number(data.checkpointMissStreak) || 0,
      bonusSuspended: Boolean(data.bonusSuspended),
      checkpointScore: Number(data.checkpointScore) || 0,
      pendingUnlocks: Array.isArray(data.pendingUnlocks)
        ? data.pendingUnlocks.map(String)
        : [],
      roundQuestionIds: Array.isArray(data.roundQuestionIds)
        ? data.roundQuestionIds.map(String)
        : [],
      failedQuestionIds: Array.isArray(data.failedQuestionIds)
        ? data.failedQuestionIds.map(String)
        : [],
      answerLog: sanitizeAnswerLog(data.answerLog),
    });

    state = maybeActivateCheckpoint(state);
    return state;
  } catch {
    return null;
  }
}

function sanitizeAnswerLog(raw: unknown): AnswerRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .flatMap((entry): AnswerRecord[] => {
      if (!entry || typeof entry !== "object") return [];
      const e = entry as Partial<AnswerRecord>;
      if (typeof e.id !== "string" || !Array.isArray(e.concepts)) return [];
      const attemptCorrect = e.attemptCorrect === 1 || e.attemptCorrect === 2 ? e.attemptCorrect : null;
      return [
        {
          id: e.id,
          concepts: e.concepts.map(String),
          attemptCorrect,
          hintUsed: Boolean(e.hintUsed),
        },
      ];
    })
    .slice(-MAX_ANSWER_LOG);
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