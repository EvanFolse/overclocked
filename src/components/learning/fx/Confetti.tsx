"use client";

import { useState, type CSSProperties } from "react";

const COLORS = ["#0891b2", "#7c3aed", "#059669", "#d97706", "#ec4899", "#3b82f6"];

/** One-shot confetti burst. Mount it with a `key` to fire it again. */
export function Confetti({ count = 28 }: { count?: number }) {
  const [bits] = useState(() =>
    Array.from({ length: count }, (_, i) => {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const d = 90 + Math.random() * 130;
      const w = 6 + Math.random() * 6;
      return {
        id: i,
        x: Math.cos(a) * d,
        y: Math.sin(a) * d - 60,
        r: Math.random() * 720 - 360,
        c: COLORS[i % COLORS.length]!,
        delay: Math.random() * 80,
        w,
      };
    })
  );

  return (
    <div aria-hidden className="pointer-events-none fixed left-1/2 top-1/3 z-[70]">
      {bits.map((b) => (
        <span
          key={b.id}
          className="fx-confetti"
          style={
            {
              "--x": `${b.x}px`,
              "--y": `${b.y}px`,
              "--r": `${b.r}deg`,
              background: b.c,
              width: b.w,
              height: b.w * 0.6,
              animationDelay: `${b.delay}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
