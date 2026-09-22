"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useGame } from "@/hooks/useGame";
import { GameHUD } from "@/components/GameHUD";
import { GameDrawer, type DrawerSection } from "@/components/GameDrawer";
import { CpuVisual } from "@/components/CpuVisual";
import { UpgradePanel } from "@/components/UpgradePanel";
import { QuizPanel } from "@/components/QuizPanel";
import { AchievementToast } from "@/components/AchievementToast";
import { UpgradeFeedback } from "@/components/UpgradeFeedback";
import { CheckpointOverlay } from "@/components/CheckpointOverlay";
import { LearningView } from "@/components/drawer/LearningView";
import { ProgressView } from "@/components/drawer/ProgressView";
import { SettingsView } from "@/components/drawer/SettingsView";
import { SourcesView } from "@/components/drawer/SourcesView";
import { ThemeProvider } from "@/lib/theme";
import { getCurrentEra } from "@/data/eras";

function GameBoardInner() {
  const game = useGame();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [section, setSection] = useState<DrawerSection>("upgrades");
  const [practiceOpen, setPracticeOpen] = useState(false);

  const openDrawer = useCallback((next: DrawerSection) => {
    setSection(next);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  if (!game.hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-accent-text">
        <p className="font-mono text-sm tracking-widest animate-pulse">BOOTING SYSTEM…</p>
      </div>
    );
  }

  const confirmReset = () => {
    if (window.confirm("Reset all progress? This cannot be undone.")) {
      game.resetGame();
      closeDrawer();
    }
  };

  const era = getCurrentEra(game.state);
  const hasCheckpoint = !!game.activeCheckpoint;

  let drawerBody: ReactNode;
  switch (section) {
    case "upgrades":
      drawerBody = (
        <UpgradePanel
          embedded
          stalled={game.stalled && game.cpuOnline}
          state={game.state}
          onBuy={game.buyUpgrade}
          onUnlockLearning={() => {
            openDrawer("learning");
            if (game.activeCheckpoint) game.openLesson();
          }}
        />
      );
      break;
    case "learning":
      drawerBody = practiceOpen ? (
        <QuizPanel
          mode="inline"
          open
          question={game.activeQuestion}
          selectedChoice={game.selectedChoice}
          feedback={game.feedback}
          isBottleneck={false}
          onSelect={game.setSelectedChoice}
          onSubmit={game.submitPractice}
          onNext={game.nextPractice}
          onClose={() => setPracticeOpen(false)}
          onStart={() => game.openPractice(false)}
        />
      ) : (
        <LearningView
          state={game.state}
          activeCheckpoint={game.activeCheckpoint}
          onOpenCheckpoint={() => {
            closeDrawer();
            game.openLesson();
          }}
          onPractice={() => {
            setPracticeOpen(true);
            game.openPractice(false);
          }}
        />
      );
      break;
    case "progress":
      drawerBody = <ProgressView state={game.state} cpuLevel={game.cpuLevel} />;
      break;
    case "settings":
      drawerBody = <SettingsView onReset={confirmReset} />;
      break;
    case "sources":
      drawerBody = <SourcesView />;
      break;
  }

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, var(--glow-top), transparent 55%), radial-gradient(ellipse at bottom, var(--glow-bottom), transparent 50%)",
        }}
      />

      <div className="absolute inset-0 z-0">
        <CpuVisual
          immersive
          offline={!game.cpuOnline}
          state={game.state}
          levels={game.state.upgradeLevels}
          cpuLevel={game.cpuLevel}
          upgradeFlash={game.upgradeFlash}
        />
      </div>

      <GameHUD
        money={game.state.money}
        incomePerSecond={game.incomePerSecond}
        eraName={era.name}
        cpuOnline={game.cpuOnline}
        stalled={game.stalled}
        menuOpen={drawerOpen}
        onToggleMenu={() => (drawerOpen ? closeDrawer() : openDrawer(section))}
      />

      <GameDrawer
        open={drawerOpen}
        section={section}
        onSectionChange={(s) => {
          setSection(s);
          setPracticeOpen(false);
        }}
        onClose={closeDrawer}
        learningBadge={hasCheckpoint}
      >
        {drawerBody}
      </GameDrawer>

      {/* Offline boot CTA when no active lesson yet */}
      {!game.cpuOnline && !game.activeCheckpoint && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-2xl border border-warning/40 bg-panel/95 p-6 text-center shadow-2xl backdrop-blur-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-warning">
              CPU Offline
            </p>
            <h2 className="mt-2 font-mono text-xl font-bold text-foreground">
              Missing Components
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Your processor is missing the components it needs to execute instructions.
              Compute/sec starts at 0.
            </p>
            <button
              type="button"
              onClick={game.beginBoot}
              className="mt-5 w-full rounded-xl border border-warning/50 bg-warning/15 px-4 py-3 font-mono text-sm font-semibold text-warning"
            >
              Build Your First CPU
            </button>
          </div>
        </div>
      )}

      {game.activeCheckpoint && (
        <CheckpointOverlay
          checkpoint={game.activeCheckpoint}
          step={game.state.checkpointStep}
          selectedChoice={game.selectedChoice}
          feedback={game.feedback}
          lessonOpen={game.lessonOpen || game.activeCheckpoint.id === "cpu-basics"}
          onOpenLesson={game.openLesson}
          onCloseLesson={game.closeLesson}
          onSelect={game.setSelectedChoice}
          onSubmit={game.submitCheckpointAnswer}
          onContinue={game.nextCheckpointStep}
        />
      )}

      <UpgradeFeedback
        delta={game.statDelta}
        resolve={game.resolveToast}
        onDismissDelta={game.clearStatDelta}
        onDismissResolve={game.clearResolveToast}
      />
      <AchievementToast achievementId={game.newAchievement} />
    </div>
  );
}

export function GameBoard() {
  return (
    <ThemeProvider>
      <GameBoardInner />
    </ThemeProvider>
  );
}
