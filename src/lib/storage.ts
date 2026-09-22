import type { GameState } from "@/types/game";
import {
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  LEGACY_STORAGE_KEY_OLD,
  LEGACY_STORAGE_KEY_ANCIENT,
  createInitialState,
  sanitizeLoadedState,
} from "@/lib/gameLogic";

export function loadGame(): GameState {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY_OLD) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY_ANCIENT);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeLoadedState(parsed) ?? createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveGame(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / private mode failures
  }
}

export function clearSavedGame(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY_OLD);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY_ANCIENT);
  } catch {
    // ignore
  }
}
