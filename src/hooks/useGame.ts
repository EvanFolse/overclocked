"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CheckpointResolveResult,
  QuizFeedback,
  StatDelta,
  UpgradeId,
} from "@/types/game";
import {
  answerCheckpointStep,
  answerQuestion,
  createInitialState,
  getCpuLevel,
  getIncomePerSecond,
  isCpuOnline,
  isProductionStalled,
  maybeActivateCheckpoint,
  pickRandomQuestion,
  purchaseUpgrade,
  startBootSequence,
  tickIncome,
} from "@/lib/gameLogic";
import { getCpuPerformance } from "@/lib/cpuStats";
import { getCheckpoint } from "@/data/checkpoints";
import { clearSavedGame, loadGame, saveGame } from "@/lib/storage";
import { CHALLENGES } from "@/data/questions";

export function useGame() {
  const [state, setState] = useState(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [upgradeFlash, setUpgradeFlash] = useState(0);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [statDelta, setStatDelta] = useState<StatDelta | null>(null);
  const [resolveToast, setResolveToast] = useState<CheckpointResolveResult | null>(
    null
  );
  const prevAchievements = useRef<string[]>([]);
  const prevCheckpoint = useRef<string | null>(null);

  useEffect(() => {
    const caughtUp = tickIncome(loadGame(), Date.now());
    prevAchievements.current = caughtUp.unlockedAchievements;
    prevCheckpoint.current = caughtUp.activeCheckpointId;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount hydration
    setState(caughtUp);
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
    if (!state.activeCheckpointId) {
      setLessonOpen(false);
    }
    prevCheckpoint.current = state.activeCheckpointId;
  }, [state.activeCheckpointId, hydrated]);

  const beginBoot = useCallback(() => {
    setState((prev) => startBootSequence(prev));
    setLessonOpen(true);
    setSelectedChoice(null);
    setFeedback(null);
  }, []);

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

  const submitCheckpointAnswer = useCallback(() => {
    if (selectedChoice == null) return;
    setState((prev) => {
      const result = answerCheckpointStep(prev, selectedChoice);
      if (!result) return prev;
      setFeedback(result.feedback);
      if (result.completedCheckpoint && result.resolve) {
        setResolveToast(result.resolve);
        setUpgradeFlash((f) => f + 1);
        setLessonOpen(false);
      }
      return result.state;
    });
  }, [selectedChoice]);

  const nextCheckpointStep = useCallback(() => {
    setSelectedChoice(null);
    setFeedback(null);
  }, []);

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
  }, []);

  const activeQuestion = CHALLENGES.find((q) => q.id === activeQuestionId) ?? null;
  const activeCheckpoint = getCheckpoint(state.activeCheckpointId);
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
    lessonOpen,
    activeQuestion,
    selectedChoice,
    setSelectedChoice,
    feedback,
    newAchievement,
    statDelta,
    resolveToast,
    clearStatDelta,
    clearResolveToast,
    beginBoot,
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
