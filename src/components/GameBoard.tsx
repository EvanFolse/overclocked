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
import { BottleneckToast } from "@/components/BottleneckToast";
import { CpuStatsView } from "@/components/drawer/CpuStatsView";
import { MasteryView } from "@/components/drawer/MasteryView";
import { AchievementView } from "@/components/drawer/AchievementView";
import { EraProgressView } from "@/components/drawer/EraProgressView";
import { SettingsView } from "@/components/drawer/SettingsView";
import { ThemeProvider } from "@/lib/theme";
import { getCurrentEra } from "@/data/eras";

function GameBoardInner() {
  const game = useGame();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [section, setSection] = useState<DrawerSection>("upgrades");

  const openDrawer = useCallback((next: DrawerSection) => {
    setSection(next);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

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
  const hasBottleneck = !!game.state.activeBottleneckId;
  const isBottleneck =
    hasBottleneck && game.activeQuestion?.id === game.state.activeBottleneckId;

  const openChallenges = (preferUnlock = false) => {
    game.openQuiz(preferUnlock || hasBottleneck);
    openDrawer("challenges");
  };

  const diagnoseBottleneck = () => {
    game.openQuiz(true);
    openDrawer("challenges");
  };

  let drawerBody: ReactNode;
  switch (section) {
    case "upgrades":
      drawerBody = (
        <UpgradePanel
          embedded
          state={game.state}
          onBuy={game.buyUpgrade}
          onUnlockQuiz={() => openChallenges(true)}
        />
      );
      break;
    case "stats":
      drawerBody = (
        <CpuStatsView
          cpuStats={game.cpuStats}
          incomePerSecond={game.incomePerSecond}
          cpuLevel={game.cpuLevel}
        />
      );
      break;
    case "challenges":
      drawerBody = (
        <QuizPanel
          mode="inline"
          open
          question={game.activeQuestion}
          selectedChoice={game.selectedChoice}
          feedback={game.feedback}
          isBottleneck={isBottleneck}
          onSelect={game.setSelectedChoice}
          onSubmit={game.submitAnswer}
          onNext={game.nextQuestion}
          onClose={closeDrawer}
          onStart={() => game.openQuiz(hasBottleneck)}
        />
      );
      break;
    case "mastery":
      drawerBody = <MasteryView state={game.state} />;
      break;
    case "achievements":
      drawerBody = <AchievementView state={game.state} />;
      break;
    case "architecture":
      drawerBody = (
        <EraProgressView state={game.state} cpuLevel={game.cpuLevel} />
      );
      break;
    case "settings":
      drawerBody = <SettingsView onReset={confirmReset} />;
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

      {/* Immersive 3D stage */}
      <div className="absolute inset-0 z-0">
        <CpuVisual
          immersive
          state={game.state}
          levels={game.state.upgradeLevels}
          cpuLevel={game.cpuLevel}
          upgradeFlash={game.upgradeFlash}
        />
      </div>

      <GameHUD
        money={game.state.money}
        incomePerSecond={game.incomePerSecond}
        cpuStats={game.cpuStats}
        eraName={era.name}
        menuOpen={drawerOpen}
        onToggleMenu={() => (drawerOpen ? closeDrawer() : openDrawer(section))}
      />

      <GameDrawer
        open={drawerOpen}
        section={section}
        onSectionChange={(s) => {
          setSection(s);
          if (s === "challenges" && !game.activeQuestion) {
            game.openQuiz(hasBottleneck);
          }
        }}
        onClose={closeDrawer}
        bottleneckBadge={hasBottleneck}
      >
        {drawerBody}
      </GameDrawer>

      <BottleneckToast
        visible={hasBottleneck && !drawerOpen}
        onDiagnose={diagnoseBottleneck}
        onDismiss={game.dismissActiveBottleneck}
      />

      <UpgradeFeedback delta={game.statDelta} onDismiss={game.clearStatDelta} />
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
