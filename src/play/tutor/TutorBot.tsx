"use client";
import type { Mood } from "./script";

const EYE = "#8be3ff";

export function TutorBot({ size = 56, mood = "idle" }: { size?: number; mood?: Mood }) {
  const antenna = mood === "oops" ? "#f87171" : mood === "think" ? "#fbbf24" : "#38bdf8";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden style={{ flexShrink: 0 }}>
      <style>{`
        @keyframes tbBlink { 0%,93%,100% { transform: scaleY(1);} 96% { transform: scaleY(0.1);} }
        @keyframes tbPulse { 0%,100% { opacity: 0.5;} 50% { opacity: 1;} }
        @keyframes tbHop { 0%,100% { transform: translateY(0);} 40% { transform: translateY(-5px);} }
        .tb-eye { transform-box: fill-box; transform-origin: center; animation: tbBlink 4.5s infinite; }
        .tb-ant { animation: tbPulse 1.8s ease-in-out infinite; }
        .tb-hop { animation: tbHop 0.7s ease-in-out 2; }
        @media (prefers-reduced-motion: reduce) { .tb-eye, .tb-ant, .tb-hop { animation: none; } }
      `}</style>
      <g className={mood === "cheer" ? "tb-hop" : undefined}>
        <line x1="32" y1="14" x2="32" y2="7" stroke={antenna} strokeWidth="2" />
        <circle className="tb-ant" cx="32" cy="5" r="3.2" fill={antenna} />
        {[22, 28, 34].map((y) => (
          <g key={y}>
            <rect x="3" y={y} width="7" height="3" rx="1.5" fill="#1b88c9" />
            <rect x="54" y={y} width="7" height="3" rx="1.5" fill="#1b88c9" />
          </g>
        ))}
        <rect x="10" y="14" width="44" height="38" rx="11" fill="#0b2147" stroke={mood === "oops" ? "#f87171" : "#38bdf8"} strokeWidth="2" />

        {mood === "cheer" ? (
          <>
            <path d="M19 33 Q23.5 25 28 33" stroke={EYE} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M36 33 Q40.5 25 45 33" stroke={EYE} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M22 41 Q32 53 42 41 Z" fill={EYE} />
          </>
        ) : mood === "oops" ? (
          <>
            <line x1="18" y1="22" x2="28" y2="25" stroke={EYE} strokeWidth="2.2" strokeLinecap="round" />
            <line x1="46" y1="22" x2="36" y2="25" stroke={EYE} strokeWidth="2.2" strokeLinecap="round" />
            <rect className="tb-eye" x="20" y="28" width="7" height="11" rx="3.5" fill={EYE} />
            <rect className="tb-eye" x="37" y="28" width="7" height="11" rx="3.5" fill={EYE} />
            <path d="M24 46 Q28 42 32 46 T40 46" stroke={EYE} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </>
        ) : mood === "think" ? (
          <>
            <rect className="tb-eye" x="21" y="24" width="8" height="10" rx="4" fill={EYE} />
            <rect className="tb-eye" x="38" y="24" width="8" height="10" rx="4" fill={EYE} />
            <circle cx="36" cy="44" r="3" fill="none" stroke={EYE} strokeWidth="2" />
          </>
        ) : (
          <>
            <rect className="tb-eye" x="19" y="26" width="9" height="11" rx="4" fill={EYE} />
            <rect className="tb-eye" x="36" y="26" width="9" height="11" rx="4" fill={EYE} />
            <path d="M24 43 Q32 49 40 43" stroke={EYE} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </>
        )}
      </g>
    </svg>
  );
}
