import { getCheckpoint, type CheckpointQuestion } from "@/data/checkpoints";
import { STAGE_1_BANK } from "@/data/bank/stage1";
import type { MatchingSet, StageBank } from "@/data/bank/types";
import type { GameState } from "@/types/game";

/**
 * Matching sets are already in the question bank, but the matching screen is not built yet.
 * Switch this to true when the matching screen is part of the game.
 */
export const INCLUDE_MATCHING = false;

export type RoundGroup = "mission" | "mc" | "match";

/**
 * Share of the round score for each group (design doc 4.3).
 * If a group has no items in the round, its share is shared out among the other groups.
 */
export const GROUP_WEIGHTS: Record<RoundGroup, number> = {
    mission: 0.4,
    mc: 0.35,
    match: 0.25,
};

/** A multiple-choice shaped item: either a reasoning mission or a plain multiple-choice question. */
export interface RoundQuestion extends CheckpointQuestion {
    id: string;
    concept: string;
    group: "mission" | "mc";
}

export type RoundMatching = MatchingSet;

export type RoundItem =
    | ({ kind: "mc" } & RoundQuestion)
    | ({ kind: "match" } & RoundMatching);

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

function pick<T extends { id: string }>(pool: T[], count: number, failed: Set<string>): T[] {
    const fresh = shuffled(pool.filter((q) => !failed.has(q.id)));
    const repeats = shuffled(pool.filter((q) => failed.has(q.id)));
    return shuffled([...fresh, ...repeats].slice(0, count));
}

/**
 * Pick the item ids for a new round. Multiple-choice shaped items come first, matching sets last.
 * - First round: the required items, in bank order.
 * - After a failed round: the same number of items drawn from the whole bank
 *   (required + spare), avoiding items the player already failed where possible.
 */
export function drawRoundIds(bank: StageBank, failedIds: string[]): string[] {
    const requiredMc = bank.mc.filter((q) => !q.spare);
    const requiredMatch = INCLUDE_MATCHING ? bank.matching.filter((m) => !m.spare) : [];
    if (failedIds.length === 0) {
        return [...requiredMc, ...requiredMatch].map((item) => item.id);
    }

    const failed = new Set(failedIds);
    const mc = pick(bank.mc, requiredMc.length, failed);
    const match = INCLUDE_MATCHING ? pick(bank.matching, requiredMatch.length, failed) : [];
    return [...mc, ...match].map((item) => item.id);
}

/** All items of the round that is currently active (empty when no round is active). */
export function getRoundItems(state: GameState): RoundItem[] {
    const cp = getCheckpoint(state.activeCheckpointId);
    if (!cp) return [];

    const bank = getBank(cp.id);
    if (!bank) {
        return cp.questions.map(
            (q: CheckpointQuestion, i: number): RoundItem => ({
                ...q,
                kind: "mc",
                group: "mc",
                id: `${cp.id}-${i}`,
                concept: cp.courseUnit,
            })
        );
    }

    const ids =
        state.roundQuestionIds.length > 0
            ? state.roundQuestionIds
            : [
                ...bank.mc.filter((q) => !q.spare).map((q) => q.id),
                ...(INCLUDE_MATCHING ? bank.matching.filter((m) => !m.spare).map((m) => m.id) : []),
            ];

    return ids.flatMap((id): RoundItem[] => {
        const q = bank.mc.find((item) => item.id === id);
        if (q) {
            return [
                {
                    kind: "mc",
                    group: "mc",
                    id: q.id,
                    concept: q.concept,
                    scenario: q.scenario,
                    choices: q.choices,
                    correctIndex: q.correctIndex,
                    hint: q.hint,
                    explanation: q.explanation,
                },
            ];
        }
        const m = bank.matching.find((item) => item.id === id);
        if (m) {
            return [
                {
                    kind: "match",
                    id: m.id,
                    concepts: m.concepts,
                    pairs: m.pairs,
                    distractor: m.distractor,
                    hint: m.hint,
                },
            ];
        }
        return [];
    });
}

/** Only the multiple-choice shaped items. They always come before the matching sets. */
export function getRoundQuestions(state: GameState): RoundQuestion[] {
    return getRoundItems(state).filter(
        (item): item is Extract<RoundItem, { kind: "mc" }> => item.kind === "mc"
    );
}

function groupOf(item: RoundItem): RoundGroup {
    return item.kind === "match" ? "match" : item.group;
}

/**
 * How much of the round score (0 to 1) the item at `index` is worth.
 * Items of one group share that group's weight equally.
 */
export function weightOf(items: RoundItem[], index: number): number {
    const item = items[index];
    if (!item) return 0;

    const counts: Record<RoundGroup, number> = { mission: 0, mc: 0, match: 0 };
    for (const it of items) counts[groupOf(it)] += 1;

    const present = (Object.keys(counts) as RoundGroup[]).filter((g) => counts[g] > 0);
    const total = present.reduce((sum, g) => sum + GROUP_WEIGHTS[g], 0);

    const group = groupOf(item);
    return GROUP_WEIGHTS[group] / total / counts[group];
}