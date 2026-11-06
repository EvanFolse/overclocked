"use client";
import { useEffect, useMemo, useState } from "react";

const KEY = "overclocked-intro-seen-v2";

const STEPS = [
  { tag: "TIP", color: "#38bdf8", text: "a short hint, not the answer" },
  { tag: "PLAY", color: "#8b7cf6", text: "build, run, fix, tune" },
  { tag: "WHY", color: "#34d399", text: "the reason shows up after you act" },
  { tag: "FEEDBACK", color: "#fbbf24", text: "real metrics, not a grade" },
  { tag: "UNSEEN", color: "#f472b6", text: "a brand-new task to test transfer" },
];

const CARD_START = 0.8; // seconds before the first card appears
const CARD_GAP = 0.85; // seconds between cards (card, then the arrow draws, then the next card)
const AFTER_CARDS = CARD_START + CARD_GAP * STEPS.length; // text + button fade in here

/** Deterministic star field (no Math.random, so it never changes between renders) */
function makeStars(count: number) {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  return Array.from({ length: count }, (_, i) => ({
    x: rnd() * 100,
    y: rnd() * 100,
    size: 1 + rnd() * 2,
    low: 0.1 + rnd() * 0.25,
    high: 0.55 + rnd() * 0.45,
    duration: 2 + rnd() * 3.5,
    delay: rnd() * 5,
    bright: i % 9 === 0, // every 9th star is a glowing one
  }));
}

const PIN_POSITIONS = Array.from({ length: 9 }, (_, i) => 10 + i * 10);

function Chip() {
  const pin = "#1b88c9";
  const base = { position: "absolute", background: pin, borderRadius: 2 } as const;
  return (
    <div
      className="intro-chip"
      style={{
        position: "relative",
        width: "clamp(120px, 16vw, 190px)",
        aspectRatio: "1 / 1",
        borderRadius: 28,
        background: "linear-gradient(160deg, #0b2147, #071230)",
        border: "2px solid #2a8fd0",
      }}
    >
      {PIN_POSITIONS.map((p) => (
        <span key={`t${p}`} className="intro-pin" style={{ ...base, top: -11, left: `${p}%`, width: 5, height: 11, transform: "translateX(-50%)", animationDelay: `${p / 40}s` }} />
      ))}
      {PIN_POSITIONS.map((p) => (
        <span key={`b${p}`} className="intro-pin" style={{ ...base, bottom: -11, left: `${p}%`, width: 5, height: 11, transform: "translateX(-50%)", animationDelay: `${p / 40}s` }} />
      ))}
      {PIN_POSITIONS.map((p) => (
        <span key={`l${p}`} className="intro-pin" style={{ ...base, left: -11, top: `${p}%`, width: 11, height: 5, transform: "translateY(-50%)", animationDelay: `${p / 40}s` }} />
      ))}
      {PIN_POSITIONS.map((p) => (
        <span key={`r${p}`} className="intro-pin" style={{ ...base, right: -11, top: `${p}%`, width: 11, height: 5, transform: "translateY(-50%)", animationDelay: `${p / 40}s` }} />
      ))}
      <div
        className="intro-core"
        style={{ position: "absolute", inset: "27%", borderRadius: 18, background: "#dff4ff" }}
      />
    </div>
  );
}

export function IntroScreen() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(-1); // card that currently has the "flow" highlight
  const stars = useMemo(() => makeStars(90), []);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read sessionStorage after mount
      setVisible(window.sessionStorage.getItem(KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  // After all cards have appeared, a highlight runs through them in a loop.
  useEffect(() => {
    if (!visible) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const startTimer = setTimeout(() => {
      setActive(0);
      interval = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 1100);
    }, (AFTER_CARDS + 0.3) * 1000);
    return () => {
      clearTimeout(startTimer);
      if (interval) clearInterval(interval);
    };
  }, [visible]);

  function start() {
    try {
      window.sessionStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 60, overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 38%, #0b1d45 0%, #060d24 55%, #040916 100%)",
        color: "#e6f1ff", display: "grid", placeItems: "center",
      }}
    >
      <style>{`
        @keyframes introTwinkle { 0%,100% { opacity: var(--lo); transform: scale(0.8);} 50% { opacity: var(--hi); transform: scale(1.25);} }
        @keyframes introRise { from { opacity: 0; transform: translateY(14px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes introFade { from { opacity: 0;} to { opacity: 1;} }
        @keyframes introChipGlow {
          0%,100% { box-shadow: 0 0 45px rgba(56,189,248,0.30), inset 0 0 22px rgba(56,189,248,0.12); }
          50% { box-shadow: 0 0 105px rgba(56,189,248,0.80), inset 0 0 42px rgba(56,189,248,0.34); }
        }
        @keyframes introCore {
          0%,100% { opacity: 0.55; box-shadow: 0 0 22px rgba(155,228,255,0.45), 0 0 50px rgba(56,189,248,0.25); transform: scale(0.97);}
          50% { opacity: 1; box-shadow: 0 0 58px rgba(190,240,255,1), 0 0 130px rgba(56,189,248,0.75); transform: scale(1.03);}
        }
        @keyframes introPin { 0%,100% { opacity: 0.45;} 50% { opacity: 1;} }
        @keyframes introDraw { from { transform: scaleX(0); opacity: 0;} to { transform: scaleX(1); opacity: 1;} }
        .intro-chip { animation: introChipGlow 2.8s ease-in-out infinite; }
        .intro-core { animation: introCore 2.8s ease-in-out infinite; }
        .intro-pin { animation: introPin 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .intro-chip, .intro-core, .intro-pin, .intro-star, .intro-card, .intro-fade, .intro-arrow { animation: none !important; opacity: 1 !important; }
        }
      `}</style>

      {/* twinkling stars */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="intro-star"
          style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
            width: s.bright ? s.size + 2 : s.size, height: s.bright ? s.size + 2 : s.size,
            borderRadius: "50%", background: s.bright ? "#dff4ff" : "#9fc6ff",
            boxShadow: s.bright ? "0 0 10px 2px rgba(159,198,255,0.8)" : "none",
            ["--lo" as string]: s.low, ["--hi" as string]: s.high,
            animation: `introTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* perspective grid floor */}
      <div
        style={{
          position: "absolute", left: "-20%", right: "-20%", bottom: 0, height: "48%",
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.16) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          transform: "perspective(420px) rotateX(62deg)",
          transformOrigin: "bottom",
          maskImage: "linear-gradient(to top, black 10%, transparent 90%)",
          WebkitMaskImage: "linear-gradient(to top, black 10%, transparent 90%)",
        }}
      />

      {/* content */}
      <div
        style={{
          position: "relative", display: "grid", justifyItems: "center",
          gap: "clamp(14px, 2.4vh, 26px)", padding: "24px", textAlign: "center",
        }}
      >
        <Chip />

        <h1
          className="intro-fade"
          style={{
            margin: "clamp(14px, 3vh, 32px) 0 0", fontSize: "clamp(40px, 7vw, 84px)",
            fontWeight: 800, letterSpacing: 1, lineHeight: 1,
            animation: "introRise 0.8s ease-out both",
          }}
        >
          CPU BUILDER
        </h1>
        <p
          className="intro-fade"
          style={{
            margin: 0, fontSize: "clamp(15px, 2vw, 26px)", color: "#38bdf8", fontWeight: 600,
            animation: "introRise 0.8s ease-out 0.25s both",
          }}
        >
          Learn by doing.&nbsp; Your actions are the evidence.
        </p>

        {/* five steps appear one after another, then a highlight runs through them */}
        <div style={{ display: "flex", gap: 8, alignItems: "stretch", justifyContent: "center", flexWrap: "wrap", marginTop: "clamp(10px, 3vh, 36px)" }}>
          {STEPS.map((s, i) => {
            const delay = CARD_START + i * CARD_GAP;
            const isActive = active === i;
            return (
              <div key={s.tag} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  className="intro-card"
                  style={{
                    width: "clamp(150px, 15vw, 205px)", padding: "14px 16px", textAlign: "left",
                    borderRadius: 16, border: `1.5px solid ${s.color}`,
                    background: isActive ? "rgba(16,30,66,0.95)" : "rgba(8,16,40,0.85)",
                    boxShadow: isActive ? `0 0 38px ${s.color}88` : `0 0 18px ${s.color}30`,
                    transform: isActive ? "translateY(-4px) scale(1.03)" : "none",
                    transition: "box-shadow 0.5s, transform 0.5s, background 0.5s",
                    animation: `introRise 0.7s ease-out ${delay}s both`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        display: "grid", placeItems: "center", width: 24, height: 24, borderRadius: "50%",
                        border: `2px solid ${s.color}`, color: s.color, fontSize: 12, fontWeight: 800,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        display: "inline-block", padding: "3px 12px", borderRadius: 999,
                        background: s.color, color: "#04101f", fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
                      }}
                    >
                      {s.tag}
                    </span>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 15, lineHeight: 1.3 }}>{s.text}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="intro-arrow"
                    style={{
                      display: "flex", alignItems: "center", width: "clamp(22px, 2.6vw, 40px)",
                      transformOrigin: "left center",
                      animation: `introDraw 0.4s ease-out ${delay + 0.4}s both`,
                    }}
                  >
                    <span style={{ flex: 1, height: 2, background: `linear-gradient(90deg, ${s.color}, ${STEPS[i + 1].color})` }} />
                    <span
                      style={{
                        width: 0, height: 0, borderTop: "5px solid transparent",
                        borderBottom: "5px solid transparent", borderLeft: `8px solid ${STEPS[i + 1].color}`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="intro-fade"
          style={{ display: "grid", gap: 8, animation: `introFade 0.8s ease-out ${AFTER_CARDS}s both` }}
        >
          <div style={{ fontSize: "clamp(13px, 1.3vw, 17px)", opacity: 0.9 }}>
            Five stages · five different ways to play · every result is a real CPU metric
          </div>
          <div style={{ fontSize: "clamp(13px, 1.3vw, 17px)", color: "#34d399", fontWeight: 600 }}>
            Decisions → performance → CP/s → new content
          </div>
        </div>

        <button
          className="intro-fade"
          onClick={start}
          style={{
            marginTop: 6, cursor: "pointer", padding: "13px 48px", borderRadius: 12,
            border: "none", background: "#5fd3f0", color: "#04101f", fontWeight: 800,
            letterSpacing: 3, fontSize: 14, boxShadow: "0 0 28px rgba(95,211,240,0.45)",
            animation: `introFade 0.8s ease-out ${AFTER_CARDS + 0.3}s both`,
          }}
        >
          START
        </button>
      </div>
    </div>
  );
}
