# Overclocked

An educational idle game for **CSC 3501 Computer Organization and Design**. Build a virtual CPU, earn **Compute Points** from architecture metrics, and diagnose course-based scenarios across CPU, Memory, Boolean Logic, and GPU topics.

## Learning objective

After completing the game, the player should be able to explain how **clock speed**, **cache memory**, **pipelining**, **pipeline hazards**, **branch prediction**, and **processor cores** affect CPU instruction throughput — using terminology from CSC 3501 lecture material (CPU, Memory, Boolean/Logisim, and GPU units).

## Course alignment

| Unit | Role in game |
| ---- | ------------ |
| **CPU** | Primary — CU, ALU, registers, clock, FDE cycle, Von Neumann/Harvard, ISA, pipeline, hazards, multicore |
| **Memory** | Very high — hierarchy, L1/L2/L3, RAM, SRAM/DRAM, DDR, storage, latency |
| **Boolean Logic** | Secondary circuit challenges — gates, truth tables, half/full adders, flip-flops |
| **GPU** | Late-game parallel track — CPU vs GPU, SIMT, threads/blocks/grids |

Challenges show labels like `MEMORY · CACHE · APPLICATION` and track **Course Mastery** percentages per unit.

## Features

- Idle Compute Points from: `IPS ≈ (clock / CPI) × cores × pipeline efficiency`
- Visible CPU stats + Fetch→Decode→Execute and memory-hierarchy visuals
- Scenario challenges tied to upgrades and bottleneck events
- Before/after upgrade feedback
- Architecture stages + historical eras
- 3D die preview, achievements, localStorage save, light/dark mode

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Push to GitHub and import in [Vercel](https://vercel.com). No environment variables required.

## Save Data

Progress is stored under `overclocked-save-v4` (older keys migrate when possible). Use **Reset** to clear.

Mandatory learning checkpoints pause Compute/sec until solved. Offline earnings also pause during stalls.
