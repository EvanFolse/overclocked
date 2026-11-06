"use client";
import { useEffect, useState } from "react";

const KEY = "overclocked-intro-seen-v2";

const STEPS = [
  { tag: "TIP", color: "#38bdf8", text: "a short hint, not the answer" },
  { tag: "PLAY", color: "#a78bfa", text: "build, run, fix, tune" },
  { tag: "WHY", color: "#34d399", text: "the reason shows up after you act" },
  { tag: "FEEDBACK", color: "#fbbf24", text: "real metrics, not a grade" },
  { tag: "UNSEEN", color: "#f472b6", text: "a brand-new task to test transfer" },
];

export function IntroScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read sessionStorage after mount
      setVisible(window.sessionStorage.getItem(KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  function start() {
    try {
      window.sessionStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 60, pointerEvents: "none",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        color: "#e6f1ff", textAlign: "center",
      }}
    >
      {/* Top: title. The middle stays empty so the 3D CPU shows through. */}
      <div
        style={{
          padding: "48px 24px 56px",
          background: "linear-gradient(to bottom, rgba(2,6,18,0.92), rgba(2,6,18,0))",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, letterSpacing: 1 }}>
          CPU BUILDER
        </h1>
        <p style={{ margin: "12px 0 0", fontSize: "clamp(14px, 1.8vw, 22px)", color: "#38bdf8", fontWeight: 600 }}>
          Learn by doing. No quiz questions. Your actions are the evidence.
        </p>
      </div>

      {/* Bottom: the five-step loop and the start button */}
      <div
        style={{
          padding: "72px 24px 32px",
          background: "linear-gradient(to top, rgba(2,6,18,0.95), rgba(2,6,18,0))",
          display: "grid", gap: 18, justifyItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "stretch", justifyContent: "center", flexWrap: "wrap" }}>
          {STEPS.map((s, i) => (
            <div key={s.tag} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 168, padding: "12px 14px", textAlign: "left", borderRadius: 14,
                  border: `1px solid ${s.color}`, background: "rgba(5,11,26,0.85)",
                }}
              >
                <span
                  style={{
                    display: "inline-block", padding: "2px 10px", borderRadius: 999,
                    background: s.color, color: "#04101f", fontSize: 11, fontWeight: 800, letterSpacing: 1,
                  }}
                >
                  {s.tag}
                </span>
                <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.3 }}>{s.text}</div>
              </div>
              {i < STEPS.length - 1 && <span style={{ opacity: 0.5 }}>›</span>}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 14, opacity: 0.85 }}>
          Five stages · five different ways to play · every result is a real CPU metric
        </div>
        <div style={{ fontSize: 14, color: "#34d399" }}>
          Decisions → performance → CP/s → new content
        </div>

        <button
          onClick={start}
          style={{
            pointerEvents: "auto", cursor: "pointer", padding: "12px 40px", borderRadius: 12,
            border: "none", background: "#5fd3f0", color: "#04101f", fontWeight: 800,
            letterSpacing: 3, fontSize: 14,
          }}
        >
          START
        </button>
        <div style={{ fontSize: 11, opacity: 0.5 }}>Drag to rotate · Scroll to zoom</div>
      </div>
    </div>
  );
}
