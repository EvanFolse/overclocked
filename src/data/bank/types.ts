/**
 * Question bank format, shared by all five stages.
 *
 * Authoring rules
 * - Store choices in any order. The game shuffles at runtime (on entering a question,
 *   on refresh, and again on the second attempt), so correctIndex only refers to the
 *   order written here.
 * - `draft: true` means the text was drafted by AI and must be checked against the
 *   textbook by a teammate before release.
 * - `spare: true` marks a reserve question. Spares are only drawn after a failed round.
 */

export type StageNumber = 1 | 2 | 3 | 4 | 5;

/** Multiple choice: exactly 5 choices, exactly 1 hint. */
export interface McQuestion {
    id: string;
    /** The part or concept tested. Used for accuracy tracking (design doc 9.2). */
    concept: string;
    /** "mission" = reasoning mission (design doc 3). Omitted means a plain multiple-choice question. */
    group?: "mission" | "mc";
    scenario: string;
    choices: [string, string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3 | 4;
    hint: string;
    /** Shown when the answer is revealed (both attempts wrong) and after a correct answer. */
    explanation: string;
    spare?: boolean;
    draft?: boolean;
}

export interface MatchPair {
    /** Left-hand item */
    item: string;
    /** Its matching description (right-hand side) */
    description: string;
}

/**
 * Matching set: 4 items on the left, 5 descriptions on the right.
 * The 5th description is a distractor that matches nothing.
 * The game builds both columns from `pairs` + `distractor` and shuffles them.
 */
export interface MatchingSet {
    id: string;
    /** Parts or concepts covered, used for accuracy tracking */
    concepts: string[];
    pairs: [MatchPair, MatchPair, MatchPair, MatchPair];
    distractor: string;
    hint: string;
    spare?: boolean;
    draft?: boolean;
}

/**
 * One scoring concept for an open-ended answer.
 * Grader rules (to implement later):
 * - lowercase the answer; match Latin-script terms as whole words only
 * - remove the question's own wording from the answer before scoring
 * - a group is hit when at least `need` different entries of `terms` are found
 * - if `near` is set, at least one `near` word must also appear in the same clause as
 *   the matched term (remove the matched term itself before looking for `near` words)
 */
export interface ConceptGroup {
    label: string;
    /** Each entry is one thing to detect, written as its accepted synonyms. */
    terms: string[][];
    /** How many different entries of `terms` must be found. Default 1. */
    need?: number;
    near?: string[];
}

/**
 * Open-ended bonus question (design doc 8.1). No hint, one attempt.
 * Score = number of groups hit: >= fullAt is full reward, >= halfAt is half reward,
 * otherwise no reward and `explanation` is shown.
 */
export interface OpenQuestion {
    id: string;
    prompt: string;
    groups: ConceptGroup[];
    fullAt: number;
    halfAt: number;
    /**
     * If true, the phrase matched by the first group is removed from the answer before
     * the other groups are tested (stops the full name "arithmetic logic unit" from also
     * triggering "arithmetic" and "logic").
     */
    consumeFirstGroup?: boolean;
    explanation: string;
    draft?: boolean;
}

export interface StageBank {
    stageId: StageNumber;
    /** Short reading shown before the quiz round (60 to 120 words). */
    reading: string;
    readingDraft?: boolean;
    /** Required questions plus spares (spare: true). */
    mc: McQuestion[];
    matching: MatchingSet[];
    /** Always the first bonus question of the stage. */
    openFirst: OpenQuestion;
    /** The second bonus question is drawn at random from this pool. */
    openPool: OpenQuestion[];
}