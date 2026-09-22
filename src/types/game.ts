export type UpgradeId =
  | "controlUnit"
  | "alu"
  | "registers"
  | "cache"
  | "clock"
  | "buses"
  | "cores"
  | "pipeline"
  | "forwarding"
  | "branchPrediction"
  | "overclocking"
  | "cooling";

/** CSC 3501 lecture-family labels shown on challenges */
export type CourseUnit = "CPU" | "Memory" | "Boolean Logic" | "GPU";

export type ChallengeTopic =
  | "clock"
  | "alu"
  | "registers"
  | "cache"
  | "buses"
  | "pipeline"
  | "cpi"
  | "hazards"
  | "forwarding"
  | "branch"
  | "multicore"
  | "memory"
  | "cpu-basics"
  | "von-neumann"
  | "harvard"
  | "isa"
  | "fetch-decode-execute"
  | "boolean"
  | "adder"
  | "gpu"
  | "storage";

export type BottleneckType =
  | "memory-latency"
  | "data-hazard"
  | "branch-flush"
  | "low-throughput"
  | "parallel-workload"
  | "logic-circuit"
  | "gpu-workload";

export type ArchitectureStage =
  | "basic"
  | "memory"
  | "pipeline"
  | "hazards"
  | "branch"
  | "multicore";

export type AffectedStat =
  | "clockSpeed"
  | "cpi"
  | "cacheHitRate"
  | "pipelineEfficiency"
  | "branchAccuracy"
  | "coreCount"
  | "ips";

/** Basic CPU cycle stages (course-facing) */
export type CycleStage = "fetch" | "decode" | "execute";

/** Memory-hierarchy highlight targets */
export type MemoryLevel =
  | "registers"
  | "l1"
  | "l2"
  | "l3"
  | "ram"
  | "storage";

/**
 * Difficulty tiers:
 * 1 Recognition · 2 Understanding · 3 Application · 4 Architecture reasoning
 */
export type ChallengeDifficulty = 1 | 2 | 3 | 4;

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  shortName: string;
  description: string;
  category: string;
  stage: ArchitectureStage;
  baseCost: number;
  costMultiplier: number;
  incomePerLevel: number;
  requiresUnlock: boolean;
  unlockTag?: string;
  unlockHint: string;
  educationalNote: string;
  formatSpec: (level: number) => string;
}

export interface Challenge {
  id: string;
  topic: ChallengeTopic;
  courseUnit: CourseUnit;
  scenario: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  unlockTags?: string[];
  affectedStat?: AffectedStat;
  difficulty: ChallengeDifficulty;
  bottleneckType?: BottleneckType;
  /** Highlight Fetch / Decode / Execute on the cycle visual */
  highlightCycle?: CycleStage;
  /** Highlight a level on the memory-hierarchy visual */
  highlightMemory?: MemoryLevel;
}

/** @deprecated Prefer Challenge */
export type Question = Challenge;
export type QuestionTopic = ChallengeTopic;

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
}

export interface CpuPerformance {
  clockHz: number;
  clockLabel: string;
  cpi: number;
  cacheHitRate: number;
  pipelineEfficiency: number;
  branchAccuracy: number;
  coreCount: number;
  ips: number;
  computePerSecond: number;
}

export interface StatDelta {
  before: CpuPerformance;
  after: CpuPerformance;
  explanation: string;
}

export type CourseMastery = Record<
  CourseUnit,
  { correct: number; attempted: number }
>;

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
  /** Legacy field — timer bottlenecks removed */
  nextBottleneckAt: number;
  /** Legacy field — prefer activeCheckpointId */
  activeBottleneckId: string | null;
  bottlenecksResolved: number;
  courseMastery: CourseMastery;
  completedLearningCheckpoints: string[];
  activeCheckpointId: string | null;
  checkpointStep: number;
}

export interface CheckpointResolveResult {
  title: string;
  body: string;
  beforeRate: number;
  afterRate: number;
  relevantLabel?: string;
  relevantBefore?: string;
  relevantAfter?: string;
}

export interface QuizFeedback {
  correct: boolean;
  explanation: string;
  correctAnswer: string;
  bonus: number;
  unlockedUpgrade?: UpgradeId;
  wasBottleneck?: boolean;
  courseUnit?: CourseUnit;
  hint?: string;
}

export type ThemeMode = "light" | "dark";

export interface CpuEra {
  id: string;
  name: string;
  year: string;
  summary: string;
  minLevel: number;
  architectureFocus: string;
}

export const EMPTY_COURSE_MASTERY: CourseMastery = {
  CPU: { correct: 0, attempted: 0 },
  Memory: { correct: 0, attempted: 0 },
  "Boolean Logic": { correct: 0, attempted: 0 },
  GPU: { correct: 0, attempted: 0 },
};

export const COURSE_UNITS: CourseUnit[] = [
  "CPU",
  "Memory",
  "Boolean Logic",
  "GPU",
];

export const DIFFICULTY_LABELS: Record<ChallengeDifficulty, string> = {
  1: "Recognition",
  2: "Understanding",
  3: "Application",
  4: "Architecture Reasoning",
};
