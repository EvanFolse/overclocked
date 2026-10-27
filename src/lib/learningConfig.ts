/** All tuning numbers of the learning round live here (design doc 4.2, 4.3). */
export const LEARNING_CONFIG = {
    passLine: 0.7,
    maxAttempts: 2,
    credit: { first: 1, second: 0.75, withHint: 0.5 },
    groupWeight: { mission: 0.4, mc: 0.35, match: 0.25 },
} as const;