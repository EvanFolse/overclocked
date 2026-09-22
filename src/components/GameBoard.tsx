"use client";

import { useGame } from "@/hooks/useGame";
import { Header } from "@/components/Header";
import { CpuVisual } from "@/components/CpuVisual";
import { UpgradePanel } from "@/components/UpgradePanel";
import { QuizPanel } from "@/components/QuizPanel";
import { StatsPanel } from "@/components/StatsPanel";
import { AchievementToast } from "@/components/AchievementToast";
import { UpgradeFeedback } from "@/components/UpgradeFeedback";
import { ThemeProvider } from "@/lib/theme";

function GameBoardInner() {
  const game = useGame();

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
    }
  };

  const isBottleneck =
    !!game.state.activeBottleneckId &&
    game.activeQuestion?.id === game.state.activeBottleneckId;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, var(--glow-top), transparent 55%), radial-gradient(ellipse at bottom, var(--glow-bottom), transparent 50%)",
        }}
      />

      <div className="relative z-10">
        <Header
          money={game.state.money}
          incomePerSecond={game.incomePerSecond}
          cpuStats={game.cpuStats}
          hasBottleneck={!!game.state.activeBottleneckId}
          onOpenQuiz={() => game.openQuiz(!!game.state.activeBottleneckId)}
          onReset={confirmReset}
        />

        <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-4">
            <CpuVisual
              state={game.state}
              levels={game.state.upgradeLevels}
              cpuLevel={game.cpuLevel}
              incomePerSecond={game.incomePerSecond}
              pulse={game.pulse}
              upgradeFlash={game.upgradeFlash}
            />
            <StatsPanel
              state={game.state}
              incomePerSecond={game.incomePerSecond}
              cpuLevel={game.cpuLevel}
              cpuStats={game.cpuStats}
            />
          </div>

          <UpgradePanel
            state={game.state}
            onBuy={game.buyUpgrade}
            onUnlockQuiz={() => game.openQuiz(true)}
          />
        </main>

        <footer className="border-t border-edge py-4 text-center text-[11px] text-muted">
          Progress saves automatically · Learn how clock, cache, pipelines, hazards,
          prediction, and cores shape throughput
        </footer>
      </div>

      <QuizPanel
        open={game.quizOpen}
        question={game.activeQuestion}
        selectedChoice={game.selectedChoice}
        feedback={game.feedback}
        isBottleneck={isBottleneck}
        onSelect={game.setSelectedChoice}
        onSubmit={game.submitAnswer}
        onNext={game.nextQuestion}
        onClose={game.closeQuiz}
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
