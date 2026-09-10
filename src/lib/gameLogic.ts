import { ACHIEVEMENTS } from "@/data/achievements";
import { QUESTIONS } from "@/data/questions";
import {
  BASE_INCOME,
  EMPTY_UPGRADE_LEVELS,
  STARTING_UNLOCKS,
  UPGRADE_MAP,
  UPGRADES,
  getUpgradeCost,
} from "@/data/upgrades";
import type {
  GameState,
  QuizFeedback,
  UpgradeId,
} from "@/types/game";

export const STORAGE_KEY = "overclocked-save-v2";
export const LEGACY_STORAGE_KEY = "overclocked-save-v1";
export const LEGACY_STORAGE_KEY_OLD = "cpu-tycoon-save-v1";

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
  };
}

export function getIncomePerSecond(state: GameState): number {
  let income = BASE_INCOME;
  for (const upgrade of UPGRADES) {
    const level = state.upgradeLevels[upgrade.id] ?? 0;
    income += level * upgrade.incomePerLevel;
  }
  return income;
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

  // Cap offline/catch-up to 8 hours so refreshes feel fair but not broken
  const cappedMs = Math.min(elapsedMs, 8 * 60 * 60 * 1000);
  const seconds = cappedMs / 1000;
  const earned = getIncomePerSecond(state) * seconds;

  if (earned <= 0) {
    return { ...state, lastTick: now };
  }

  const next: GameState = {
    ...state,
    money: state.money + earned,
    totalEarned: state.totalEarned + earned,
    lastTick: now,
  };

  return applyAchievements(next);
}

export function purchaseUpgrade(state: GameState, id: UpgradeId): GameState | null {
  const def = UPGRADE_MAP[id];
  if (!def) return null;
  if (!isUpgradeUnlocked(state, id)) return null;

  const level = state.upgradeLevels[id] ?? 0;
  const cost = getUpgradeCost(def, level);
  if (state.money < cost) return null;

  const next: GameState = {
    ...state,
    money: state.money - cost,
    upgradeLevels: {
      ...state.upgradeLevels,
      [id]: level + 1,
    },
  };

  return applyAchievements(next);
}

export function getQuizBonus(state: GameState): number {
  const income = getIncomePerSecond(state);
  return Math.max(25, Math.floor(income * 20 + 50));
}

function unlockUpgradesFromTags(state: GameState, tags: string[] | undefined): {
  state: GameState;
  unlockedUpgrade?: UpgradeId;
} {
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
  const question = QUESTIONS.find((q) => q.id === questionId);
  if (!question) return null;

  const correct = choiceIndex === question.correctIndex;
  let next: GameState = {
    ...state,
    questionsAnswered: state.questionsAnswered + 1,
    correctAnswers: state.correctAnswers + (correct ? 1 : 0),
    answeredQuestionIds: state.answeredQuestionIds.includes(questionId)
      ? state.answeredQuestionIds
      : [...state.answeredQuestionIds, questionId],
  };

  let bonus = 0;
  let unlockedUpgrade: UpgradeId | undefined;

  if (correct) {
    bonus = getQuizBonus(state);
    next = {
      ...next,
      money: next.money + bonus,
      totalEarned: next.totalEarned + bonus,
    };

    const unlockResult = unlockUpgradesFromTags(next, question.unlockTags);
    next = unlockResult.state;
    unlockedUpgrade = unlockResult.unlockedUpgrade;
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
    },
  };
}

export function applyAchievements(state: GameState): GameState {
  const unlocked = new Set(state.unlockedAchievements);
  const cpuLevel = getCpuLevel(state);
  const allAdvancedUnlocked = UPGRADES.filter((u) => u.requiresUnlock).every((u) =>
    state.unlockedUpgrades.includes(u.id)
  );

  const checks: Record<string, boolean> = {
    "first-upgrade": getCpuLevel(state) >= 1,
    "earned-1k": state.totalEarned >= 1_000,
    "earned-1m": state.totalEarned >= 1_000_000,
    "correct-10": state.correctAnswers >= 10,
    "correct-100": state.correctAnswers >= 100,
    "cpu-expert": allAdvancedUnlocked && cpuLevel >= 40,
    "flagship-2026": cpuLevel >= 80,
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

export function pickRandomQuestion(
  state: GameState,
  preferUnlock = false
): (typeof QUESTIONS)[number] {
  if (preferUnlock) {
    const lockedTags = UPGRADES.filter(
      (u) => u.requiresUnlock && u.unlockTag && !state.unlockedUpgrades.includes(u.id)
    ).map((u) => u.unlockTag as string);

    const unlockQuestions = QUESTIONS.filter((q) =>
      q.unlockTags?.some((tag) => lockedTags.includes(tag))
    );

    if (unlockQuestions.length > 0) {
      return unlockQuestions[Math.floor(Math.random() * unlockQuestions.length)];
    }
  }

  // Prefer unanswered, then any
  const unanswered = QUESTIONS.filter((q) => !state.answeredQuestionIds.includes(q.id));
  const pool = unanswered.length > 0 ? unanswered : QUESTIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function sanitizeLoadedState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<GameState>;
  const base = createInitialState();
  const validIds = new Set(UPGRADES.map((u) => u.id));

  try {
    const incomingLevels = data.upgradeLevels ?? {};
    const upgradeLevels = { ...base.upgradeLevels };
    for (const [key, value] of Object.entries(incomingLevels)) {
      if (validIds.has(key as UpgradeId)) {
        upgradeLevels[key as UpgradeId] = Number(value) || 0;
      }
    }

    const unlockedUpgrades = Array.isArray(data.unlockedUpgrades)
      ? [
          ...new Set([
            ...STARTING_UNLOCKS,
            ...(data.unlockedUpgrades as string[]).filter((id): id is UpgradeId =>
              validIds.has(id as UpgradeId)
            ),
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
    });
  } catch {
    return null;
  }
}
