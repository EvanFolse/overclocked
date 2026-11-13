# Overclocked — file structure

```
public/
  index.html        skeleton only: layout + <script src> tags
  style.css         all styles
  js/
    content.js      DATA: PARTS (names, text, colors, slots), STAGES, TAGS
    core.js         game state, newGame(), helpers, stat functions (bitsNow, clockMHz...)
    chip.js         isometric CPU drawing, install animation, setHot
    engine.js       minigame engine: makeApi, timer, stars, results, stage hub, checkStages
    ui.js           left/center/right panels, tabs, upgrades, learning, progress, settings, Tutor
    games/
      cu.js  alu.js  regs.js  clock.js  pipe.js
      decoder.js  l1.js  l2.js  fpu.js  cores.js     one file = one minigame (GAMES.<key>)
    main.js         save/load, income timers, start-up (must load LAST)
```

## Rules
1. Plain `<script>` tags, NOT ES modules (the code uses inline `onclick="fn()"` globals).
2. Load order matters: content -> core -> chip -> engine -> ui -> games/* -> main.
3. A new minigame = a new file in js/games/ that defines `GAMES.<key> = {...}`,
   plus one `<script>` line in index.html (before main.js), plus its entry in content.js (PARTS/STAGES).
4. One file, one owner. Do not edit someone else's file without telling them.
