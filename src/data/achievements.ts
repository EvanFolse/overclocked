import type { AchievementDefinition } from "@/types/game";

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first-upgrade",
    name: "First Upgrade",
    description: "Purchase your first CPU component upgrade.",
  },
  {
    id: "earned-1k",
    name: "$1,000 Earned",
    description: "Accumulate $1,000 in total earnings.",
  },
  {
    id: "earned-1m",
    name: "$1M Earned",
    description: "Accumulate $1,000,000 in total earnings.",
  },
  {
    id: "correct-10",
    name: "10 Correct Answers",
    description: "Answer 10 quiz questions correctly.",
  },
  {
    id: "correct-100",
    name: "100 Correct Answers",
    description: "Answer 100 quiz questions correctly.",
  },
  {
    id: "cpu-expert",
    name: "CPU Expert",
    description: "Unlock every advanced component and reach build level 40.",
  },
  {
    id: "flagship-2026",
    name: "2026 Flagship",
    description: "Reach build level 80 — Venice / Diamond Rapids class silicon.",
  },
];
