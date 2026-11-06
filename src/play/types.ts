export type StageTab = "tip" | "play" | "why" | "feedback" | "unseen";

export interface StageResult {
  attempts: number;
  hints: number;
  metrics: Record<string, number | string>;
}

/** Live numbers shown in the Evidence Log */
export interface Evidence {
  attempts: number;
  hints: number;
  status: string;
}

export interface StagePlayProps {
  /** "main" = main task; "unseen" = a new task that checks transfer */
  phase: "main" | "unseen";
  /** current tab of the right-hand panel */
  tab: StageTab;
  /** container in the right panel; a stage can portal its mission/probe UI into it */
  panelEl: HTMLElement | null;
  onEvidence: (e: Partial<Evidence>) => void;
  /** ask the shell to move on (only tip -> play is honoured) */
  onAdvance: (tab: StageTab) => void;
  onDone: (result: StageResult) => void;
}
