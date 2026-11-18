# Overclocked: file structure

~~~
prototype/
  index.html        skeleton only: layout + <link>/<script src> tags
  style.css         all styles (100dvh layout, collapsible menu, TIME IT bar, left ChipBot)
  js/
    content.js      DATA: PARTS, STAGES, TAGS, FAULTS, CONFUSIONS, CHIP_ERAS, CHAT_QA
    core.js         game state, newGame(), CHIP_ERAS helpers, TIME IT + ADD/LW/BEQ tracer
    theater.js      humanoid ChipBot badge, donut chart, stage brief / debrief
    welcome.js      welcome screen + CPU Evolution finale
    feedback.js     player feedback form (localStorage)
    bot.js          left ChipBot: tips, confusion compare, CHAT_QA conversational drawer
    chip.js         isometric 3D chip drawing, install animation, dismissible fault diagnosis
    ui.js           collapsible MENU, 5 tabs (STAGES, UPGRADES w/ 3D icons, PARTS LAB, PROGRESS, SETTINGS)
    engine.js       minigame engine: makeApi, timer, stars, 70% accuracy gate, hub, checkStages
    games/
      cu.js  alu.js  regs.js  clock.js  pipe.js
      decoder.js  l1.js  l2.js  fpu.js  cores.js     one file = one minigame (GAMES.<key>)
    main.js         save/load, income timers, fault timer, TIME IT loop, start-up (must load LAST)
~~~

## Rules
1. Plain `<script>` tags, NOT ES modules (the code uses inline `onclick="fn()"` globals).
2. Load order matters and equals the order of the `<script>` tags in index.html. A file may only
   run code at load time that depends on files ABOVE it. Function bodies can call anything,
   because they run later.
3. A new minigame = a new file in js/games/ that defines `GAMES.<key> = {...}`, plus one `<script>`
   line in index.html (before main.js), plus its entry in content.js (PARTS / STAGES).
4. One file, one owner. Do not edit someone else's file without telling them.
5. Tunable numbers: `MIN_BUILD_ACC` (engine.js) is the accuracy needed to build a part.
