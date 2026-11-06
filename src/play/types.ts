export type StageTab = "tip" | "play" | "why" | "feedback" | "unseen";

export interface StageResult {
  attempts: number;
  hints: number;
  metrics: Record<string, number | string>;
}

export interface StagePlayProps {
  /** "main" = main task; "unseen" = a new task that checks transfer */
  phase: "main" | "unseen";
  onDone: (result: StageResult) => void;
}
