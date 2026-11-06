"use client";

const TAG_COLOR: Record<string, string> = {
  TIP: "#38bdf8", GOAL: "#8b7cf6", EVENT: "#fbbf24", SYMPTOM: "#f87171",
  NOTE: "#9fb3d1", HINT: "#38bdf8", WHY: "#34d399", RESULT: "#34d399", UNSEEN: "#f472b6",
};

/** Placeholder Tutor face. The tutor-bot branch can replace this file; the props stay the same. */
export function TutorBot({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <style>{`
        @keyframes tbBlink { 0%,93%,100% { transform: scaleY(1);} 96% { transform: scaleY(0.1);} }
        @keyframes tbPulse { 0%,100% { opacity: 0.5;} 50% { opacity: 1;} }
        .tb-eye { transform-box: fill-box; transform-origin: center; animation: tbBlink 4.5s infinite; }
        .tb-ant { animation: tbPulse 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .tb-eye, .tb-ant { animation: none; } }
      `}</style>
      <line x1="32" y1="14" x2="32" y2="7" stroke="#38bdf8" strokeWidth="2" />
      <circle className="tb-ant" cx="32" cy="5" r="3.2" fill="#38bdf8" />
      {[22, 28, 34].map((y) => (
        <g key={y}>
          <rect x="3" y={y} width="7" height="3" rx="1.5" fill="#1b88c9" />
          <rect x="54" y={y} width="7" height="3" rx="1.5" fill="#1b88c9" />
        </g>
      ))}
      <rect x="10" y="14" width="44" height="38" rx="11" fill="#0b2147" stroke="#38bdf8" strokeWidth="2" />
      <rect className="tb-eye" x="19" y="26" width="9" height="11" rx="4" fill="#8be3ff" />
      <rect className="tb-eye" x="36" y="26" width="9" height="11" rx="4" fill="#8be3ff" />
      <path d="M24 43 Q32 49 40 43" stroke="#8be3ff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function TutorBubble({ tag, text }: { tag: string; text: string }) {
  const color = TAG_COLOR[tag] ?? "#9fb3d1";
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 16, padding: "12px 20px",
        borderRadius: 18, border: "1px solid rgba(56,189,248,0.35)",
        background: "rgba(8,16,40,0.82)", boxShadow: "0 0 24px rgba(56,189,248,0.12)",
      }}
    >
      <TutorBot />
      <style>{`@keyframes tbIn { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: none;} }`}</style>
      <div key={tag + text} style={{ display: "flex", alignItems: "center", gap: 14, animation: "tbIn 0.35s ease-out" }}>
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
    </div>
  );
}
