"use client";

import { STAGE_LABELS, UPGRADES, getUpgradeCost } from "@/data/upgrades";
import { formatMoney } from "@/lib/format";
import { isUpgradeUnlocked } from "@/lib/gameLogic";
import type { ArchitectureStage, GameState, UpgradeId } from "@/types/game";

interface UpgradePanelProps {
  state: GameState;
  onBuy: (id: UpgradeId) => void;
  onUnlockQuiz: () => void;
  /** Drawer uses borderless embedded layout */
  embedded?: boolean;
}

const STAGE_ORDER: ArchitectureStage[] = [
  "basic",
  "memory",
  "pipeline",
  "hazards",
  "branch",
  "multicore",
];

export function UpgradePanel({
  state,
  onBuy,
  onUnlockQuiz,
  embedded = false,
}: UpgradePanelProps) {
  const list = (
    <ul className={`flex flex-col gap-3 ${embedded ? "" : "max-h-[40rem] overflow-y-auto pr-1"}`}>
      {STAGE_ORDER.map((stage) => {
        const stageUpgrades = UPGRADES.filter((u) => u.stage === stage);
        if (stageUpgrades.length === 0) return null;

        return (
          <li key={stage} className="flex flex-col gap-2">
            <p
              className={`sticky top-0 z-[1] py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-violet backdrop-blur ${
                embedded ? "bg-panel/95" : "bg-panel/95"
              }`}
            >
              {STAGE_LABELS[stage]}
            </p>
            {stageUpgrades.map((upgrade) => {
              const level = state.upgradeLevels[upgrade.id] ?? 0;
              const cost = getUpgradeCost(upgrade, level);
              const unlocked = isUpgradeUnlocked(state, upgrade.id);
              const canAfford = state.money >= cost;
              const canBuy = unlocked && canAfford;
              const currentSpec = upgrade.formatSpec(level);
              const nextSpec = upgrade.formatSpec(level + 1);

              return (
                <div
                  key={upgrade.id}
                  className={`rounded-xl border p-3 transition ${
                    unlocked
                      ? "border-edge bg-panel-muted"
                      : "border-edge/60 bg-panel opacity-90"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-mono text-sm font-semibold text-foreground">
                          {upgrade.name}
                        </h3>
                        <span className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] text-accent-text">
                          Lv {level}
                        </span>
                        {!unlocked && (
                          <span className="rounded bg-warning/15 px-1.5 py-0.5 font-mono text-[10px] text-warning">
                            Locked
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">
                        {upgrade.category}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {upgrade.description}
                      </p>
                      <p className="mt-2 font-mono text-[11px] text-accent-text">
                        Now: {currentSpec}
                        {unlocked && (
                          <span className="text-muted"> → Next: {nextSpec}</span>
                        )}
                      </p>
                      {!unlocked && (
                        <p className="mt-1 text-[11px] text-warning">
                          {upgrade.unlockHint}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="font-mono text-sm text-foreground tabular-nums">
                        {formatMoney(cost)}
                      </p>
                      {unlocked ? (
                        <button
                          type="button"
                          disabled={!canBuy}
                          onClick={() => onBuy(upgrade.id)}
                          className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                            canBuy
                              ? "border border-accent/50 bg-accent-soft text-accent-text hover:opacity-90"
                              : "cursor-not-allowed border border-edge bg-panel text-muted"
                          }`}
                        >
                          Buy
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onUnlockQuiz}
                          className="rounded-lg border border-violet/40 bg-violet-soft px-3 py-1.5 font-mono text-xs font-semibold text-violet transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-violet/40"
                        >
                          Diagnose
                        </button>
                      )}
                    </div>
                  </div>

                  {unlocked && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-edge/40">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-success transition-all duration-500"
                        style={{ width: `${Math.min(100, (level / 20) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </li>
        );
      })}
    </ul>
  );

  if (embedded) {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-accent-text">
            Upgrades
          </h2>
          <p className="mt-1 text-xs text-muted">
            Install components to raise clock, hit rate, pipeline efficiency, and cores.
          </p>
        </div>
        {list}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-edge bg-panel p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-accent-text">
          CPU Architecture Path
        </h2>
        <p className="text-xs text-muted">
          Upgrades change clock, CPI, cache hits, prediction, and cores — which drive
          Compute Points.
        </p>
      </div>
      {list}
    </section>
  );
}
