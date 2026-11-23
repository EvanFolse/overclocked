// core.js: game state, newGame(), helpers, CHIP_ERAS, TIME IT + ADD/LW/BEQ tracer
// ---------------------------------------------------------
var SAVE_KEY = "overclockedMergedV1Save", FB_KEY = "overclockedFeedbackList";
var game = newGame(), tab = "stages", menuOpen = false, learnOpen = "", selected = "", hot = "", G = null, view = null;
var activeFault = null, shownCp = 0, animOn = false, lastAfford = "", resetArmed = false;
var execInst = "ADD", traceTimers = [], demoTimers = [], fbDraft = { stars: 0, stage: "", issues: [] };
var lastEraId = "bare", eraReady = false, overclockOn = false;
var timing = { pos: 0, dir: 1, locked: false, greenCenter: 0.5, greenHalf: 0.035 };
var TIMING_BASE_SPEED = 0.0075, TIMING_MAX_MULT = 1.5, GREEN_HALF = 0.035;

function emptyObjStats() { return [{ hits: 0, misses: 0 }, { hits: 0, misses: 0 }, { hits: 0, misses: 0 }, { hits: 0, misses: 0 }, { hits: 0, misses: 0 }]; }
function emptyStageConfs() { return [{}, {}, {}, {}, {}]; }
function newGame() {
    var g = { cp: 0, earned: 0, answers: 0, right: 0, seenWelcome: false, finaleShown: false, seenStages: [false, false, false, false, false], archChoices: { isa: "risc" }, benchPassed: {}, benchBaseline: {}, confusions: {}, stageConfusions: emptyStageConfs(), objStats: emptyObjStats(), reduce: false, sound: true, dark: false, stars: {}, parts: {}, stages: ["open", "locked", "locked", "locked", "locked"] };
    for (var i = 0; i < PARTS.length; i++) g.parts[PARTS[i].key] = { on: false, level: 1, h: 0 };
    return g;
}
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function fmt(n) { return Math.floor(n).toLocaleString(); }
function el(id) { return document.getElementById(id); }
function heightOf(l) { return 10 + l * 5; }
function upCost(k) { return Math.floor(PART[k].cost * Math.pow(1.9, game.parts[k].level - 1)); }
function lvl(k) { return game.parts[k].on ? game.parts[k].level : 0; }
function maxLevelFor(k) { var s = game.stars[k] || 0; return s >= 3 ? 5 : s === 2 ? 4 : s === 1 ? 2 : 1; }
function needStarFor(lv) { return lv >= 4 ? "★★★" : "★★"; }
function l1MissRateFor(lv) { return lv > 0 ? [1.0, 0.28, 0.20, 0.12, 0.07, 0.04][lv] : 1.0; }
function l2MissRateFor(lv) { return lv > 0 ? [1.0, 0.45, 0.34, 0.24, 0.16, 0.10][lv] : 1.0; }

function cpuMetrics(overrides) {
    var ov = overrides || {};
    function lv(k) { return (k in ov) ? ov[k] : lvl(k); }
    var active = 0;
    for (var i = 0; i < PARTS.length; i++) if (lv(PARTS[i].key) > 0) active++;
    if (active === 0) {
        return { opsPerSec: 0, mhz: 0, idealIpc: 0, cpiEff: 0, l1Hit: 0, cores: 1, icFactor: 1, memStall: 0 };
    }
    var clkLv = lv("clock"), pipeLv = lv("pipe"), cuLv = lv("cu"), aluLv = lv("alu"),
        regLv = lv("regs"), decLv = lv("decoder"), l1Lv = lv("l1"), l2Lv = lv("l2"),
        fpuLv = lv("fpu"), coreLv = lv("cores");

    var mhz = clkLv > 0 ? [5, 33, 200, 1500, 4500][clkLv - 1] : 1;
    if (overclockOn && clkLv > 0) mhz = Math.round(mhz * 1.35);

    var idealIpc = pipeLv > 0 ? [1.0, 1.0, 2.0, 3.0, 4.0][pipeLv - 1] : (cuLv > 0 ? 0.25 : 0.20);
    var isCisc = (game.archChoices.isa === "cisc");
    // RISC: simpler 1-cycle decode (+15% more instructions); CISC: denser code (-18% IC, higher base decode CPI until micro-op Lv4+)
    var icFactor = isCisc ? 0.82 : 1.15;
    var decodePenalty = isCisc ? (decLv >= 4 ? 0.05 : Math.max(0.08, 0.32 - decLv * 0.06)) : 0.0;
    var spillPenalty = Math.max(0.04, 0.44 - regLv * 0.08);

    var l1Miss = l1MissRateFor(l1Lv), l2Miss = l2MissRateFor(l2Lv);
    var memStall = 0.25 * l1Miss * (1.2 + 4.2 * l2Miss); // effective cycles lost to L2/RAM misses per avg instruction
    var branchStall = Math.max(0.02, 0.30 - (cuLv + pipeLv) * 0.03);
    var cpiEff = (1 / idealIpc) + decodePenalty + spillPenalty + memStall + branchStall;

    var cores = coreLv > 0 ? [1, 2, 4, 8, 16][coreLv - 1] : 1;
    var amdahl = 1 / (0.15 + 0.85 / cores);
    var clockScore = clkLv > 0 ? (2.2 * Math.pow(mhz / 5, 0.34)) : 1.0;
    var execWidth = 1.0 + cuLv * 0.22 + aluLv * 0.32 + fpuLv * 0.36 + decLv * 0.16;

    var opsPerSec = 26 * clockScore * amdahl * execWidth / (icFactor * cpiEff);
    return {
        opsPerSec: opsPerSec, mhz: clkLv > 0 ? mhz : 0, idealIpc: idealIpc,
        cpiEff: cpiEff, l1Hit: l1Lv > 0 ? Math.round((1 - l1Miss) * 100) : 0,
        cores: cores, icFactor: icFactor, memStall: memStall
    };
}

function totalCps() { return cpuMetrics().opsPerSec; }
function partCps(k) {
    if (!game.parts[k] || !game.parts[k].on) return 0;
    var cur = totalCps(), ov = {}; ov[k] = 0;
    return Math.max(0, cur - cpuMetrics(ov).opsPerSec);
}
function totalLevels() { var t = 0; for (var i = 0; i < PARTS.length; i++) { var p = game.parts[PARTS[i].key]; if (p.on) t += p.level; } return t; }
function clickPower() { return 1 + totalLevels(); }
function gainCp(n) { game.cp += n; game.earned += n; }
function partsOn() { var c = 0; for (var i = 0; i < PARTS.length; i++)if (game.parts[PARTS[i].key].on) c++; return c; }
function installedCount() { return partsOn(); }
function wordWidthText() { return lvl("alu") > 0 ? ["4-bit", "8-bit", "16-bit", "32-bit", "64-bit"][lvl("alu") - 1] : "—"; }
function clockMHz() { return lvl("clock") > 0 ? [5, 33, 200, 1500, 4500][lvl("clock") - 1] : 0; }
function ipcNow() { return lvl("pipe") > 0 ? ["1.00", "1.00", "2.00", "3.00", "4.00"][lvl("pipe") - 1] : (lvl("cu") > 0 ? "0.25" : "—"); }
function l1CacheText() { return lvl("l1") > 0 ? ["1 KB", "4 KB", "16 KB", "32 KB", "64 KB"][lvl("l1") - 1] : "0 KB"; }
function coresNow() { return lvl("cores") > 0 ? [1, 2, 4, 8, 16][lvl("cores") - 1] : 1; }
function allStagesPassed() { for (var i = 0; i < 5; i++)if (game.stages[i] !== "passed") return false; return true; }

function currentEra() {
    var best = CHIP_ERAS[0];
    for (var i = 0; i < CHIP_ERAS.length; i++) if (CHIP_ERAS[i].ready()) best = CHIP_ERAS[i];
    return best;
}
function nextEra() {
    var cur = currentEra();
    for (var i = 0; i < CHIP_ERAS.length; i++) if (CHIP_ERAS[i].id === cur.id && i + 1 < CHIP_ERAS.length) return CHIP_ERAS[i + 1];
    return null;
}
function checkEra(announce) {
    var e = currentEra();
    if (eraReady && announce && e.id !== lastEraId && e.id !== "bare") {
        toast("New CPU era: " + e.name + "!");
        if (typeof BOT !== "undefined") {
            BOT.say("🏛️ Era unlocked: <b>" + e.name + "</b>! " + e.blurb, "party", "good");
            if (typeof pushChat === "function") pushChat("bot", "🎉 Your chip reached <b>" + e.name + "</b>! " + e.blurb);
        }
    }
    lastEraId = e.id;
    return e;
}

function setArchChoice(kind, val) { game.archChoices[kind] = val; save(); renderHud(); if (typeof renderBenchList === "function") renderBenchList(); }

function clearChipDemo() {
    for (var i = 0; i < demoTimers.length; i++) clearTimeout(demoTimers[i]);
    demoTimers = [];
    if (el("chipDemoLayer")) el("chipDemoLayer").innerHTML = "";
}
function playPartDemo(key) {
    var P = PART[key]; if (!P) return;
    clearChipDemo();
    el("chipDemoLayer").innerHTML = "<div class='chip-demo-pill'>" + P.demoText + "</div>";
    var steps = P.demoSteps.filter(function (k) { return game.parts[k] && game.parts[k].on; });
    if (steps.length === 0) steps = [key];
    steps.forEach(function (k, idx) {
        demoTimers.push(setTimeout(function () {
            if (game.parts[k] && game.parts[k].on) { hot = k; drawChip(); }
        }, idx * 420));
    });
    demoTimers.push(setTimeout(function () { hot = ""; drawChip(); clearChipDemo(); }, Math.max(2000, steps.length * 450 + 700)));
    BOT.say(P.demoText, "happy", "good");
    beep(560, 80);
}

function setExecInst(inst) {
    execInst = inst;
    ["ADD", "LW", "BEQ"].forEach(function (k) { el("inst_" + k).className = "inst-pill" + (k === inst ? " on" : ""); });
    el("execName").textContent = inst;
    if (typeof placeGreenSpot === "function") placeGreenSpot();
    var hints = {
        ADD: "ADD path: CU → DEC → REG → ALU → REG (skips Cache!)",
        LW: game.parts.l1.on ? "LW path: CU → DEC → REG → ALU → ⚡ L1 Cache → REG" : "LW path: CU → DEC → REG → ALU → 🐢 Slow RAM (no L1 yet!)",
        BEQ: "BEQ path: CU → DEC → REG → ALU (cmp) → CU/PC"
    };
    el("traceReadout").textContent = hints[inst];
}

function l1HitRate() { var lv = lvl("l1"); return lv > 0 ? [0, 0.72, 0.80, 0.88, 0.93, 0.96][lv] : 0; }

function traceExecPath(l1HitOverride) {
    if (activeFault) return;
    var hasL1 = game.parts.l1.on, l1Hit = (l1HitOverride !== undefined) ? l1HitOverride : (hasL1 && Math.random() < l1HitRate());
    var lwMem = hasL1
        ? (l1Hit ? [["l1", "⚡L1 Hit"]] : (game.parts.l2.on ? [["l1", "L1 Miss"], ["l2", "L2"]] : [["l1", "L1 Miss"]]))
        : [];
    var rawPaths = {
        ADD: [["decoder", "Dec"], ["cu", "Ctrl"], ["regs", "Read"], ["alu", "Add"], ["regs", "Write"]],
        LW: [["decoder", "Dec"], ["cu", "Ctrl"], ["regs", "Base"], ["alu", "Addr"]].concat(lwMem).concat([["regs", "Load"]]),
        BEQ: [["decoder", "Dec"], ["cu", "Ctrl"], ["regs", "Read"], ["alu", "Cmp"], ["cu", "Branch PC"]]
    };
    var steps = rawPaths[execInst].filter(function (p) { return game.parts[p[0]] && game.parts[p[0]].on; });
    for (var t = 0; t < traceTimers.length; t++) clearTimeout(traceTimers[t]);
    traceTimers = [];
    if (steps.length === 0) { el("traceReadout").textContent = "Open MENU → STAGES to build Stage 1 and watch the 3D path light up!"; return; }
    var labels = [];
    steps.forEach(function (pair, idx) {
        traceTimers.push(setTimeout(function () {
            if (!game.reduce) { hot = pair[0]; drawChip(); }
            labels.push(PART[pair[0]].short + "(" + pair[1] + ")");
            var suffix = "";
            if (execInst === "LW" && idx === steps.length - 1) {
                if (!hasL1) suffix = " → 🐢 Slow RAM! (Need L1)";
                else if (!l1Hit && !game.parts.l2.on) suffix = " → 🐢 L1 Miss → Slow RAM!";
            }
            el("traceReadout").textContent = execInst + ": " + labels.join(" → ") + suffix;
        }, idx * 160));
    });
    traceTimers.push(setTimeout(function () { hot = ""; drawChip(); }, steps.length * 160 + 250));
}

function timingSpeed() {
    var mult = 1 + totalLevels() / 100;
    if (mult > TIMING_MAX_MULT) mult = TIMING_MAX_MULT;
    if (overclockOn && lvl('clock') > 0) mult *= 1.35;
    return TIMING_BASE_SPEED * mult;
}
function instGreenHalf() {
    var base = GREEN_HALF;
    if (execInst === "ADD") base = 0.044;
    else if (execInst === "LW") base = lvl("l1") > 0 ? 0.036 + lvl("l1") * 0.002 : 0.028;
    else if (execInst === "BEQ") base = lvl("pipe") > 0 ? 0.040 : 0.032;
    return (overclockOn && lvl('clock') > 0) ? base * 0.65 : base;
}
function placeGreenSpot() {
    var yellowPad = 0.12;
    timing.greenCenter = 0.18 + Math.random() * 0.64;
    timing.greenHalf = instGreenHalf();
    var g = el("timingGreen"), yl = el("timingYellowL"), yr = el("timingYellowR");
    if (!g) return;
    var gLeft = timing.greenCenter - timing.greenHalf, gWidth = timing.greenHalf * 2;
    g.style.left = (gLeft * 100) + "%";
    g.style.width = (gWidth * 100) + "%";
    if (yl) { yl.style.left = (Math.max(0, gLeft - yellowPad) * 100) + "%"; yl.style.width = (Math.min(yellowPad, gLeft) * 100) + "%"; }
    if (yr) { yr.style.left = ((gLeft + gWidth) * 100) + "%"; yr.style.width = (Math.min(yellowPad, 1 - (gLeft + gWidth)) * 100) + "%"; }
}
function timingZone(pos) {
    var d = Math.abs(pos - timing.greenCenter);
    if (d <= timing.greenHalf) return "green";
    if (d <= timing.greenHalf + 0.12) return "yellow";
    return "red";
}
function hitTiming() {
    if (timing.locked || (typeof overlaysOpen === 'function' && overlaysOpen())) return;
    timing.locked = true;
    var bar = el("timingBar"), btn = el("runBtn");
    if (bar) bar.classList.add("locked");
    if (btn) btn.disabled = true;

    var zone = timingZone(timing.pos);
    var mult = (zone === "green") ? 1.25 : 0.75;
    var tag = "", l1HitRoll;
    if (execInst === "LW") {
        var hit = lvl("l1") > 0 && Math.random() < l1HitRate(); l1HitRoll = hit;
        if (hit) { mult *= 1.35; tag = " ⚡L1 HIT"; }
        else { mult *= 0.72; tag = lvl("l1") > 0 ? " 🐢L1 MISS" : " 🐢RAM STALL"; }
    } else if (execInst === "BEQ") {
        var flushChance = Math.max(0.04, 0.28 - (lvl("cu") + lvl("pipe")) * 0.03);
        if (Math.random() < flushChance) { mult *= 0.75; tag = " 🧹FLUSH"; }
        else { mult *= 1.20; tag = " 🎯PRED"; }
    }
    var v = Math.round(clickPower() * mult * 100) / 100;
    gainCp(v);
    if (zone === "green") beep(640, 60);

    var wrap = el("chipWrap"), f = document.createElement("div");
    f.className = "float";
    f.style.color = (zone === "green") ? "#137a57" : (zone === "yellow" ? "#a56a00" : "#b04545");
    f.innerHTML = "+" + v + " <small style='font-size:12px'>" + mult.toFixed(2) + "×" + tag + "</small>";
    f.style.left = (38 + Math.random() * 24) + "%";
    f.style.top = (30 + Math.random() * 20) + "%";
    wrap.appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 950);

    traceExecPath(l1HitRoll);

    setTimeout(function () {
        placeGreenSpot();
        timing.locked = false;
        if (bar) bar.classList.remove("locked");
        if (btn) btn.disabled = false;
    }, zone === "green" ? 220 : 160);
}

function toggleOverclock() {
    if (lvl("clock") <= 0) { toast("Build the Clock in Stage 2 first!"); return; }
    overclockOn = !overclockOn;
    applyMotion();
    placeGreenSpot();
    renderHud();
    if (overclockOn) {
        BOT.say("🔥 <b>OVERCLOCK ON!</b> 1.5× speed, hotter die &amp; tighter setup window! That's the Power Wall—why CPUs add Multi-core.", "party", "warn");
        beep(700, 90);
    } else {
        BOT.say("Overclock OFF · nominal clock &amp; wider setup margin restored.", "idle", "");
        beep(420, 70);
    }
}
