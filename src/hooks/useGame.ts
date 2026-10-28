"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CheckpointResolveResult,
  GameState,
  QuizFeedback,
  StatDelta,
  UpgradeId,
} from "@/types/game";
import {
  answerCheckpointStep,
  answerQuestion,
  createInitialState,
  finishRound,
  getCpuLevel,
  getIncomePerSecond,
  isCpuOnline,
  isProductionStalled,
  maybeActivateCheckpoint,
  openHint as applyOpenHint,
  pickRandomQuestion,
  purchaseUpgrade,
  getNextStage,
  startStage,
  tickIncome,
} from "@/lib/gameLogic";
import { getCpuPerformance } from "@/lib/cpuStats";
import { getCheckpoint } from "@/data/checkpoints";
import { getStageByCheckpoint } from "@/data/stages";
import { getBank, getRoundQuestions, shuffleOrder } from "@/lib/rounds";
import { clearSavedGame, loadGame, saveGame } from "@/lib/storage";
import { CHALLENGES } from "@/data/questions";

export interface RoundResult {
  stageTitle: string;
  /** 0 to 1 */
  percent: number;
  /** failed: under 70%. pending: passed, but not enough CP yet. passed: passed and unlocked */
  kind: "failed" | "pending" | "passed";
  reward: number;
}

/** A fresh random option order for the question the player is currently on. */
function orderFor(s: GameState): number[] {
  const q = getRoundQuestions(s)[s.checkpointStep];
  return q ? shuffleOrder(q.choices.length) : [];
}

/** The option order to use for question `step`: the stored one if it fits, otherwise the original order. */
function resolveOrder(s: GameState, order: number[], step: number): number[] {
  const q = getRoundQuestions(s)[step];
  if (!q) return [];
  return order.length === q.choices.length ? order : q.choices.map((_, i) => i);
}

export function useGame() {
  const [state, setState] = useState(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [upgradeFlash, setUpgradeFlash] = useState(0);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);
  /** choiceOrder[displayedIndex] = original option index of the current question */
  const [choiceOrder, setChoiceOrder] = useState<number[]>([]);
  const [resetCount, setResetCount] = useState(0);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [statDelta, setStatDelta] = useState<StatDelta | null>(null);
  const [resolveToast, setResolveToast] = useState<CheckpointResolveResult | null>(
    null
  );
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const prevAchievements = useRef<string[]>([]);
  const prevCheckpoint = useRef<string | null>(null);

  useEffect(() => {
    const loaded = tickIncome(loadGame(), Date.now());
    // If the page was refreshed after the last question was settled, finish that round now
    const ended = loaded.activeCheckpointId ? finishRound(loaded) : null;
    const caughtUp = ended ? ended.state : loaded;
    if (ended) {
      const stage = getStageByCheckpoint(loaded.activeCheckpointId);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount hydration
      setRoundResult({
        stageTitle: stage?.title ?? "Stage",
        percent: ended.percent,
        kind: ended.pending ? "pending" : ended.passed ? "passed" : "failed",
        reward: ended.bonus,
      });
    }
    prevAchievements.current = caughtUp.unlockedAchievements;
    prevCheckpoint.current = caughtUp.activeCheckpointId;
    setState(caughtUp);
    setChoiceOrder(orderFor(caughtUp));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveGame(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const tickId = window.setInterval(() => {
      setState((prev) => tickIncome(prev, Date.now()));
    }, 250);

    const pulseId = window.setInterval(() => {
      setPulse((p) => p + 1);
    }, 1000);

    return () => {
      window.clearInterval(tickId);
      window.clearInterval(pulseId);
    };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const prev = new Set(prevAchievements.current);
    const newly = state.unlockedAchievements.find((id) => !prev.has(id));
    if (newly) {
      setNewAchievement(newly);
      const timeout = window.setTimeout(() => setNewAchievement(null), 3500);
      prevAchievements.current = state.unlockedAchievements;
      return () => window.clearTimeout(timeout);
    }
    prevAchievements.current = state.unlockedAchievements;
  }, [state.unlockedAchievements, hydrated]);

  // When a new checkpoint arms, reset lesson UI (do not auto-open optional quiz)
  useEffect(() => {
    if (!hydrated) return;
    if (
      state.activeCheckpointId &&
      state.activeCheckpointId !== prevCheckpoint.current
    ) {
      setSelectedChoice(null);
      setFeedback(null);
      setLessonOpen(false);
    }
    prevCheckpoint.current = state.activeCheckpointId;
  }, [state.activeCheckpointId, hydrated]);

  const beginStage = useCallback(
    (stageId: number) => {
      // Compute outside the state updater so the first question is shuffled exactly once
      const next = startStage(state, stageId);
      setState(next);
      setChoiceOrder(orderFor(next));
      setLessonOpen(true);
      setSelectedChoice(null);
      setFeedback(null);
      setRoundResult(null);
    },
    [state]
  );

  const beginBoot = useCallback(() => {
    beginStage(1);
  }, [beginStage]);

  const openLesson = useCallback(() => {
    setState((prev) => {
      if (prev.activeCheckpointId) return prev;
      return maybeActivateCheckpoint(prev);
    });
    setLessonOpen(true);
    setSelectedChoice(null);
    setFeedback(null);
  }, []);

  const closeLesson = useCallback(() => {
    // Can close the reading UI, but stall remains until solved
    setLessonOpen(false);
    setFeedback(null);
    setSelectedChoice(null);
  }, []);

  const buyUpgrade = useCallback((id: UpgradeId) => {
    setState((prev) => {
      const result = purchaseUpgrade(prev, id);
      if (!result) return prev;
      setUpgradeFlash((f) => f + 1);
      setStatDelta(result.delta);
      return result.state;
    });
  }, []);

  const clearStatDelta = useCallback(() => setStatDelta(null), []);
  const clearResolveToast = useCallback(() => setResolveToast(null), []);
  const clearRoundResult = useCallback(() => setRoundResult(null), []);
  const openHint = useCallback(() => setState((prev) => applyOpenHint(prev)), []);

  const submitCheckpointAnswer = useCallback(() => {
    if (selectedChoice == null) return;
    // The player picked a displayed position. Convert it to the original option index.
    const order = resolveOrder(state, choiceOrder, state.checkpointStep);
    const originalIndex = order[selectedChoice] ?? selectedChoice;

    // Compute outside the state updater so the side effects below run exactly once
    const result = answerCheckpointStep(state, originalIndex);
    if (!result) return;

    setState(result.state);
    setFeedback(result.feedback);
  }, [state, selectedChoice, choiceOrder]);

  // Called by "Next", "See result" and "Try Again". The player always decides when to move on.
  // - After the last question it ends the round and shows the result.
  // - Otherwise it shows the next question (or the same one again for a second attempt)
  //   with a freshly shuffled set of options.
  const nextCheckpointStep = useCallback(() => {
    const ended = finishRound(state);
    if (ended) {
      const stage = getStageByCheckpoint(state.activeCheckpointId);
      setState(ended.state);
      setSelectedChoice(null);
      setFeedback(null);
      setLessonOpen(false);
      setRoundResult({
        stageTitle: stage?.title ?? "Stage",
        percent: ended.percent,
        kind: ended.pending ? "pending" : ended.passed ? "passed" : "failed",
        reward: ended.bonus,
      });
      if (ended.resolve) {
        setResolveToast(ended.resolve);
        setUpgradeFlash((f) => f + 1);
      }
      return;
    }
    setSelectedChoice(null);
    setFeedback(null);
    setChoiceOrder(orderFor(state));
  }, [state]);

  const openPractice = useCallback((preferUnlock = false) => {
    setState((prev) => {
      if (prev.activeCheckpointId) return prev;
      const q = pickRandomQuestion(prev, preferUnlock);
      setActiveQuestionId(q.id);
      setSelectedChoice(null);
      setFeedback(null);
      return prev;
    });
  }, []);

  const submitPractice = useCallback(() => {
    if (activeQuestionId == null || selectedChoice == null) return;
    setState((prev) => {
      const result = answerQuestion(prev, activeQuestionId, selectedChoice);
      if (!result) return prev;
      setFeedback(result.feedback);
      return result.state;
    });
  }, [activeQuestionId, selectedChoice]);

  const nextPractice = useCallback(() => {
    setState((prev) => {
      const q = pickRandomQuestion(prev, true);
      setActiveQuestionId(q.id);
      setSelectedChoice(null);
      setFeedback(null);
      return prev;
    });
  }, []);

  const resetGame = useCallback(() => {
    clearSavedGame();
    window.localStorage.removeItem("overclocked-welcome-seen-v1");
    const fresh = createInitialState();
    setState(fresh);
    prevAchievements.current = [];
    prevCheckpoint.current = null;
    setLessonOpen(false);
    setFeedback(null);
    setSelectedChoice(null);
    setActiveQuestionId(null);
    setStatDelta(null);
    setResolveToast(null);
    setRoundResult(null);
    setChoiceOrder([]);
    setResetCount((n) => n + 1);
  }, []);

  const activeQuestion = CHALLENGES.find((q) => q.id === activeQuestionId) ?? null;

  // What the quiz overlay shows: the questions of this round, the current one with
  // shuffled options, and the reading from the question bank when the stage has one.
  const baseCheckpoint = getCheckpoint(state.activeCheckpointId);
  const roundQuestions = getRoundQuestions(state);
  // When a question is settled (answered right, or answer revealed), the saved step has
  // already moved on to the next question. While that result is on screen, keep showing
  // the question that was just answered, so the next question is not revealed early.
  const settledFeedback = !!feedback && (feedback.correct || !!feedback.revealed);
  const displayStep =
    settledFeedback && state.activeCheckpointId
      ? Math.max(0, state.checkpointStep - 1)
      : state.checkpointStep;
  const shownOrder = resolveOrder(state, choiceOrder, displayStep);
  const bank = getBank(state.activeCheckpointId);
  const activeCheckpoint = baseCheckpoint
    ? {
      ...baseCheckpoint,
      reading: bank?.reading ?? baseCheckpoint.reading,
      questions: roundQuestions.map((q, i) =>
        i === displayStep
          ? {
            ...q,
            choices: shownOrder.map((o) => q.choices[o]!),
            correctIndex: shownOrder.indexOf(q.correctIndex),
          }
          : q
      ),
    }
    : null;

  const cpuStats = getCpuPerformance(state);

  return {
    state,
    hydrated,
    incomePerSecond: getIncomePerSecond(state),
    cpuLevel: getCpuLevel(state),
    cpuStats,
    cpuOnline: isCpuOnline(state),
    stalled: isProductionStalled(state),
    pulse,
    upgradeFlash,
    activeCheckpoint,
    displayStep,
    lessonOpen,
    activeQuestion,
    selectedChoice,
    setSelectedChoice,
    feedback,
    checkpointAttempt: state.checkpointAttempt,
    resetCount,
    newAchievement,
    statDelta,
    resolveToast,
    roundResult,

    hintOpened: state.checkpointHintOpened,
    openHint,
    clearRoundResult,
    clearStatDelta,
    clearResolveToast,
    beginBoot,
    beginStage,
    nextStage: getNextStage(state),
    openLesson,
    closeLesson,
    submitCheckpointAnswer,
    nextCheckpointStep,
    buyUpgrade,
    openPractice,
    submitPractice,
    nextPractice,
    resetGame,
  };
}