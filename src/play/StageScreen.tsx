"use client";
import { useEffect, useState } from "react";
import { Backdrop } from "./Backdrop";
import { STAGE_COPY, STAGE_PLAYS } from "./content";
import { TutorBubble } from "./TutorBubble";
import { BriefingScreen } from "./BriefingScreen";
import type { Coach, Evidence, StageResult, StageTab } from "./types";

const TABS: StageTab[] = ["tip", "play", "why", "feedback", "unseen"];
const TAB_COLOR: Record<StageTab, string> = {
  tip: "#38bdf8", play: "#8b7cf6", why: "#34d399", feedback: "#fbbf24", unseen: "#f472b6",
};
/** Rank names by number of completed stages (first three taken from the demo video) */
const RANKS = ["SEED CHIP", "TINY CORE", "PIPELINED CORE", "CACHE CORE", "SUPER SOC"];
const EMPTY: Evidence = { attempts: 0, hints: 0, status: "WAITING FOR ACTION" };

const panel = {
  border: "1px solid rgba(56,189,248,0.22)", borderRadius: 18,
  background: "rgba(8,16,40,0.72)", backdropFilter: "blur(6px)",
} as const;
const pill = {
  display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999,
  border: "1px solid rgba(56,189,248,0.35)", background: "rgba(8,16,40,0.8)",
  fontSize: 12, letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase",
} as const;
const mainBtn = {
  padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer",
  background: "#5fd3f0", color: "#04101f", fontWeight: 800, letterSpacing: 2, fontSize: 12,
} as const;

interface Props {
  stageId: number;
  cp: number;
  cps: number;
  completedCount: number;
  onComplete: () => void;
  onExit: () => void;
}

export function StageScreen({ stageId, cp, cps, completedCount, onComplete, onExit }: Props) {
  const copy = STAGE_COPY[stageId];
  const Play = STAGE_PLAYS[stageId];

  const [tab, setTab] = useState<StageTab>("tip");
  const [main, setMain] = useState<StageResult | null>(null);
  const [unseen, setUnseen] = useState<StageResult | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [briefing, setBriefing] = useState(true);
  const [ev, setEv] = useState<Record<"main" | "unseen", Evidence>>({
    main: { ...EMPTY }, unseen: { ...EMPTY },
  });
  const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null);
  const [banner, setBanner] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setBanner(false), 2300);
    return () => clearTimeout(t);
  }, []);

  const phase: "main" | "unseen" = tab === "unseen" ? "unseen" : "main";
  const evidence = ev[phase];
  const showPanelSlot = tab === "play" || (tab === "unseen" && !unseen);
  const rankName = RANKS[Math.min(completedCount, RANKS.length - 1)];

  const msg: Coach =
    tab === "why"
      ? { tag: "WHY", text: copy.why }
      : tab === "feedback" && main
        ? { tag: "RESULT", text: `Attempts: ${main.attempts} · Hints: ${main.hints}` }
        : coach ?? { tag: "TIP", text: copy.tip };

  const goalText =
    tab === "why"
      ? "Read why it works, then continue."
      : tab === "feedback"
        ? "Check your numbers, then try the new task."
        : tab === "unseen" && unseen
          ? "Press FINISH STAGE."
          : goal ?? "Get ready!";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100, color: "#e6f1ff",
        display: "flex", flexDirection: "column", padding: "18px 28px 24px", gap: 16,
      }}
    >
      <Backdrop />
      <style>{`
        @keyframes scBanner {
          0% { opacity: 0; transform: translateX(-60px); }
          14% { opacity: 1; transform: translateX(0); }
          82% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(40px); }
        }
      `}</style>

      {/* Header / HUD */}
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 34, height: 34, borderRadius: 9, border: "2px solid #38bdf8",
                display: "grid", placeItems: "center", background: "#0b2147",
                boxShadow: "0 0 18px rgba(56,189,248,0.5)",
              }}
            >
              <span style={{ width: 14, height: 14, borderRadius: 4, background: "#8be3ff" }} />
            </span>
            <strong style={{ fontSize: 22 }}>CPU BUILDER</strong>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ ...pill, color: "#38bdf8" }}>
              Stage {stageId} · {copy.title}
            </span>
            <button onClick={onExit} style={{ ...pill, color: "#e6f1ff", cursor: "pointer" }}>
              ← Back
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={pill}>
            <span style={{ opacity: 0.6 }}>Rank</span>
            <span style={{ color: "#fbbf24" }}>{rankName}</span>
          </span>
          <span style={pill}>
            <span style={{ opacity: 0.6 }}>CP</span>
            <span style={{ color: "#fbbf24", fontSize: 16 }}>{Math.floor(cp).toLocaleString()}</span>
          </span>
          <span style={pill}>
            <span style={{ opacity: 0.6 }}>CP/s</span>
            <span style={{ color: "#34d399", fontSize: 16 }}>{cps.toFixed(1)}</span>
          </span>
          <span style={{ display: "flex", gap: 8, marginLeft: 6 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: i < completedCount ? "#38bdf8" : "#1c2a48",
                  outline: i === stageId - 1 ? "2px solid #38bdf8" : "none", outlineOffset: 2,
                }}
              />
            ))}
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          position: "relative", flex: 1, minHeight: 0, display: "grid",
          gridTemplateColumns: "minmax(0, 1.7fr) minmax(340px, 1fr)", gap: 20,
        }}
      >
        {/* Left: play area (centered) + Tutor bar */}
        <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 14, minHeight: 0 }}>
          <div style={{ ...panel, padding: 24, overflow: "auto", display: "flex", minHeight: 0 }}>
            <div style={{ margin: "auto", width: "100%", maxWidth: 1000 }}>
              <Play
                key={phase}
                phase={phase}
                tab={tab}
                panelEl={panelEl}
                onEvidence={(e) =>
                  setEv((prev) => ({ ...prev, [phase]: { ...prev[phase], ...e } }))
                }
                onCoach={setCoach}
                onGoal={setGoal}
                onAdvance={(t) => setTab((cur) => (cur === "tip" && t === "play" ? "play" : cur))}
                onDone={(r) => {
                  if (phase === "main") {
                    setMain(r);
                    setTab("why");
                  } else {
                    setUnseen(r);
                  }
                }}
              />
            </div>
          </div>
          <TutorBubble tag={msg.tag} text={msg.text} color={msg.color} mood={msg.mood} goal={goalText} />
        </div>

        {/* Right: tabs + evidence log */}
        <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 16, minHeight: 0 }}>
          <div style={{ ...panel, padding: 18, overflow: "auto" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 12, borderBottom: "1px solid rgba(56,189,248,0.15)" }}>
              {TABS.map((t) => (
                <span
                  key={t}
                  style={{
                    padding: "5px 14px", borderRadius: 999, fontSize: 11, fontWeight: 800,
                    letterSpacing: 1.5, textTransform: "uppercase",
                    border: `1px solid ${t === tab ? TAB_COLOR[t] : "rgba(160,190,230,0.25)"}`,
                    background: t === tab ? TAB_COLOR[t] : "transparent",
                    color: t === tab ? "#04101f" : "#9fb3d1",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {tab === "tip" && (
                <>
                  <Label color={TAB_COLOR.tip}>TIP · THINK OF IT LIKE THIS</Label>
                  {copy.cards ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {copy.cards.map((c) => (
                        <div
                          key={c.part}
                          style={{
                            display: "flex", alignItems: "center", gap: 16, padding: "12px 16px",
                            borderRadius: 14, border: `1px solid ${c.color}66`,
                            background: `${c.color}14`,
                          }}
                        >
                          <span style={{ fontSize: 34, width: 44, textAlign: "center" }}>{c.icon}</span>
                          <div>
                            <div style={{ fontSize: 12, letterSpacing: 1.5, opacity: 0.7 }}>{c.part}</div>
                            <div style={{ fontSize: 24, fontWeight: 800 }}>= {c.analogy}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>{copy.tip}</p>
                  )}
                </>
              )}

              {tab === "play" && <Label color={TAB_COLOR.play}>MISSION · {copy.mission}</Label>}
              {tab === "unseen" && !unseen && (
                <Label color={TAB_COLOR.unseen}>UNSEEN · A BRAND-NEW TASK</Label>
              )}
              {/* stage-specific mission UI is portaled into this slot */}
              <div ref={setPanelEl} style={{ display: showPanelSlot ? "block" : "none" }} />

              {tab === "why" && (
                <>
                  <Label color={TAB_COLOR.why}>WHY · IT WORKS BECAUSE</Label>
                  <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>{copy.why}</p>
                  <div><button style={mainBtn} onClick={() => setTab("feedback")}>CONTINUE</button></div>
                </>
              )}

              {tab === "feedback" && main && (
                <>
                  <Label color={TAB_COLOR.feedback}>FEEDBACK · REAL METRICS</Label>
                  <div style={{ display: "grid", gap: 6, fontSize: 15 }}>
                    <div>Attempts: {main.attempts} · Hints: {main.hints}</div>
                    {Object.entries(main.metrics).map(([k, v]) => (
                      <div key={k}>{k}: {String(v)}</div>
                    ))}
                  </div>
                  <div><button style={mainBtn} onClick={() => setTab("unseen")}>TRY A NEW TASK</button></div>
                </>
              )}

              {tab === "unseen" && unseen && (
                <>
                  <Label color={TAB_COLOR.unseen}>UNSEEN · RESULT</Label>
                  <p style={{ margin: 0, fontSize: 16 }}>New task solved in {unseen.attempts} tries.</p>
                  <div><button style={mainBtn} onClick={onComplete}>FINISH STAGE</button></div>
                </>
              )}
            </div>
          </div>

          <div style={{ ...panel, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6, marginBottom: 6 }}>EVIDENCE LOG</div>
              <div style={{ display: "flex", gap: 22, alignItems: "baseline" }}>
                <span><b style={{ fontSize: 28 }}>{evidence.attempts}</b> <small style={{ opacity: 0.6, letterSpacing: 1.5 }}>ATTEMPTS</small></span>
                <span><b style={{ fontSize: 28 }}>{evidence.hints}</b> <small style={{ opacity: 0.6, letterSpacing: 1.5 }}>HINTS</small></span>
              </div>
            </div>
            <span style={{ ...pill, fontSize: 11, color: "#c7d6ee" }}>{evidence.status}</span>
          </div>
        </div>
      </div>

      {briefing && (
        <BriefingScreen stageId={stageId} title={copy.title} onStart={() => setBriefing(false)} />
      )}

      {/* Intro banner sweeping across the middle */}
      {banner && (
        <div
          style={{
            position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 10,
            padding: "34px 9vw", pointerEvents: "none",
            background: "rgba(3,8,22,0.93)",
            borderTop: "1.5px solid rgba(56,189,248,0.8)", borderBottom: "1.5px solid rgba(56,189,248,0.8)",
            animation: "scBanner 2.3s ease both",
          }}
        >
          <div style={{ letterSpacing: 10, color: "#38bdf8", fontWeight: 800, fontSize: "clamp(18px, 2.4vw, 30px)" }}>
            STAGE {stageId}
          </div>
          <div style={{ fontSize: "clamp(40px, 7vw, 96px)", fontWeight: 800, lineHeight: 1.1, margin: "8px 0 14px" }}>
            {copy.title}
          </div>
          <span style={{ ...pill, color: "#b8a8ff", borderColor: "#8b7cf6", background: "rgba(139,124,246,0.15)", fontSize: 13 }}>
            Mission · {copy.mission}
          </span>
        </div>
      )}
    </div>
  );
}

function Label({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ color, fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>{children}</div>
  );
}
