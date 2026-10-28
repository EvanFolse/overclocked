/** All tuning numbers of the learning round live here (design doc 4.2, 4.3). */
export const LEARNING_CONFIG = {
    passLine: 0.7,
    maxAttempts: 2,
    credit: { first: 1, second: 0.75, withHint: 0.5 },
    groupWeight: { mission: 0.4, mc: 0.35, match: 0.25 },
    reward: {
        budgetShareOfPrice: 0.3, // round reward budget = 30% of the stage price (placeholder)
        streakStep: 0.1,         // +10% per question in a row answered right on the first attempt
        streakCap: 0.5,          // capped at +50%
    },
} as const;