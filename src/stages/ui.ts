import type { ComponentType } from "react";
import { LearnStep } from "@/components/learning/LearnStep";
import { PlaceStep } from "@/components/learning/PlaceStep";
import { DragMatchStep } from "@/components/learning/DragMatchStep";
import type { RoundMatching } from "@/lib/rounds";
import type { MatchResult } from "@/types/game";

export interface StepProps {
  onComplete: () => void;
}

/**
 * Optional custom screens of a stage. Anything not listed falls back to a default:
 * - no Learn: a generic page that shows the bank's `reading` text
 * - no Place: the Place step is skipped
 */
export interface MatchProps {
  sets: RoundMatching[];
  onSetSettled: (result: MatchResult) => void;
  onComplete: () => void;
}

export interface StageFlow {
  Learn?: ComponentType<StepProps>;
  Place?: ComponentType<StepProps>;
  /** Optional: another screen for the matching sets (default: the click-to-pair MatchStep) */
  Match?: ComponentType<MatchProps>;
}

export const STAGE_FLOW: Record<string, StageFlow> = {
  "cpu-basics": { Learn: LearnStep, Place: PlaceStep },
  // Stage 2: matching by drag and drop
  "fetch-decode-execute": { Match: DragMatchStep },
};

export function getStageFlow(checkpointId: string | null | undefined): StageFlow {
  if (!checkpointId) return {};
  return STAGE_FLOW[checkpointId] ?? {};
}
