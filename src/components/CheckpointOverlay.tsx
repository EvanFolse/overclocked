"use client";

import { TutorLauncher } from "@/components/TutorLauncher";
import { useState, useEffect } from "react";
import type { LearningCheckpoint } from "@/data/checkpoints";
import type { MatchResult, QuizFeedback } from "@/types/game";
import type { RoundMatching, RoundMission } from "@/lib/rounds";
import { CpuCycleVisual } from "@/components/CpuCycleVisual";
import { MemoryHierarchyVisual } from "@/components/MemoryHierarchyVisual";
import { ReadingStep } from "@/components/learning/ReadingStep";
import { getStageContent } from "@/stages/registry";
import { getStageFlow } from "@/stages/ui";
import { getStageByCheckpoint } from "@/data/stages";
import { MatchStep } from "@/components/learning/MatchStep";
import { RoundView } from "@/components/learning/RoundView";
import { StageLayout, type StageStepKey } from "@/components/learning/StageLayout";
import { MissionRunner } from "@/components/learning/mission/MissionRunner";

type BootPhase = "learn" | "place" | "mission" | "match" | "quiz" | "finish";
interface CheckpointOverlayProps {
  checkpoint: LearningCheckpoint;
  step: number;
  selectedChoice: number | null;
  feedback: QuizFeedback | null;
  bonusSuspended: boolean;
  lessonOpen: boolean;
  onOpenLesson: () => void;
  onCloseLesson: () => void;
  onSelect: (index: number) => void;
  onSubmit: () => void;
  onContinue: () => void;
  hintOpened: boolean;
  onOpenHint: () => void;
  /** Matching sets of the active round (empty when matching is switched off) */
  matchSets?: RoundMatching[];
  /** Reports one settled matching set to the game engine */
  onMatchSettled?: (result: MatchResult) => void;
  /** Interactive missions of the active round (played first) */
  missions?: RoundMission[];
  onMissionSettled?: (result: MatchResult) => void;
  cp?: number; 
}

export function CheckpointOverlay({
  checkpoint,
  step,
  selectedChoice,
  feedback,
  bonusSuspended: _bonusSuspended,
  lessonOpen,
  onOpenLesson,
  onCloseLesson,
  onSelect,
  onSubmit,
  onContinue,
  hintOpened,
  onOpenHint,
  matchSets = [],
  onMatchSettled,
  missions = [],
  onMissionSettled,
  cp,
}: CheckpointOverlayProps) {
  const question = checkpoint.questions[step];
  // A stage listed in the stage registry uses the new flow: Learn -> Place -> Match -> Quiz
  const stageContent = getStageContent(checkpoint.id);
  const isBoot = !!stageContent;
  const stageDef = getStageByCheckpoint(checkpoint.id);
  const stageNo = stageDef?.id ?? 1;
  const isLastQuestion = step >= checkpoint.questions.length - 1;

  // Stage 1 flow: learn -> place -> match -> quiz. Other checkpoints go straight to quiz.
  const [phase, setPhase] = useState<BootPhase>(isBoot ? "learn" : "quiz");

  // Stage 2 order: Mission -> MC -> Match. The matching sets come last, so the round ends after them.
  const [matchDone, setMatchDone] = useState(false);
  const playMatchLast = missions.length > 0 && matchSets.length > 0;

  useEffect(() => {
    setPhase(getStageContent(checkpoint.id) ? "learn" : "quiz");
    setMatchDone(false);
  }, [checkpoint.id, lessonOpen]);

  // The round ends from an effect, so it sees the state that already includes the last matching set
  useEffect(() => {
    if (phase === "finish") onContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // After a refresh every MC may already be answered while the matching sets are still open
  useEffect(() => {
    if (phase === "quiz" && playMatchLast && !matchDone && !feedback && step >= checkpoint.questions.length) {
      setPhase("match");
    }
  }, [phase, playMatchLast, matchDone, feedback, step, checkpoint.questions.length]);

  if (!lessonOpen) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4">
        <div className="w-full max-w-md rounded-2xl border border-warning/40 bg-panel/95 p-6 text-center shadow-2xl backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-warning">
            {checkpoint.stallHeadline}
          </p>
          <h2 className="mt-2 font-mono text-xl font-bold text-foreground">
            {checkpoint.stallSubtitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{checkpoint.stallBody}</p>
          <p className="mt-3 font-mono text-[11px] text-accent-text">
            Read the short lesson, complete interactive steps, then pass the quiz to unlock parts.
          </p>
          <button
            type="button"
            onClick={() => {
              onOpenLesson();
              setPhase(isBoot ? "learn" : "quiz");
            }}
            className="mt-5 w-full rounded-xl border border-warning/50 bg-warning/15 px-4 py-3 font-mono text-sm font-semibold text-warning transition hover:opacity-90"
          >
            {isBoot ? `Start Stage ${stageNo}` : "Start quiz round"}
          </button>
        </div>
      </div>
    );
  }

 
  const quizBody = (
    <>
      <div className="rounded-xl border border-edge bg-panel-muted p-3">
        <p className="text-sm leading-relaxed text-foreground">{checkpoint.reading}</p>
      </div>

      {(checkpoint.highlightCycle || checkpoint.highlightMemory) && (
        <div className="mt-3 flex flex-col gap-2">
          {checkpoint.highlightCycle && (
            <CpuCycleVisual active={checkpoint.highlightCycle} compact />
          )}
          {checkpoint.highlightMemory && (
            <MemoryHierarchyVisual active={checkpoint.highlightMemory} compact />
          )}
        </div>
      )}

      {question && (
        <>
          <p className="mt-4 text-sm font-medium leading-relaxed text-foreground">
            {question.scenario}
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {question.choices.map((choice, index) => {
              const isSelected = selectedChoice === index;
              let style = "border-edge bg-panel-muted text-foreground hover:border-violet/40";
              if (feedback) {
                if (index === question.correctIndex && (feedback.correct || feedback.revealed)) {
                  style = "border-success/60 bg-success-soft text-success";
                } else if (isSelected && !feedback.correct) {
                  style = "border-rose-400/50 bg-rose-500/10 text-rose-500";
                } else {
                  style = "border-edge/50 bg-panel text-muted";
                }
              } else if (isSelected) {
                style = "border-violet/60 bg-violet-soft text-violet";
              }

              return (
                <button
                  key={choice}
                  type="button"
                  disabled={!!feedback}
                  onClick={() => onSelect(index)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${style}`}
                >
                  <span className="mr-2 font-mono text-xs text-muted">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {choice}
                </button>
              );
            })}
          </div>
        </>
      )}

      {feedback && (
        <div
          className={`mt-4 rounded-xl border p-3 text-sm ${feedback.correct
            ? "border-success/40 bg-success-soft text-success"
            : "border-warning/40 bg-warning/10 text-warning"
            }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider">
              {feedback.correct
                ? feedback.unlockedUpgrade
                  ? `${feedback.unlockedUpgrade} unlocked`
                  : "Correct"
                : feedback.revealed
                  ? "Incorrect"
                  : "Not quite"}
            </p>
            {feedback.credit !== undefined && (
              <p className="font-mono text-xs font-semibold">Points [{feedback.credit}/1]</p>
            )}
          </div>
          {(feedback.correct || feedback.revealed) && (
            <p className="mt-2 text-xs leading-relaxed text-muted">{feedback.explanation}</p>
          )}
          {!feedback.correct && !feedback.revealed && question?.hint && (
            hintOpened ? (
              <p className="mt-2 text-xs text-warning">Hint: {question.hint}</p>
            ) : (
              <button
                type="button"
                onClick={onOpenHint}
                className="mt-2 rounded-lg border border-warning/40 px-3 py-1.5 font-mono text-xs text-warning"
              >
                Show hint (max ×0.5 credit)
              </button>
            )
          )}

          {!feedback.correct && !feedback.revealed && feedback.attempt && (
            <p className="mt-2 font-mono text-[10px] text-muted">Attempt {feedback.attempt} of 2</p>
          )}
          {!feedback.correct && feedback.revealed && (
            <p className="mt-2 text-xs text-warning">Correct answer: {feedback.correctAnswer}</p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {!feedback ? (
          <button
            type="button"
            disabled={selectedChoice == null}
            onClick={onSubmit}
            className="rounded-lg border border-violet/50 bg-violet-soft px-4 py-2 font-mono text-sm font-semibold text-violet disabled:opacity-40"
          >
            Submit
          </button>
        ) : feedback.correct || feedback.revealed ? (
          <button
            type="button"
            onClick={onContinue}
            className="rounded-lg border border-accent/40 bg-accent-soft px-4 py-2 font-mono text-sm font-semibold text-accent-text"
          >
            {isLastQuestion ? "See result" : "Next"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-2 font-mono text-sm font-semibold text-warning"
          >
            Try Again
          </button>
        )}
      </div>

      <p className="mt-5 border-t border-edge pt-3 text-[10px] leading-relaxed text-muted">
        <span className="font-semibold text-foreground">Course basis:</span> CSC 3501 — Computer
        Organization and Design
      </p>
    </>
  );

  
  if (isBoot) {
    const flow = getStageFlow(checkpoint.id);
    // A stage may bring its own matching screen
    const MatchComponent = flow.Match ?? MatchStep;
    // After Learn: Place if the stage has one, otherwise Match (if any), otherwise the quiz
    const firstRound: BootPhase = missions.length > 0 ? "mission" : matchSets.length > 0 ? "match" : "quiz";
    const afterLearn = () => setPhase(flow.Place ? "place" : firstRound);
    // With missions, Match comes after the last MC: that click goes to Match, the round ends after Match
    const quizSettled = !!feedback && (feedback.correct || !!feedback.revealed);
    const handleQuizContinue = () => {
      if (playMatchLast && !matchDone && isLastQuestion && quizSettled) {
        setPhase("match");
        return;
      }
      onContinue();
    };
    const layoutStep: StageStepKey =
      phase === "learn"
        ? "learn"
        : phase === "quiz" || phase === "mission" || phase === "finish" || (phase === "match" && playMatchLast)
          ? "round"
          : "place";

    return (
      <StageLayout
        title={
          stageContent?.layoutTitle ??
          `STAGE ${stageNo} · ${(stageDef?.title ?? checkpoint.title).toUpperCase()}`
        }
        subtitle="LEARN → PLACE → ROUND → UNLOCK"
        currentStep={layoutStep}
        cp={cp}
        onLeave={onCloseLesson}
      >
        {phase === "learn" &&
          (flow.Learn ? (
            <flow.Learn onComplete={afterLearn} />
          ) : (
            <ReadingStep reading={checkpoint.reading} onComplete={afterLearn} />
          ))}

        {(phase === "learn" || phase === "place") && <TutorLauncher stage={stageNo} />}

        {phase === "place" && flow.Place && (
          <div className="mx-auto max-w-5xl rounded-2xl border border-edge bg-panel p-6 shadow-lg">
            <flow.Place onComplete={() => setPhase(firstRound)} />
          </div>
        )}

        {phase === "mission" && missions.length > 0 && (
          <MissionRunner
            missions={missions}
            onSettled={(r) => onMissionSettled?.(r)}
            onComplete={() => setPhase("quiz")}
          />
        )}

        {phase === "match" && (
          <div className="mx-auto max-w-5xl rounded-2xl border border-edge bg-panel p-6 shadow-lg">
            <MatchComponent
              sets={matchSets}
              onSetSettled={(r) => onMatchSettled?.(r)}
              onComplete={() => {
                if (playMatchLast) {
                  setMatchDone(true);
                  setPhase("finish");
                } else {
                  setPhase("quiz");
                }
              }}
            />
          </div>
        )}

        {phase === "quiz" && (
          <RoundView
            checkpointId={checkpoint.id}
            question={question}
            step={step}
            total={checkpoint.questions.length}
            selectedChoice={selectedChoice}
            feedback={feedback}
            hintOpened={hintOpened}
            isLastQuestion={isLastQuestion}
            onSelect={onSelect}
            onSubmit={onSubmit}
            onContinue={handleQuizContinue}
            onOpenHint={onOpenHint}
          />
        )}
      </StageLayout>
    );
  }

  
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-violet/30 bg-panel p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-violet">
              {checkpoint.courseUnit} · Required · Step {step + 1}/{checkpoint.questions.length}
            </p>
            <h2 className="mt-1 font-mono text-lg font-semibold text-foreground">
              {checkpoint.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCloseLesson}
            className="rounded-lg border border-edge px-2 py-1 text-xs text-muted hover:text-foreground"
          >
            Leave
          </button>
        </div>

        <div className="mt-4">{quizBody}</div>
      </div>
    </div>
  );
}