import type { ComponentType } from "react";
import { LearnStep } from "@/components/learning/LearnStep";
import { PlaceStep } from "@/components/learning/PlaceStep";

export interface StepProps {
  onComplete: () => void;
}

/**
 * Optional custom screens of a stage. Anything not listed falls back to a default:
 * - no Learn: a generic page that shows the bank's `reading` text
 * - no Place: the Place step is skipped
 */
export interface StageFlow {
  Learn?: ComponentType<StepProps>;
  Place?: ComponentType<StepProps>;
}

export const STAGE_FLOW: Record<string, StageFlow> = {
  "cpu-basics": { Learn: LearnStep, Place: PlaceStep },
};

export function getStageFlow(checkpointId: string | null | undefined): StageFlow {
  if (!checkpointId) return {};
  return STAGE_FLOW[checkpointId] ?? {};
}
