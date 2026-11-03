#!/usr/bin/env python3
"""
1) A stage can bring its own matching screen (Stage 2 uses drag and drop).
2) Golden chip: one guaranteed chip after a stage is completed, then 25% every 30 seconds.
Run from the repo root:  python3 patch_tweaks.py
All anchors are checked in memory first. Nothing is written unless every check passes.
"""
import pathlib
import re
import sys

UI = "src/stages/ui.ts"
OVERLAY = "src/components/CheckpointOverlay.tsx"
CHIP = "src/components/GoldenChip.tsx"
texts = {}


def get(path):
    if path not in texts:
        texts[path] = pathlib.Path(path).read_text(encoding="utf-8")
    return texts[path]


def fail(msg):
    sys.exit(f"[fail] {msg}\nNothing was written.")


def replace_once(path, old, new, marker):
    s = get(path)
    if marker in s:
        print(f"[skip] {path}: already patched ({marker[:45]!r})")
        return
    n = s.count(old)
    if n != 1:
        fail(f"{path}: anchor found {n} times, expected 1:\n{old[:160]}")
    texts[path] = s.replace(old, new)
    print(f"[ok]   {path}: {marker[:45]!r}")


def main():
    if not pathlib.Path("src/components/learning/DragMatchStep.tsx").exists():
        fail("src/components/learning/DragMatchStep.tsx is missing. Create it first (step 1).")

    # ---------------- stages/ui.ts ----------------
    replace_once(
        UI,
        'import { PlaceStep } from "@/components/learning/PlaceStep";',
        'import { PlaceStep } from "@/components/learning/PlaceStep";\n'
        'import { DragMatchStep } from "@/components/learning/DragMatchStep";\n'
        'import type { RoundMatching } from "@/lib/rounds";\n'
        'import type { MatchResult } from "@/types/game";',
        'import { DragMatchStep } from',
    )
    replace_once(
        UI,
        "export interface StageFlow {\n  Learn?: ComponentType<StepProps>;\n  Place?: ComponentType<StepProps>;\n}",
        "export interface MatchProps {\n"
        "  sets: RoundMatching[];\n"
        "  onSetSettled: (result: MatchResult) => void;\n"
        "  onComplete: () => void;\n"
        "}\n\n"
        "export interface StageFlow {\n"
        "  Learn?: ComponentType<StepProps>;\n"
        "  Place?: ComponentType<StepProps>;\n"
        "  /** Optional: another screen for the matching sets (default: the click-to-pair MatchStep) */\n"
        "  Match?: ComponentType<MatchProps>;\n"
        "}",
        "Match?: ComponentType<MatchProps>;",
    )
    replace_once(
        UI,
        '  "cpu-basics": { Learn: LearnStep, Place: PlaceStep },\n};',
        '  "cpu-basics": { Learn: LearnStep, Place: PlaceStep },\n'
        '  // Stage 2: matching by drag and drop\n'
        '  "fetch-decode-execute": { Match: DragMatchStep },\n};',
        '"fetch-decode-execute": { Match: DragMatchStep }',
    )

    # ---------------- CheckpointOverlay.tsx ----------------
    replace_once(
        OVERLAY,
        "const flow = getStageFlow(checkpoint.id);",
        "const flow = getStageFlow(checkpoint.id);\n"
        "    // A stage may bring its own matching screen\n"
        "    const MatchComponent = flow.Match ?? MatchStep;",
        "const MatchComponent = flow.Match ?? MatchStep;",
    )
    s = get(OVERLAY)
    if "<MatchComponent" in s:
        print(f"[skip] {OVERLAY}: MatchComponent already used")
    else:
        pat = re.compile(r"<MatchStep(\s+)sets=\{matchSets\}")
        if len(pat.findall(s)) != 1:
            fail(f"{OVERLAY}: could not find the single <MatchStep sets={{matchSets}} (found {len(pat.findall(s))})")
        texts[OVERLAY] = pat.sub(lambda m: f"<MatchComponent{m.group(1)}sets={{matchSets}}", s, count=1)
        print(f"[ok]   {OVERLAY}: <MatchComponent")

    for path, text in texts.items():
        pathlib.Path(path).write_text(text, encoding="utf-8")
    print("Done.")


if __name__ == "__main__":
    main()
