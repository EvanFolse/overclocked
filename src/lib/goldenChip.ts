import type { McQuestion } from "@/data/bank/types";
import { STAGES } from "@/data/stages";
import { shuffleOrder } from "@/lib/rounds";
import { STAGE_CONTENT } from "@/stages/registry";
import type { GameState } from "@/types/game";

/**
 * Golden chip review questions (design doc 5.3).
 * The pool is built from the stage registry, so every stage that has a bank and has been
 * passed joins automatically. Only plain multiple-choice questions are used (no missions).
 */

export interface ChipQuestion {
  checkpointId: string;
  stageNumber: number;
  id: string;
  concept: string;
  scenario: string;
  /** Options already shuffled */
  choices: string[];
  correctIndex: number;
  explanation: string;
}

interface PoolItem {
  checkpointId: string;
  q: McQuestion;
}

function chipPool(state: GameState, anyStage: boolean): PoolItem[] {
  const out: PoolItem[] = [];
  for (const content of STAGE_CONTENT) {
    // Any stage that has a bank can be asked, passed or not (anyStage is kept for the callers)
    void anyStage;
    void state;
    for (const q of content.bank.mc) {
      if (q.group === "mission") continue;
      out.push({ checkpointId: content.checkpointId, q });
    }
  }
  return out;
}

function build(item: PoolItem): ChipQuestion {
  const order = shuffleOrder(item.q.choices.length);
  return {
    checkpointId: item.checkpointId,
    stageNumber: STAGES.find((s) => s.checkpointId === item.checkpointId)?.id ?? 1,
    id: item.q.id,
    concept: item.q.concept,
    scenario: item.q.scenario,
    choices: order.map((i) => item.q.choices[i]!),
    correctIndex: order.indexOf(item.q.correctIndex),
    explanation: item.q.explanation,
  };
}

export function hasChipQuestions(state: GameState): boolean {
  // No chip before the first stage is passed; after that every bank question is in the pool
  return state.completedLearningCheckpoints.length > 0 && chipPool(state, true).length > 0;
}

export interface PickOptions {
  /** Questions to avoid if possible (asked recently) */
  avoid?: string[];
  /** Questions that must not be picked (already used in this chip) */
  forbid?: string[];
  /** Development only: ignore which stages are passed */
  anyStage?: boolean;
}

export function pickChipQuestion(state: GameState, opts: PickOptions = {}): ChipQuestion | null {
  const forbid = new Set(opts.forbid ?? []);
  const avoid = new Set(opts.avoid ?? []);
  const all = chipPool(state, !!opts.anyStage).filter((it) => !forbid.has(it.q.id));
  const preferred = all.filter((it) => !avoid.has(it.q.id));
  const items = preferred.length > 0 ? preferred : all;
  if (items.length === 0) return null;

  // Plain random pick
  return build(items[Math.floor(Math.random() * items.length)]!);
}
