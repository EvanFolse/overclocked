# Overclocked: CPU Builder

> An idle learning game for computer organization. Complete short challenges to assemble a 3D CPU and advance from early microprocessor designs to modern multi-core systems.

**Course:** CSC 3501, Fall 2026  
**Topic:** Computer Organization and Design: building a CPU (control unit, ALU, registers, clock, decoder, pipeline, caches, FPU, multi-core)

---

## Learning objectives

After playing, the player should be able to:

1. Identify pipeline hazards (RAW data, load-use, structural, and control) and decide whether the right fix is normal execution, forwarding, a stall, or a flush.
2. Map memory addresses to sets in a set-associative cache, decide hit or miss, and pick the correct block to replace under LRU.
3. Explain how adding or upgrading a CPU part (and choosing RISC vs. CISC) changes program run time, using the performance equation **Time = IC × CPI × cycle time**.
4. Describe how serial bottlenecks limit multi-core speedup under Amdahl's law.

---

## How to play

1. **Mini games.** Open the menu and play the 10 modules across 5 stages. Passing a module (★ score and ≥ 70% accuracy) unlocks and mounts that CPU part on the 3D chip.
2. **Timing.** Hit the green zone on the timing bar (`Space` or **EXECUTE**) to earn **Compute** (ops), the currency you spend on upgrades. Open **Instruction Lab** on the left dock, pick `ADD`, `LW`, or `BEQ`, and press **Watch path** to see the route that instruction takes through the chip.
3. **Faults.** Every so often a hardware alert appears above the chip. Click the failing 3D component to repair it and earn bonus Compute.
4. **Upgrade.** Spend Compute to upgrade parts. Higher levels also require stars earned in that part's mini game. After Stage 2 you can turn on **Overclock** (higher clock speed, tighter timing window).
5. **Speed Tests (optional).** Open **Speed Testing** on the left dock to check how fast your CPU runs real jobs (camera burst, browser tabs, big data scan). Upgrade bottleneck parts and beat the target time for bonus Compute.
6. **Stuck?** Open **Tutor** on the left dock for hints. When all 5 stages are complete, **Game Completion | Feedback** shows your CPU's evolution and a short feedback form.

**Reviewers:** `MENU → SETTINGS → Showcase / Grading Mode` unlocks all 5 stages so you can play any stage in any order. `Full unlock` (also in Settings) is for demos and testing only: it installs every part at max level and cannot be undone except with **Reset game**, so use a fresh browser window if you want to keep your own progress.

### Mini games

| Part | What the player does |
|---|---|
| Control unit | Route each instruction to the unit that does the work |
| ALU | Flip lamps to match the result, including unsigned carry and signed overflow (`V`) flags |
| Registers | Load the needed variables into registers before time runs out |
| Clock | Latch the units together by hitting `TICK` inside the green setup window |
| Decoder | Decode bits into an instruction, or encode bits to match a key |
| Pipeline | Choose Run Normal, Forward, Stall 1 Cycle, or Flush for each hazard |
| L1 cache | Map addresses to sets and replace the right block on a miss (LRU) |
| L2 cache | Decide placement from data size and access frequency |
| FPU | Encode a decimal into an 8-bit floating-point format |
| Multi-core | Dispatch work to idle cores while serial sections limit the speedup (Amdahl's law) |

---

## How the learning is built into the gameplay

- Parts are unlocked by passing the matching mini game with ≥ 70% accuracy, and upgrading a part needs stars from that mini game. Compute alone cannot skip the learning.
- Each mini game requires the player to reason about the concept, not just answer a quiz between rounds.
- **Misconception tracking (ChipBot):** Repeated mistakes (such as confusing ALU vs. Control Unit or forwarding vs. load-use stalls) trigger side-by-side comparison hints and a per-stage mastery summary.
- **Speed Tests & trade-offs:** Each real-world job is slow because of one weak part, connecting **Time = IC × CPI × cycle time** directly to upgrades, RISC vs. CISC choices, and Overclock mode (higher clock speed vs. a tighter timing window).

---

## Team and contributions

> Each member fills in their own row. Please write facts only (what you built, which files or modules).

| Member      | Contributions |
|-------------|---|
| Gary Ye | ChipBot tutor, stage briefing and mastery donut charts, initial welcome screen, hardware fault diagnosis, Speed Tests benchmarks, end-of-game feedback form, carry and signed overflow flags in the ALU mini game (*Bit Flip*), the Part Demo, the initial README, and merging team modules into the integrated build. |
| Evan        |  |
| Jacob       |  |
| Bruce Brown |  |



