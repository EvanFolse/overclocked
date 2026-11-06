"use client";
import { useEffect } from "react";
import { TutorBot } from "./tutor/TutorBot";
import { BRIEFS } from "./tutor/script";

const ROWS = [
  { key: "mission", label: "MISSION", color: "#8b7cf6" },
  { key: "how", label: "HOW TO PLAY", color: "#38bdf8" },
  { key: "learn", label: "YOU'LL LEARN", color: "#34d399" },
] as const;

interface Props {
  stageId: number;
  title: string;
  onStart: () => void;
}

/** The humanoid Tutor appears first and briefs the player, then the stage begins. */
export function BriefingScreen({ stageId, title, onStart }: Props) {
  const brief = BRIEFS[stageId];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") onStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStart]);

  if (!brief) return null;

  return (
    <div
      style={{
        position: "absolute", inset: 0, zIndex: 5, padding: 24,
        background: "rgba(4,9,22,0.97)", display: "grid", placeItems: "center",
      }}
    >
      <style>{`
        @keyframes brRobot { from { opacity: 0; transform: translateX(-40px);} to { opacity: 1; transform: none;} }
        @keyframes brIn { from { opacity: 0; transform: translateY(10px);} to { opacity: 1; transform: none;} }
        @media (prefers-reduced-motion: reduce) { .br-anim { animation: none !important; opacity: 1 !important; } }
      `}</style>

      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap",
          gap: "clamp(20px, 4vw, 64px)", maxWidth: 1100,
        }}
      >
        <div className="br-anim" style={{ animation: "brRobot 0.7s ease-out 2.0s both" }}>
          <TutorBot size={280} wave />
        </div>

        <div
          className="br-anim"
          style={{
            position: "relative", width: "min(620px, 100%)", padding: "26px 30px", borderRadius: 22,
            border: "1.5px solid rgba(56,189,248,0.5)", background: "rgba(8,16,40,0.92)",
            boxShadow: "0 0 40px rgba(56,189,248,0.15)", animation: "brIn 0.6s ease-out 2.4s both",
          }}
        >
          <span
            style={{
              position: "absolute", left: -10, top: "45%", width: 0, height: 0,
              borderTop: "10px solid transparent", borderBottom: "10px solid transparent",
              borderRight: "10px solid rgba(56,189,248,0.5)",
            }}
          />
          <div style={{ fontSize: 12, letterSpacing: 3, color: "#38bdf8", fontWeight: 800 }}>
            TUTOR · STAGE {stageId} · {title.toUpperCase()}
          </div>

          <div style={{ display: "grid", gap: 16, margin: "18px 0 24px" }}>
            {ROWS.map((r, i) => (
              <div key={r.key} className="br-anim" style={{ animation: `brIn 0.5s ease-out ${2.8 + i * 0.8}s both` }}>
                <span
                  style={{
                    display: "inline-block", padding: "3px 12px", borderRadius: 999, background: r.color,
                    color: "#04101f", fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
                  }}
                >
                  {r.label}
                </span>
                <div style={{ marginTop: 8, fontSize: "clamp(16px, 1.7vw, 22px)", lineHeight: 1.4 }}>
                  {brief[r.key]}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={onStart}
              style={{
                padding: "12px 34px", borderRadius: 12, border: "none", cursor: "pointer",
                background: "#5fd3f0", color: "#04101f", fontWeight: 800, letterSpacing: 2, fontSize: 14,
                boxShadow: "0 0 24px rgba(95,211,240,0.4)",
              }}
            >
              {"LET'S GO ▶"}
            </button>
            <span style={{ fontSize: 12, opacity: 0.55 }}>or press Enter</span>
          </div>
        </div>
      </div>
    </div>
  );
}
