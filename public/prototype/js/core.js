// core.js: game state, newGame(), helpers, stat functions, Execute-instruction button
// ---------------------------------------------------------
var SAVE_KEY = "overclockedBotV2Save", FB_KEY = "overclockedFeedbackList";
var game = newGame(), tab = "upgrades", learnOpen = "", selected = "", hot = "", G = null, view = null, activeFault = null, shownCp = 0, animOn = false, lastAfford = "", resetArmed = false;
var execInst = "ADD", traceTimers = [], activeBenchWl = "compute", fbDraft = { stars: 0, stage: "", issues: [] };
var frenzyMult = 1, frenzyUntil = 0, goldenTimer = null, goldenActive = false, currentGolden = null;

function emptyObjStats() { return [{ hits: 0, misses: 0 }, { hits: 0, misses: 0 }, { hits: 0, misses: 0 }, { hits: 0, misses: 0 }, { hits: 0, misses: 0 }]; }
function emptyStageConfs() { return [{}, {}, {}, {}, {}]; }
function newGame() {
    var g = { cp: 0, earned: 0, answers: 0, right: 0, seenWelcome: false, finaleShown: false, seenStages: [false, false, false, false, false], archChoices: { isa: "risc", accel: "cpu" }, confusions: {}, stageConfusions: emptyStageConfs(), objStats: emptyObjStats(), dareIdx: 0, reduce: false, sound: true, stars: {}, parts: {}, stages: ["open", "locked", "locked", "locked", "locked"] };
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
function currentFrenzyMult() { return Date.now() < frenzyUntil ? frenzyMult : 1; }
function totalCps() {
    var t = 0;
    for (var i = 0; i < PARTS.length; i++) {
        var k = PARTS[i].key, p = game.parts[k];
        if (p.on) { var m = 1; if (game.archChoices.isa === "risc" && (k === "pipe" || k === "decoder")) m = 1.15; if (game.archChoices.isa === "cisc" && k === "decoder") m = 1.25; t += PARTS[i].cps * p.level * m; }
    }
    return t * currentFrenzyMult();
}
function totalLevels() { var t = 0; for (var i = 0; i < PARTS.length; i++) { var p = game.parts[PARTS[i].key]; if (p.on) t += p.level; } return t; }
function clickPower() { return (1 + totalLevels()) * currentFrenzyMult(); }
function gainCp(n) { game.cp += n; game.earned += n; }
function installedCount() { var c = 0; for (var i = 0; i < PARTS.length; i++)if (game.parts[PARTS[i].key].on) c++; return c; }
function wordWidthText() { return lvl("alu") > 0 ? ["4-bit", "8-bit", "16-bit", "32-bit (RISC)", "64-bit"][lvl("alu") - 1] : "—"; }
function clockMHz() { return lvl("clock") > 0 ? [5, 33, 200, 1500, 4500][lvl("clock") - 1] : 0; }
function ipcNow() { return lvl("pipe") > 0 ? ["0.50", "1.00", "2.00", "3.00", "4.00"][lvl("pipe") - 1] : (lvl("cu") > 0 ? "0.25" : "—"); }
function l1CacheText() { return lvl("l1") > 0 ? ["1 KB", "4 KB", "16 KB", "32 KB", "64 KB"][lvl("l1") - 1] : "0 KB"; }
function coresNow() { return lvl("cores") > 0 ? [1, 2, 4, 8, 16][lvl("cores") - 1] : 1; }
function allStagesPassed() { for (var i = 0; i < 5; i++)if (game.stages[i] !== "passed") return false; return true; }

function setExecInst(inst) {
    execInst = inst;
    ["ADD", "LW", "BEQ"].forEach(function (k) { el("inst_" + k).className = "inst-pill" + (k === inst ? " on" : ""); });
    el("execName").textContent = inst;
    var hints = { ADD: "ADD path: CU -> DEC -> REG (read) -> ALU -> REG (write) [skips Cache!]", LW: "LW path: CU -> DEC -> REG -> ALU (addr) -> L1/L2 Cache -> REG (write)", BEQ: "BEQ path: CU -> DEC -> REG -> ALU (compare) -> CU/PC (branch target)" };
    el("traceReadout").textContent = hints[inst];
}
function runInstruction() {
    var v = clickPower(); gainCp(v);
    var f = document.createElement("div"); f.className = "float"; f.innerHTML = "+" + v;
    f.style.left = (38 + Math.random() * 24) + "%"; f.style.top = (30 + Math.random() * 20) + "%";
    if (currentFrenzyMult() > 1) f.style.color = "#d97706";
    el("chipWrap").appendChild(f);
    setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 950);
    if (game.reduce || activeFault) return;
    var rawPaths = { ADD: [["cu", "Control"], ["decoder", "Decode"], ["regs", "Read R2,R3"], ["alu", "Add"], ["regs", "Write R1"]], LW: [["cu", "Control"], ["decoder", "Decode"], ["regs", "Base Reg"], ["alu", "Addr + Off"], ["l1", "L1 Lookup"], ["l2", "L2 Check"], ["regs", "Load R1"]], BEQ: [["cu", "Control"], ["decoder", "Decode"], ["regs", "Read R1,R2"], ["alu", "Compare"], ["cu", "Branch PC"]] };
    var steps = rawPaths[execInst].filter(function (p) { return game.parts[p[0]] && game.parts[p[0]].on; });
    for (var t = 0; t < traceTimers.length; t++)clearTimeout(traceTimers[t]); traceTimers = [];
    if (steps.length === 0) { el("traceReadout").textContent = "Install Stage 1 parts (CU/ALU/REG) to watch the 3D datapath light up!"; return; }
    var labels = [];
    steps.forEach(function (pair, idx) { traceTimers.push(setTimeout(function () { hot = pair[0]; drawChip(); labels.push(PART[pair[0]].short + "(" + pair[1] + ")"); el("traceReadout").textContent = execInst + ": " + labels.join(" -> "); }, idx * 170)); });
    traceTimers.push(setTimeout(function () { hot = ""; drawChip(); }, steps.length * 170 + 250));
}
