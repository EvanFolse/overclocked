"use client";
import { TutorBot } from "./tutor/TutorBot";
import { moodFor } from "./tutor/script";
import type { Mood } from "./types";

const TAG_COLOR: Record<string, string> = {
  TIP: "#38bdf8", GOAL: "#8b7cf6", EVENT: "#fbbf24", SYMPTOM: "#f87171",
  NOTE: "#9fb3d1", HINT: "#38bdf8", WHY: "#34d399", RESULT: "#34d399", UNSEEN: "#f472b6",
};

interface Props {
  tag: string;
  text: string;
  /** colour of the tag pill (e.g. the colour of the part being described) */
  color?: string;
  mood?: Mood;
  /** what the player should do next */
  goal: string;
}

/** The Tutor "docked" beside the play area: GOAL line on top, speech bubble below. */
export function TutorBubble({ tag, text, color, mood, goal }: Props) {
  const pill = color ?? TAG_COLOR[tag] ?? "#9fb3d1";
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 18, padding: "10px 22px 10px 16px",
        borderRadius: 18, border: "1px solid rgba(56,189,248,0.35)",
        background: "rgba(8,16,40,0.82)", boxShadow: "0 0 24px rgba(56,189,248,0.12)",
      }}
    >
      <style>{`@keyframes tbIn { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: none;} }`}</style>
      <TutorBot bust size={96} mood={mood ?? moodFor(tag)} />

      <div style={{ display: "grid", gap: 8, flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              padding: "3px 12px", borderRadius: 999, background: "#8b7cf6", color: "#04101f",
              fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
            }}
          >
            GOAL
          </span>
          <span style={{ fontSize: "clamp(15px, 1.5vw, 19px)", fontWeight: 700 }}>{goal}</span>
        </div>

        <div
          key={tag + text}
          style={{
            position: "relative", display: "flex", alignItems: "center", gap: 12,
            padding: "8px 14px", borderRadius: 12, animation: "tbIn 0.3s ease-out",
            background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.25)",
          }}
        >
          <span
            style={{
              position: "absolute", left: -7, top: "50%", marginTop: -6, width: 0, height: 0,
              borderTop: "6px solid transparent", borderBottom: "6px solid transparent",
              borderRight: "7px solid rgba(56,189,248,0.25)",
            }}
          />
          <span
            style={{
              padding: "3px 12px", borderRadius: 999, background: pill, color: "#04101f",
              fontSize: 11, fontWeight: 800, letterSpacing: 1.5, whiteSpace: "nowrap",
            }}
          >
            {tag}
          </span>
          <span style={{ fontSize: "clamp(14px, 1.4vw, 18px)", fontWeight: 600, lineHeight: 1.35 }}>{text}</span>
        </div>
      </div>
    </div>
  );
}
