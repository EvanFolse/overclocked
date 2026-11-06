"use client";
import { useState } from "react";
import type { StagePlayProps } from "./types";

const btn = {
  padding: "8px 14px", borderRadius: 8, border: "1px solid #1e3a5f",
  background: "#0b1b3a", color: "#e6f1ff", cursor: "pointer",
} as const;

export function PlaceholderPlay({ phase, onEvidence, onAdvance, onDone }: StagePlayProps) {
  const [attempts, setAttempts] = useState(0);
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ opacity: 0.7 }}>
        {phase === "main" ? "PLAY (placeholder)" : "UNSEEN task (placeholder)"}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          style={btn}
          onClick={() => {
            const n = attempts + 1;
            setAttempts(n);
            onAdvance("play");
            onEvidence({ attempts: n, status: "IN PROGRESS" });
          }}
        >
          Try ({attempts})
        </button>
        <button
          style={btn}
          onClick={() => {
            onEvidence({ status: "DONE" });
            onDone({ attempts: Math.max(1, attempts), hints: 0, metrics: {} });
          }}
        >
          Mark done (dev)
        </button>
      </div>
    </div>
  );
}
