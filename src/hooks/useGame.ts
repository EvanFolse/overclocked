"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { QuizFeedback, UpgradeId } from "@/types/game";
import {
  answerQuestion,
  createInitialState,
  getCpuLevel,
  getIncomePerSecond,
  pickRandomQuestion,
  purchaseUpgrade,
  tickIncome,
} from "@/lib/gameLogic";
import { clearSavedGame, loadGame, saveGame } from "@/lib/storage";
import { QUESTIONS } from "@/data/questions";

export function useGame() {
  const [state, setState] = useState(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [upgradeFlash, setUpgradeFlash] = useState(0);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const prevAchievements = useRef<string[]>([]);

  useEffect(() => {
    const caughtUp = tickIncome(loadGame(), Date.now());
    prevAchievements.current = caughtUp.unlockedAchievements;
    // One-time client hydration from localStorage (SSR-safe)
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

  const buyUpgrade = useCallback((id: UpgradeId) => {
    setState((prev) => {
      const next = purchaseUpgrade(prev, id);
      if (!next) return prev;
      setUpgradeFlash((f) => f + 1);
      return next;
    });
  }, []);

  const openQuiz = useCallback((preferUnlock = false) => {
    setState((prev) => {
      const q = pickRandomQuestion(prev, preferUnlock);
      setActiveQuestionId(q.id);
      setSelectedChoice(null);
      setFeedback(null);
      setQuizOpen(true);
      return prev;
    });
  }, []);

  const closeQuiz = useCallback(() => {
    setQuizOpen(false);
    setFeedback(null);
    setSelectedChoice(null);
  }, []);

  const submitAnswer = useCallback(() => {
    if (activeQuestionId == null || selectedChoice == null) return;
    setState((prev) => {
      const result = answerQuestion(prev, activeQuestionId, selectedChoice);
      if (!result) return prev;
      setFeedback(result.feedback);
      return result.state;
    });
  }, [activeQuestionId, selectedChoice]);

  const nextQuestion = useCallback(() => {
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
    setQuizOpen(false);
    setFeedback(null);
    setSelectedChoice(null);
    setActiveQuestionId(null);
  }, []);

  const activeQuestion = QUESTIONS.find((q) => q.id === activeQuestionId) ?? null;

  return {
    state,
    hydrated,
    incomePerSecond: getIncomePerSecond(state),
    cpuLevel: getCpuLevel(state),
    pulse,
    upgradeFlash,
    quizOpen,
    activeQuestion,
    selectedChoice,
    setSelectedChoice,
    feedback,
    newAchievement,
    buyUpgrade,
    openQuiz,
    closeQuiz,
    submitAnswer,
    nextQuestion,
    resetGame,
  };
}
