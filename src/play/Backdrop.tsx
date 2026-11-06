"use client";
import { useMemo } from "react";

function makeStars(count: number) {
  let seed = 11;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    x: rnd() * 100, y: rnd() * 100, size: 1 + rnd() * 1.8,
    low: 0.1 + rnd() * 0.2, high: 0.4 + rnd() * 0.5,
    duration: 2.5 + rnd() * 3.5, delay: rnd() * 5,
  }));
}

/** Night-sky background with a perspective grid floor (same look as the intro). */
export function Backdrop() {
  const stars = useMemo(() => makeStars(70), []);
  return (
    <div
      aria-hidden
      style={{
        position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 30%, #0b1d45 0%, #060d24 55%, #040916 100%)",
      }}
    >
      <style>{`
        @keyframes bdTwinkle { 0%,100% { opacity: var(--lo);} 50% { opacity: var(--hi);} }
        @media (prefers-reduced-motion: reduce) { .bd-star { animation: none !important; } }
      `}</style>
      {stars.map((s, i) => (
        <span
          key={i}
          className="bd-star"
          style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
            borderRadius: "50%", background: "#9fc6ff",
            ["--lo" as string]: s.low, ["--hi" as string]: s.high,
            animation: `bdTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute", left: "-20%", right: "-20%", bottom: 0, height: "45%",
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.12) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          transform: "perspective(420px) rotateX(62deg)", transformOrigin: "bottom",
          maskImage: "linear-gradient(to top, black 10%, transparent 90%)",
          WebkitMaskImage: "linear-gradient(to top, black 10%, transparent 90%)",
        }}
      />
    </div>
  );
}
