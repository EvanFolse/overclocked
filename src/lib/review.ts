import { getRoundItems } from "@/lib/rounds";
import { getStageContent } from "@/stages/registry";
import type { Contrast, GlossaryTerm } from "@/stages/glossary";
import type { GameState, MatchMistake } from "@/types/game";

/**
 * Corrections after a round (design doc 6.1).
 * A page is built for each mix-up the player made: a wrong option in a quiz question, or a
 * wrong pairing in a matching set. A page names what was confused, explains both things and,
 * when the stage defines it, how to tell them apart.
 * Text comes from the stage glossary (src/stages/glossary.ts) and the question's own explanation.
 */

export interface ReviewSection {
  heading: string;
  text: string;
  tone: "term" | "contrast";
}

export interface ReviewPage {
  key: string;
  /** What the player got wrong, shown as a "weak spot" label (null when unknown) */
  weakSpot: string | null;
  /** The question this page is about (null for matching) */
  question: string | null;
  title: string;
  /** One sentence that says what was confused */
  lead: string;
  sections: ReviewSection[];
  /** Why the answer is what it is (the question's own explanation) */
  why: string | null;
}

export interface WrongPick {
  id: string;
  /** Original option index (the order written in the question bank) */
  choice: number;
}

export interface MatchMistakeRecord extends MatchMistake {
  setId: string;
}

const MAX_PAGES = 6;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Which glossary term does this answer option name? Options that list several things return null. */
function findTerm(glossary: GlossaryTerm[], choice: string): GlossaryTerm | null {
  const c = choice.toLowerCase();
  if (c.includes(",") || /\band\b/.test(c)) return null;
  let best: GlossaryTerm | null = null;
  let bestLen = 0;
  for (const term of glossary) {
    for (const name of [term.name, ...(term.aliases ?? [])]) {
      const n = name.toLowerCase();
      const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(n)}([^a-z0-9]|$)`);
      if (re.test(c) && n.length > bestLen) {
        best = term;
        bestLen = n.length;
      }
    }
  }
  return best;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("+");
}

function findContrast(contrasts: Contrast[], a: string, b: string): Contrast | undefined {
  return contrasts.find(
    (c) => (c.between[0] === a && c.between[1] === b) || (c.between[0] === b && c.between[1] === a)
  );
}

function termSections(
  a: GlossaryTerm | null,
  b: GlossaryTerm | null,
  contrasts: Contrast[]
): ReviewSection[] {
  const out: ReviewSection[] = [];
  if (a) out.push({ heading: a.name, text: a.text, tone: "term" });
  if (b && b.id !== a?.id) out.push({ heading: b.name, text: b.text, tone: "term" });
  if (a && b && a.id !== b.id) {
    const c = findContrast(contrasts, a.id, b.id);
    if (c) out.push({ heading: "How to tell them apart", text: c.text, tone: "contrast" });
  }
  return out;
}

/**
 * Call with the state from BEFORE finishRound clears the round.
 * `picks` are the wrong options the player chose, `matchMistakes` the wrong pairings.
 */
export function buildReviewPages(
  state: GameState,
  picks: WrongPick[],
  matchMistakes: MatchMistakeRecord[] = []
): ReviewPage[] {
  const items = getRoundItems(state);
  const content = getStageContent(state.activeCheckpointId);
  const glossary = content?.glossary ?? [];
  const contrasts = content?.contrasts ?? [];
  const pages: ReviewPage[] = [];
  const seen = new Set<string>();

  // 1) Wrong options in quiz questions and missions
  for (const pick of picks) {
    const item = items.find((it) => it.id === pick.id);
    if (!item || item.kind !== "mc" || pick.choice === item.correctIndex) continue;
    const picked = item.choices[pick.choice];
    if (picked === undefined) continue;
    const correct = item.choices[item.correctIndex] ?? "";

    const pt = findTerm(glossary, picked);
    const ct = findTerm(glossary, correct);
    const pair = pt && ct && pt.id !== ct.id ? ([pt, ct] as const) : null;
    const key = pair ? `pair-${pairKey(pair[0].id, pair[1].id)}` : `q-${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    pages.push({
      key,
      weakSpot: pt?.name ?? null,
      question: item.scenario,
      title: pair ? `${pair[0].name} or ${pair[1].name}?` : `Let’s review: ${item.concept}`,
      lead: `You chose “${picked}”, but the answer is “${correct}”.${
        pair ? " These two are easy to mix up." : ""
      }`,
      sections: termSections(pt, ct, contrasts),
      why: item.explanation,
    });
  }

  // 2) Wrong pairings in matching sets
  for (const rec of matchMistakes) {
    const item = items.find((it) => it.id === rec.setId);
    if (!item || item.kind !== "match") continue;
    const left = item.pairs.find((p) => p.item === rec.item);
    if (!left) continue;
    const other = rec.confusedWith ? item.pairs.find((p) => p.item === rec.confusedWith) : undefined;
    const lt = findTerm(glossary, left.item);

    if (other) {
      const ot = findTerm(glossary, other.item);
      const key =
        lt && ot && lt.id !== ot.id
          ? `pair-${pairKey(lt.id, ot.id)}`
          : `match-${rec.setId}-${left.item}-${other.item}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const sections: ReviewSection[] = [
        { heading: left.item, text: left.description, tone: "term" },
        { heading: other.item, text: other.description, tone: "term" },
      ];
      if (lt && ot && lt.id !== ot.id) {
        const c = findContrast(contrasts, lt.id, ot.id);
        if (c) sections.push({ heading: "How to tell them apart", text: c.text, tone: "contrast" });
      }
      pages.push({
        key,
        weakSpot: left.item,
        question: null,
        title: `${left.item} or ${other.item}?`,
        lead: `In the matching task you paired “${left.item}” with the description of “${other.item}”. These two are easy to mix up.`,
        sections,
        why: null,
      });
    } else {
      const key = `match-${rec.setId}-${left.item}-distractor`;
      if (seen.has(key)) continue;
      seen.add(key);
      pages.push({
        key,
        weakSpot: left.item,
        question: null,
        title: `What does “${left.item}” do?`,
        lead: `In the matching task you paired “${left.item}” with a description that does not belong to any part in that set.`,
        sections: [{ heading: left.item, text: left.description, tone: "term" }],
        why: null,
      });
    }
  }

  return pages.slice(0, MAX_PAGES);
}

/**
 * A short note on how to tell the chosen answer from the right one, from the stage glossary.
 * Used by the golden chip. Returns null when nothing is known about the two options.
 */
export function buildQuickFix(checkpointId: string, picked: string, correct: string): string | null {
  const content = getStageContent(checkpointId);
  const glossary = content?.glossary ?? [];
  const contrasts = content?.contrasts ?? [];
  const pt = findTerm(glossary, picked);
  const ct = findTerm(glossary, correct);
  if (!pt || !ct || pt.id === ct.id) return null;
  const c = findContrast(contrasts, pt.id, ct.id);
  return c ? c.text : `${pt.name}: ${pt.text}\n${ct.name}: ${ct.text}`;
}