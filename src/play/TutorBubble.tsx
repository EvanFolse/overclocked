"use client";
import { TutorBot } from "./tutor/TutorBot";
import { BRIEFS, moodFor } from "./tutor/script";

const TAG_COLOR: Record<string, string> = {
  TIP: "#38bdf8", GOAL: "#8b7cf6", EVENT: "#fbbf24", SYMPTOM: "#f87171",
  NOTE: "#9fb3d1", HINT: "#38bdf8", WHY: "#34d399", RESULT: "#34d399", UNSEEN: "#f472b6",
};

interface Props {
  tag: string;
  text: string;
  /** when given, the Tutor adds a one-line mission brief under the TIP */
  stageId?: number;
}

export function TutorBubble({ tag, text, stageId }: Props) {
  const color = TAG_COLOR[tag] ?? "#9fb3d1";
  const brief = tag === "TIP" && stageId ? BRIEFS[stageId] : undefined;
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 16, padding: "12px 20px",
        borderRadius: 18, border: "1px solid rgba(56,189,248,0.35)",
        background: "rgba(8,16,40,0.82)", boxShadow: "0 0 24px rgba(56,189,248,0.12)",
      }}
    >
      <TutorBot mood={moodFor(tag)} />
      <style>{`@keyframes tbIn { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: none;} }`}</style>
      <div key={tag + text} style={{ display: "grid", gap: 6, animation: "tbIn 0.35s ease-out" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              padding: "4px 14px", borderRadius: 999, background: color, color: "#04101f",
              fontSize: 12, fontWeight: 800, letterSpacing: 1.5, whiteSpace: "nowrap",
            }}
          >
            {tag}
          </span>
          <span style={{ fontSize: "clamp(15px, 1.5vw, 20px)", fontWeight: 600, lineHeight: 1.35 }}>{text}</span>
        </div>
        {brief && (
          <div style={{ fontSize: 13, opacity: 0.75, paddingLeft: 2 }}>
            <b style={{ color: "#8b7cf6" }}>Mission:</b> {brief.doing}{" "}
            <b style={{ color: "#34d399" }}>You'll learn:</b> {brief.learning}
          </div>
        )}
      </div>
    </div>
  );
}
