# Overclocked: file structure

```
prototype/
  index.html        skeleton only: layout + <link>/<script src> tags
  style.css         all styles
  js/
    content.js      DATA: PARTS, STAGES, TAGS, FAULTS, CONFUSIONS, BOT_DARES
    core.js         game state, newGame(), helpers, stat functions, Execute button
    theater.js      humanoid ChipBot walk-in theater, donut chart, stage brief / debrief
    golden.js       Golden Chip challenge + Overclock Frenzy
    benchmark.js    architecture benchmark (CPU time = IC x CPI x cycle time)
    welcome.js      welcome screen + CPU Evolution finale
    feedback.js     player feedback form (localStorage)
    bot.js          sidebar ChipBot: tips, dares, confusion drawer
    chip.js         isometric 3D chip drawing, install animation, fault diagnosis
    ui.js           left/center/right panels, tabs, upgrades, learning, progress, settings
    engine.js       minigame engine: makeApi, timer, stars, results, hub, checkStages
    games/
      cu.js  alu.js  regs.js  clock.js  pipe.js
      decoder.js  l1.js  l2.js  fpu.js  cores.js     one file = one minigame (GAMES.<key>)
    main.js         save/load, income timers, start-up (must load LAST)
```

## Rules
1. Plain `<script>` tags, NOT ES modules (the code uses inline `onclick="fn()"` globals).
2. Load order matters and equals the order of the `<script>` tags in index.html. A file may only
   run code at load time that depends on files ABOVE it. Function bodies can call anything,
   because they run later.
3. A new minigame = a new file in js/games/ that defines `GAMES.<key> = {...}`, plus one `<script>`
   line in index.html (before main.js), plus its entry in content.js (PARTS / STAGES).
4. One file, one owner. Do not edit someone else's file without telling them.
5. Tunable numbers: `MIN_BUILD_ACC` (engine.js) is the accuracy needed to build a part.
