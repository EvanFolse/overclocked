"use client";

import { STAGE_LABELS, UPGRADES, getUpgradeCost } from "@/data/upgrades";
import { formatMoney } from "@/lib/format";
import { isUpgradeUnlocked } from "@/lib/gameLogic";
import type { ArchitectureStage, GameState, UpgradeId } from "@/types/game";

interface UpgradePanelProps {
  state: GameState;
  onBuy: (id: UpgradeId) => void;
  onUnlockLearning: () => void;
  stalled?: boolean;
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
  onUnlockLearning,
  stalled = false,
  embedded = false,
}: UpgradePanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-accent-text">
          Upgrades
        </h2>
        <p className="mt-1 text-xs text-muted">
          {stalled
            ? "Production is paused — finish the active lesson to upgrade again."
            : "Buy meaningful silicon. Locked parts unlock through Learning checkpoints."}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {STAGE_ORDER.map((stage) => {
          const stageUpgrades = UPGRADES.filter((u) => u.stage === stage);
          if (stageUpgrades.length === 0) return null;

          return (
            <li key={stage} className="flex flex-col gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet">
                {STAGE_LABELS[stage]}
              </p>
              {stageUpgrades.map((upgrade) => {
                const level = state.upgradeLevels[upgrade.id] ?? 0;
                const cost = getUpgradeCost(upgrade, level);
                const unlocked = isUpgradeUnlocked(state, upgrade.id);
                const canBuy = unlocked && !stalled && state.money >= cost;

                return (
                  <div
                    key={upgrade.id}
                    className={`rounded-xl border p-3 ${
                      unlocked ? "border-edge bg-panel-muted" : "border-edge/60 opacity-80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold text-foreground">
                          {upgrade.name}
                          <span className="ml-2 text-[10px] font-normal text-muted">
                            Lv {level}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-muted">{upgrade.description.split(".")[0]}.</p>
                        {unlocked && (
                          <p className="mt-1.5 font-mono text-[11px] text-accent-text">
                            {upgrade.formatSpec(level)}
                            {level >= 0 && (
                              <span className="text-muted">
                                {" "}
                                → {upgrade.formatSpec(level + 1)}
                              </span>
                            )}
                          </p>
                        )}
                        {!unlocked && (
                          <p className="mt-1 text-[11px] text-warning">{upgrade.unlockHint}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <p className="font-mono text-sm tabular-nums">{formatMoney(cost)}</p>
                        {unlocked ? (
                          <button
                            type="button"
                            disabled={!canBuy}
                            onClick={() => onBuy(upgrade.id)}
                            className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold ${
                              canBuy
                                ? "border border-accent/50 bg-accent-soft text-accent-text"
                                : "cursor-not-allowed border border-edge text-muted"
                            }`}
                          >
                            Upgrade
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={onUnlockLearning}
                            className="rounded-lg border border-violet/40 bg-violet-soft px-3 py-1.5 font-mono text-xs font-semibold text-violet"
                          >
                            Learn
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </li>
          );
        })}
      </ul>
      {!embedded && null}
    </div>
  );
}
