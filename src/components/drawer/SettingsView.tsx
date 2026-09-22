"use client";

import { useTheme } from "@/lib/theme";

interface SettingsViewProps {
  onReset: () => void;
}

export function SettingsView({ onReset }: SettingsViewProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-accent-text">
          Settings
        </h2>
        <p className="mt-1 text-xs text-muted">Theme and save controls</p>
      </div>

      <div className="rounded-xl border border-edge bg-panel-muted p-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
          Appearance
        </p>
        <button
          type="button"
          onClick={toggleTheme}
          className="mt-2 w-full rounded-lg border border-edge bg-panel px-3 py-2.5 font-mono text-sm font-semibold text-foreground transition hover:bg-accent-soft"
        >
          Switch to {theme === "dark" ? "Light" : "Dark"} mode
        </button>
      </div>

      <div className="rounded-xl border border-edge bg-panel-muted p-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted">
          Save Data
        </p>
        <p className="mt-1 text-[11px] text-muted">
          Progress autosaves in this browser. Reset clears Compute Points, upgrades,
          mastery, and achievements.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-3 w-full rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2.5 font-mono text-sm font-semibold text-rose-500 transition hover:bg-rose-500/20"
        >
          Reset All Progress
        </button>
      </div>
    </div>
  );
}
