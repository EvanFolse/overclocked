# Overclocked: File Structure
prototype/
index.html skeleton layout + <link>/<script src> tags + modals
style.css 100dvh layout, collapsible MENU, TIME IT bar, left ChipBot & Benchmarks
js/
content.js DATA: PARTS, STAGES, TAGS, FAULTS, CONFUSIONS, CHIP_ERAS, CHAT_QA
core.js game state, Iron Law cpuMetrics(), CHIP_ERAS helpers, TIME IT + ADD/LW/BEQ tracer
theater.js humanoid ChipBot badge, donut chart, stage brief / debrief
welcome.js welcome screen + 5-stage CPU Evolution finale
feedback.js player feedback form (localStorage)
bot.js left ChipBot: hints, confusion compare, CHAT_QA drawer, part demos
chip.js isometric 3D chip SVG, install animation, dismissible fault diagnosis
ui.js collapsible MENU (STAGES, UPGRADES, PARTS LAB, PROGRESS, SETTINGS)
engine.js minigame engine: timer, stars, 70% accuracy gate, stage hub
benchmark.js 3 client benchmark missions (Time = IC * CPI * T, Before/After, ISA trade-off)
main.js save/load, income & fault timers, TIME IT loop, boot
games/
cu.js Stage 1 · Dispatcher (ALU vs REG vs MEM)
alu.js Stage 1 · Bit Flip (4-bit logic, unsigned Carry-out, Lv2+ Signed V flag)
regs.js Stage 1 · Keep It Close (register pre-loading)
clock.js Stage 2 · Clock Sync (setup window)
pipe.js Stage 2 · Hazard Lab (procedural 2/3-inst forwarding, load-use, structural, flush)
decoder.js Stage 3 · Crack the Opcode (6-bit encode/decode)
l1.js Stage 4 · Cache Keeper (2/3-way set-associative mapping + trace LRU)
l2.js Stage 4 · Memory Sorter (size & frequency hierarchy, no spoilers)
fpu.js Stage 5 · IEEE-754 Builder (8-bit S|EEEE|MMM minifloat)
cores.js Stage 5 · Core Scheduler (multi-core dispatch + live Amdahl speedup)
Code
