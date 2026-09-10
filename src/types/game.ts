export type UpgradeId =
  | "controlUnit"
  | "alu"
  | "registers"
  | "cache"
  | "clock"
  | "buses"
  | "cores"
  | "isa"
  | "generation"
  | "overclocking"
  | "socket"
  | "cooling";

export type QuestionTopic =
  | "cpu"
  | "cu"
  | "alu"
  | "registers"
  | "cache"
  | "clock"
  | "buses"
  | "isa"
  | "generation"
  | "overclocking"
  | "socket"
  | "cooling"
  | "os"
  | "networking"
  | "cybersecurity"
  | "programming"
  | "data-structures"
  | "cloud"
  | "data-science";

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  shortName: string;
  description: string;
  category: string;
  baseCost: number;
  costMultiplier: number;
  incomePerLevel: number;
  requiresUnlock: boolean;
  unlockTag?: string;
  unlockHint: string;
  formatSpec: (level: number) => string;
}

export interface Question {
  id: string;
  topic: QuestionTopic;
  question: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  unlockTags?: string[];
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
}

export interface GameState {
  money: number;
  totalEarned: number;
  upgradeLevels: Record<UpgradeId, number>;
  unlockedUpgrades: UpgradeId[];
  questionsAnswered: number;
  correctAnswers: number;
  answeredQuestionIds: string[];
  unlockedAchievements: string[];
  lastTick: number;
}

export interface QuizFeedback {
  correct: boolean;
  explanation: string;
  correctAnswer: string;
  bonus: number;
  unlockedUpgrade?: UpgradeId;
}

export type ThemeMode = "light" | "dark";

export interface CpuEra {
  id: string;
  name: string;
  year: string;
  summary: string;
  minLevel: number;
}
