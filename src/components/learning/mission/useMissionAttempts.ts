"use client";

import { useState } from "react";

/** Same shape the engine already uses for a settled item (see MatchResult). */
export interface MissionResult {
  correct: boolean;
  attemptCorrect: 1 | 2 | null;
  hintUsed: boolean;
}

export type Phase = "playing" | "wrong" | "solved" | "revealed";

/** Two attempts, hint only from attempt 2 on (hint = x0.5 credit). Same rules as the quiz round. */
export function useMissionAttempts(onSettle: (r: MissionResult) => void) {
  const [attempt, setAttempt] = useState(1);
  const [hintOpened, setHintOpened] = useState(false);
  const [phase, setPhase] = useState<Phase>("playing");

  const judge = (ok: boolean) => {
    if (ok) {
      setPhase("solved");
      onSettle({ correct: true, attemptCorrect: attempt <= 1 ? 1 : 2, hintUsed: hintOpened });
    } else if (attempt < 2) {
      setAttempt(2);
      setPhase("wrong");
    } else {
      setPhase("revealed");
      onSettle({ correct: false, attemptCorrect: null, hintUsed: hintOpened });
    }
  };

  return {
    attempt,
    hintOpened,
    phase,
    judge,
    retry: () => setPhase("playing"),
    openHint: () => setHintOpened(true),
  };
}
