import type { AchievementDefinition } from "@/types/game";

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first-upgrade",
    name: "First Upgrade",
    description: "Install your first CPU component upgrade.",
  },
  {
    id: "earned-1k",
    name: "1K Compute",
    description: "Accumulate 1,000 Compute Points.",
  },
  {
    id: "earned-1m",
    name: "1M Compute",
    description: "Accumulate 1,000,000 Compute Points.",
  },
  {
    id: "correct-10",
    name: "10 Challenges Solved",
    description: "Correctly diagnose 10 CPU architecture challenges.",
  },
  {
    id: "correct-100",
    name: "100 Challenges Solved",
    description: "Correctly diagnose 100 CPU architecture challenges.",
  },
  {
    id: "cpu-expert",
    name: "Architecture Expert",
    description: "Unlock every advanced component and reach build level 40.",
  },
  {
    id: "flagship-2026",
    name: "2026 Flagship",
    description: "Reach build level 80 — modern flagship-class silicon.",
  },
  {
    id: "pipeline-master",
    name: "Pipeline Master",
    description: "Unlock pipelining, forwarding, and branch prediction.",
  },
  {
    id: "bottleneck-5",
    name: "Bottleneck Hunter",
    description: "Resolve 5 live CPU bottleneck events.",
  },
];
