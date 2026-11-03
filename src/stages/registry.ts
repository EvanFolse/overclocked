import type { StageBank } from "@/data/bank/types";
import type { CpuView } from "@/data/bank/stage1CpuViews";
import { STAGE_1_BANK } from "@/data/bank/stage1";
import { STAGE_1_CPU_VIEWS, STAGE_1_EMPHASIS } from "@/data/bank/stage1CpuViews";
import { STAGE_4_BANK } from "@/data/bank/stage4";
import type { Contrast, GlossaryTerm } from "@/stages/glossary";
import { STAGE_1_CONTRASTS, STAGE_1_GLOSSARY } from "@/stages/stage1Glossary";
import { STAGE_4_CONTRASTS, STAGE_4_GLOSSARY } from "@/stages/stage4Glossary";

/**
 * Content of one stage. A stage that is listed here uses the new flow
 * (Learn -> Place -> Match -> Quiz round) and its question bank.
 * A stage that is NOT listed keeps the old quiz panel until its bank is written.
 *
 * To add a stage: write its bank (src/data/bank/stageN.ts), then add ONE entry below.
 */
export interface StageContent {
  /** Checkpoint id of the stage (see src/data/stages.ts) */
  checkpointId: string;
  /** Required: the question bank of the stage */
  bank: StageBank;
  /** Optional: data of the CPU VIEW panel left of a mission question, keyed by question id */
  missionViews?: Record<string, CpuView>;
  /** Optional: part of a mission's first sentence to show in bold, keyed by question id */
  emphasis?: Record<string, string>;
  /** Optional: header text of the stage screens. Default: "STAGE <n> · <TITLE>" from stages.ts */
  layoutTitle?: string;
  /** Optional: short explanations of the parts or concepts named in answer options (Tutor, design doc 6.1) */
  glossary?: GlossaryTerm[];
  /** Optional: how to tell two glossary terms apart */
  contrasts?: Contrast[];
}

export const STAGE_CONTENT: StageContent[] = [
  {
    checkpointId: "cpu-basics",
    bank: STAGE_1_BANK,
    missionViews: STAGE_1_CPU_VIEWS,
    emphasis: STAGE_1_EMPHASIS,
    layoutTitle: "STAGE 1 · KNOW THE CPU",
    glossary: STAGE_1_GLOSSARY,
    contrasts: STAGE_1_CONTRASTS,
  },
  {
    checkpointId: "cache-hierarchy",
    bank: STAGE_4_BANK,
    layoutTitle: "STAGE 4 · THE MEMORY HIERARCHY",
    glossary: STAGE_4_GLOSSARY,
    contrasts: STAGE_4_CONTRASTS,
  },
];

export function getStageContent(checkpointId: string | null | undefined): StageContent | undefined {
  if (!checkpointId) return undefined;
  return STAGE_CONTENT.find((s) => s.checkpointId === checkpointId);
}
