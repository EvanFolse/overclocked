"use client";
import { UnlockCelebration } from "@/components/learning/UnlockCelebration";
import { getRoundMatchSets } from "@/lib/rounds";
import { RoundResultCard } from "@/components/learning/RoundResultCard";
import { StageLayout } from "@/components/learning/StageLayout";
import { LEARNING_CONFIG } from "@/lib/learningConfig";
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
import { StageList } from "@/components/StageList";
import { WelcomeOverlay } from "@/components/WelcomeOverlay";
import { LearningView } from "@/components/drawer/LearningView";
import { ProgressView } from "@/components/drawer/ProgressView";
import { SettingsView } from "@/components/drawer/SettingsView";
import { SourcesView } from "@/components/drawer/SourcesView";
import { ThemeProvider } from "@/lib/theme";
import { getCurrentEra } from "@/data/eras";
import { getCpuRank } from "@/lib/cpuRanks";

function GameBoardInner() {
    const game = useGame();
    // True while the unlock celebration page is shown (after the round result)
    const [celebrate, setCelebrate] = useState(false);
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
                    onStartStage={(stageId) => {
                        closeDrawer();
                        if (game.activeCheckpoint) {
                            game.openLesson();
                            return;
                        }
                        game.beginStage(stageId);
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
                    offline={!game.shownCpuOnline}
                    state={game.shownState}
                    levels={game.shownState.upgradeLevels}
                    cpuLevel={game.shownCpuLevel}
                    upgradeFlash={game.shownFlash}
                    rank={getCpuRank(game.shownState.completedLearningCheckpoints)}
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


            {!(game.activeCheckpoint && game.lessonOpen) && (
                <StageList state={game.state} onStart={game.beginStage} />
            )}
            {game.activeCheckpoint && game.lessonOpen && (
                <CheckpointOverlay
                    checkpoint={game.activeCheckpoint}
                    cp={game.state.money}
                    step={game.displayStep}
                    selectedChoice={game.selectedChoice}
                    feedback={game.feedback}
                    bonusSuspended={game.state.bonusSuspended}
                    lessonOpen={game.lessonOpen}
                    onOpenLesson={game.openLesson}
                    onCloseLesson={game.closeLesson}
                    onSelect={game.setSelectedChoice}
                    onSubmit={game.submitCheckpointAnswer}
                    onContinue={game.nextCheckpointStep}
                    hintOpened={game.hintOpened}
                    onOpenHint={game.openHint}
                    matchSets={getRoundMatchSets(game.state)}
                    onMatchSettled={game.settleMatchSet}
                />
            )}

            {game.roundResult && !celebrate && (
                <StageLayout
                    title={game.roundResult.stageTitle.toUpperCase()}
                    subtitle="LEARN → PLACE → ROUND → UNLOCK"
                    currentStep="round"
                    cp={game.state.money}
                >
                    <RoundResultCard
                        stageLabel={game.roundResult.stageTitle.toUpperCase()}
                        groups={game.roundResult.groups}
                        passLine={LEARNING_CONFIG.passLine}
                        kind={game.roundResult.kind}
                        reward={game.roundResult.reward}
                        onContinue={() => {
                            // A passed round shows the unlock page before the CPU changes
                            if (game.roundResult?.kind === "passed" && game.unlockInfo) {
                                setCelebrate(true);
                                return;
                            }
                            const failed = game.roundResult?.kind === "failed";
                            game.clearRoundResult();
                            // 不及格时点 Try again,如果这一关还在进行中就重新打开
                            if (failed && game.activeCheckpoint) game.openLesson();
                        }}
                    />
                </StageLayout>
            )}

            {game.roundResult && celebrate && game.unlockInfo && (
                <UnlockCelebration
                    info={game.unlockInfo}
                    money={game.state.money}
                    onNext={() => {
                        setCelebrate(false);
                        game.clearRoundResult();
                    }}
                />
            )}

            {game.autoUnlock && (
                <UnlockCelebration
                    info={game.autoUnlock}
                    money={game.state.money}
                    onNext={game.finishAutoUnlock}
                />
            )}

            <UpgradeFeedback
                delta={game.statDelta}
                resolve={game.roundResult ? null : game.resolveToast}
                onDismissDelta={game.clearStatDelta}
                onDismissResolve={game.clearResolveToast}
            />
            <WelcomeOverlay key={game.resetCount} />
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
