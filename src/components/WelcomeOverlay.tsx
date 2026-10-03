"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "overclocked-welcome-seen-v1";

export function WelcomeOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) setVisible(true);
    } catch {
      // If localStorage is unavailable, just show it once per session.
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-violet/30 bg-panel p-6 shadow-2xl">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full text-violet/40"
          viewBox="0 0 400 300"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 40 H 60 V 0 M 400 60 H 340 V 0 M 0 260 H 70 V 300 M 400 240 H 330 V 300"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="60" cy="40" r="3" fill="currentColor" />
          <circle cx="340" cy="60" r="3" fill="currentColor" />
          <circle cx="70" cy="260" r="3" fill="currentColor" />
          <circle cx="330" cy="240" r="3" fill="currentColor" />
        </svg>
        <h2 className="font-mono text-lg font-semibold text-foreground">
          🎮 What should I do?
        </h2>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
          <p>
            <span className="font-semibold text-foreground">🎯 Your goal</span>
            <br />
            Build a faster CPU and upgrade through new CPU generations.
          </p>
          <p>
            <span className="font-semibold text-foreground">💰 Your CP</span>
            <br />
            Your CPU automatically generates Compute Points. Spend CP on upgrades.
          </p>
          <p>
            <span className="font-semibold text-foreground">🧠 Your knowledge</span>
            <br />
            Complete learning challenges to unlock advanced upgrades.
          </p>
          <p>
            <span className="font-semibold text-foreground">🦾 Game values</span>
            <br />
            Designed to help you learn as much as possible while you play.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg border border-violet/50 bg-violet-soft px-4 py-2 font-mono text-sm font-semibold text-violet transition hover:opacity-90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
