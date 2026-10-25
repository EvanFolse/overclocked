import { getCheckpoint, type CheckpointQuestion } from "@/data/checkpoints";
import { STAGE_1_BANK } from "@/data/bank/stage1";
import type { StageBank } from "@/data/bank/types";
import type { GameState } from "@/types/game";

/** One question of the current round, in its original (unshuffled) option order. */
export interface RoundQuestion extends CheckpointQuestion {
    id: string;
    concept: string;
}

/**
 * Stages that already use the new question bank, keyed by checkpoint id.
 * Other stages keep using the questions inside checkpoints.ts until their bank is written.
 */
const BANKS: Record<string, StageBank> = {
    "cpu-basics": STAGE_1_BANK,
};

export function getBank(checkpointId: string | null | undefined): StageBank | null {
    if (!checkpointId) return null;
    return BANKS[checkpointId] ?? null;
}

function shuffled<T>(items: T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
}

/** A random permutation of 0..n-1, used to shuffle the options of one question. */
export function shuffleOrder(n: number): number[] {
    return shuffled(Array.from({ length: n }, (_, i) => i));
}

/**
 * Pick the question ids for a new round.
 * - First round: the required questions, in bank order.
 * - After a failed round: the same number of questions drawn from the whole bank
 *   (required + spare), avoiding questions the player already failed where possible.
 */
export function drawRoundIds(bank: StageBank, failedIds: string[]): string[] {
    const required = bank.mc.filter((q) => !q.spare);
    if (failedIds.length === 0) return required.map((q) => q.id);

    const failed = new Set(failedIds);
    const fresh = shuffled(bank.mc.filter((q) => !failed.has(q.id)));
    const repeats = shuffled(bank.mc.filter((q) => failed.has(q.id)));
    const picked = [...fresh, ...repeats].slice(0, required.length);
    return shuffled(picked).map((q) => q.id);
}

/** The questions of the round that is currently active (empty when no round is active). */
export function getRoundQuestions(state: GameState): RoundQuestion[] {
    const cp = getCheckpoint(state.activeCheckpointId);
    if (!cp) return [];

    const bank = getBank(cp.id);
    if (!bank) {
        return cp.questions.map((q, i) => ({
            ...q,
            id: `${cp.id}-${i}`,
            concept: cp.courseUnit,
        }));
    }

    const ids =
        state.roundQuestionIds.length > 0
            ? state.roundQuestionIds
            : bank.mc.filter((q) => !q.spare).map((q) => q.id);

    return ids.flatMap((id) => {
        const q = bank.mc.find((item) => item.id === id);
        if (!q) return [];
        return [
            {
                id: q.id,
                concept: q.concept,
                scenario: q.scenario,
                choices: q.choices,
                correctIndex: q.correctIndex,
                hint: q.hint,
                explanation: q.explanation,
            },
        ];
    });
}