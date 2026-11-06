export type StageTab = "tip" | "play" | "why" | "feedback" | "unseen";

export type Mood = "idle" | "think" | "oops" | "cheer";

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

/** One line the Tutor says right now. color/mood are optional extras for the Tutor. */
export interface Coach {
  tag: string;
  text: string;
  color?: string;
  mood?: Mood;
}

export interface StagePlayProps {
  /** "main" = main task; "unseen" = a new task that checks transfer */
  phase: "main" | "unseen";
  tab: StageTab;
  /** container in the right panel; a stage portals its mission UI into it */
  panelEl: HTMLElement | null;
  onEvidence: (e: Partial<Evidence>) => void;
  /** what the Tutor says right now (speech bubble) */
  onCoach: (c: Coach) => void;
  /** what the player should do next (GOAL line) */
  onGoal: (text: string) => void;
  /** ask the shell to move on (only tip -> play is honoured) */
  onAdvance: (tab: StageTab) => void;
  onDone: (result: StageResult) => void;
}
