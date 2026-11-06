"use client";
import { useState } from "react";
import type { StagePlayProps } from "./types";

export function PlaceholderPlay({ phase, onDone }: StagePlayProps) {
  const [attempts, setAttempts] = useState(0);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ opacity: 0.7 }}>
        {phase === "main" ? "PLAY (placeholder)" : "UNSEEN task (placeholder)"}
      </div>
      <button onClick={() => setAttempts((n) => n + 1)}>Try ({attempts})</button>
      <button
        onClick={() =>
          onDone({ attempts: Math.max(1, attempts), hints: 0, metrics: {} })
        }
      >
        Mark done (dev)
      </button>
    </div>
  );
}
