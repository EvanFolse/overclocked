"use client";
import { useState } from "react";
import { STAGE_COPY, STAGE_PLAYS } from "./content";
import type { StageResult, StageTab } from "./types";

const TABS: StageTab[] = ["tip", "play", "why", "feedback", "unseen"];

interface Props {
  stageId: number;
  title: string;
  onComplete: () => void;
  onExit: () => void;
}

export function StageOverlay({ stageId, title, onComplete, onExit }: Props) {
  const [tab, setTab] = useState<StageTab>("tip");
  const [main, setMain] = useState<StageResult | null>(null);
  const [unseen, setUnseen] = useState<StageResult | null>(null);
  const copy = STAGE_COPY[stageId];
  const Play = STAGE_PLAYS[stageId];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "grid",
        placeItems: "center",
        background: "rgba(2,6,18,0.85)",
        color: "#e6f1ff",
      }}
    >
      <div
        style={{
          width: "min(960px, 92vw)",
          padding: 24,
          borderRadius: 16,
          border: "1px solid #1e3a5f",
          background: "#050b1a",
          display: "grid",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>{title}</strong>
          <button onClick={onExit}>Exit</button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {TABS.map((t) => (
            <span
              key={t}
              style={{
                opacity: t === tab ? 1 : 0.4,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {tab === "tip" && (
          <>
            <p>{copy.tip}</p>
            <button onClick={() => setTab("play")}>Start</button>
          </>
        )}

        {tab === "play" && (
          <Play
            phase="main"
            onDone={(r) => {
              setMain(r);
              setTab("why");
            }}
          />
        )}

        {tab === "why" && (
          <>
            <p>{copy.why}</p>
            <button onClick={() => setTab("feedback")}>Continue</button>
          </>
        )}

        {tab === "feedback" && main && (
          <>
            <div>
              Attempts: {main.attempts} · Hints: {main.hints}
            </div>
            {Object.entries(main.metrics).map(([k, v]) => (
              <div key={k}>
                {k}: {String(v)}
              </div>
            ))}
            <button onClick={() => setTab("unseen")}>Try a new task</button>
          </>
        )}

        {tab === "unseen" &&
          (unseen ? (
            <>
              <div>New task solved in {unseen.attempts} tries.</div>
              <button onClick={onComplete}>Finish stage</button>
            </>
          ) : (
            <Play phase="unseen" onDone={(r) => setUnseen(r)} />
          ))}
      </div>
    </div>
  );
}
