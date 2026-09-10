# Overclocked

An educational idle game inspired by Cookie Clicker. Build and upgrade a virtual CPU, earn money automatically, and answer computer science quizzes to unlock advanced components.

## Features

- Passive income that grows as you upgrade real CPU components
- Educational path: Control Unit, ALU, Registers, Clock, Cache, Buses, Cores, ISA, Generation, Overclocking, Socket, Cooling
- Era progression from the **Intel 4004 (1971)** to **2026 flagship** class (EPYC Venice / Diamond Rapids / Threadripper-scale)
- Quizzes covering CU/ALU/registers, ISA families (x86, ARM, RISC-V, MIPS, AVR), and more
- Light / dark mode and interactive 3D die preview
- Achievements and localStorage save/load (no backend)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description            |
| --------------- | ---------------------- |
| `npm run dev`   | Start local dev server |
| `npm run build` | Production build       |
| `npm run start` | Run production server  |
| `npm run lint`  | Lint the project       |

## Deploy

Push to GitHub and import the repo in [Vercel](https://vercel.com). No environment variables or database required.

## Project Structure

```
src/
  components/   UI panels and game board
  data/         Upgrades, questions, achievements
  hooks/        useGame state hook
  lib/          Game logic, formatting, storage, theme
  types/        Shared TypeScript types
  app/          Next.js App Router entry
```

## Save Data

Progress is stored in `localStorage` under `overclocked-save-v2`. Use **Reset** in the header to clear it.
