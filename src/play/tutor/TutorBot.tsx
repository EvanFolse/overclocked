"use client";
import type { Mood } from "../types";

const EYE = "#8be3ff";
const BODY = "#0b2147";
const METAL = "#1b88c9";

interface Props {
  /** height in px */
  size?: number;
  mood?: Mood;
  /** only head and torso (for the dock beside the play area) */
  bust?: boolean;
  /** raise the right arm and wave (for the opening briefing) */
  wave?: boolean;
}

/** Placeholder humanoid Tutor. Replace this file (or its art) any time; the props stay the same. */
export function TutorBot({ size = 120, mood = "idle", bust = false, wave = false }: Props) {
  const vbH = bust ? 142 : 192;
  const accent =
    mood === "oops" ? "#f87171" : mood === "think" ? "#fbbf24" : mood === "cheer" ? "#34d399" : "#38bdf8";

  return (
    <svg
      width={(size * 120) / vbH}
      height={size}
      viewBox={`0 0 120 ${vbH}`}
      aria-hidden
      style={{ flexShrink: 0, overflow: "visible" }}
    >
      <style>{`
        @keyframes tbBlink { 0%,93%,100% { transform: scaleY(1);} 96% { transform: scaleY(0.1);} }
        @keyframes tbPulse { 0%,100% { opacity: 0.5;} 50% { opacity: 1;} }
        @keyframes tbFloat { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-3px);} }
        @keyframes tbHop { 0%,100% { transform: translateY(0);} 40% { transform: translateY(-8px);} }
        @keyframes tbWave { 0%,100% { transform: rotate(-135deg);} 50% { transform: rotate(-165deg);} }
        .tb-eye { transform-box: fill-box; transform-origin: center; animation: tbBlink 4.5s infinite; }
        .tb-pulse { animation: tbPulse 1.8s ease-in-out infinite; }
        .tb-float { animation: tbFloat 3.2s ease-in-out infinite; }
        .tb-hop { animation: tbHop 0.6s ease-in-out 2; }
        .tb-wave { transform-origin: 97px 88px; animation: tbWave 0.9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .tb-eye, .tb-pulse, .tb-float, .tb-hop, .tb-wave { animation: none; }
        }
      `}</style>

      <g className="tb-float">
        <g className={mood === "cheer" ? "tb-hop" : undefined}>
          {/* legs and feet */}
          {!bust && (
            <>
              <rect x="44" y="138" width="13" height="36" rx="6" fill={BODY} stroke={METAL} strokeWidth="2" />
              <rect x="63" y="138" width="13" height="36" rx="6" fill={BODY} stroke={METAL} strokeWidth="2" />
              <rect x="39" y="170" width="22" height="11" rx="5.5" fill={METAL} />
              <rect x="59" y="170" width="22" height="11" rx="5.5" fill={METAL} />
            </>
          )}

          {/* left arm */}
          <rect x="16" y="84" width="14" height="46" rx="7" fill={BODY} stroke={METAL} strokeWidth="2" />
          <circle cx="23" cy="134" r="7" fill={METAL} />

          {/* right arm (waves when asked) */}
          <g className={wave ? "tb-wave" : undefined}>
            <rect x="90" y="84" width="14" height="46" rx="7" fill={BODY} stroke={METAL} strokeWidth="2" />
            <circle cx="97" cy="134" r="7" fill={METAL} />
          </g>

          {/* torso with chest light */}
          <rect x="34" y="80" width="52" height="56" rx="12" fill={BODY} stroke={accent} strokeWidth="2" />
          <rect className="tb-pulse" x="48" y="94" width="24" height="24" rx="6" fill={accent} />
          <rect x="46" y="124" width="28" height="3" rx="1.5" fill={METAL} />

          {/* neck */}
          <rect x="53" y="72" width="14" height="9" fill={METAL} />

          {/* antenna */}
          <line x1="60" y1="22" x2="60" y2="12" stroke={accent} strokeWidth="2" />
          <circle className="tb-pulse" cx="60" cy="9" r="4" fill={accent} />

          {/* ear pins */}
          {[36, 44].map((y) => (
            <g key={y}>
              <rect x="22" y={y} width="8" height="4" rx="2" fill={METAL} />
              <rect x="90" y={y} width="8" height="4" rx="2" fill={METAL} />
            </g>
          ))}

          {/* head */}
          <rect x="30" y="22" width="60" height="50" rx="14" fill={BODY} stroke={mood === "oops" ? "#f87171" : "#38bdf8"} strokeWidth="2" />

          {/* face */}
          {mood === "cheer" ? (
            <>
              <path d="M42 47 Q46.5 37 51 47" stroke={EYE} strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M69 47 Q73.5 37 78 47" stroke={EYE} strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M50 56 Q60 70 70 56 Z" fill={EYE} />
            </>
          ) : mood === "oops" ? (
            <>
              <line x1="40" y1="31" x2="52" y2="35" stroke={EYE} strokeWidth="2.2" strokeLinecap="round" />
              <line x1="80" y1="31" x2="68" y2="35" stroke={EYE} strokeWidth="2.2" strokeLinecap="round" />
              <rect className="tb-eye" x="43" y="38" width="8" height="11" rx="4" fill={EYE} />
              <rect className="tb-eye" x="69" y="38" width="8" height="11" rx="4" fill={EYE} />
              <path d="M50 63 Q55 58 60 63 T70 63" stroke={EYE} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            </>
          ) : mood === "think" ? (
            <>
              <rect className="tb-eye" x="42" y="32" width="9" height="11" rx="4.5" fill={EYE} />
              <rect className="tb-eye" x="69" y="32" width="9" height="11" rx="4.5" fill={EYE} />
              <circle cx="66" cy="60" r="3" fill="none" stroke={EYE} strokeWidth="2" />
            </>
          ) : (
            <>
              <rect className="tb-eye" x="42" y="36" width="9" height="12" rx="4.5" fill={EYE} />
              <rect className="tb-eye" x="69" y="36" width="9" height="12" rx="4.5" fill={EYE} />
              <path d="M48 58 Q60 66 72 58" stroke={EYE} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            </>
          )}
        </g>
      </g>
    </svg>
  );
}
