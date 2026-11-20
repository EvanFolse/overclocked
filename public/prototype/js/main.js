// main.js: save/load, income timers, fault timer, TIME IT loop, start-up (must load LAST)
// ---------------------------------------------------------
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); } catch (e) { } }

function load() {
    try {
        var s = localStorage.getItem(SAVE_KEY); if (!s) return;
        var g = JSON.parse(s), base = newGame();
        base.cp = g.cp || 0; base.earned = g.earned || 0; base.answers = g.answers || 0; base.right = g.right || 0;
        base.seenWelcome = !!(g.seenWelcome || g.seenHelp); base.finaleShown = !!g.finaleShown;
        base.reduce = !!g.reduce; base.sound = (g.sound !== false); base.stars = g.stars || {};
        if (g.seenStages && g.seenStages.length === 5) base.seenStages = g.seenStages;
        if (g.archChoices && g.archChoices.isa) base.archChoices = { isa: g.archChoices.isa };
        if (g.benchPassed) base.benchPassed = g.benchPassed;
        if (g.benchBaseline) base.benchBaseline = g.benchBaseline;
        if (g.confusions) base.confusions = g.confusions;
        if (g.stageConfusions && g.stageConfusions.length === 5) base.stageConfusions = g.stageConfusions;
        if (g.objStats && g.objStats.length === 5) base.objStats = g.objStats;
        if (g.stages && g.stages.length === 5) base.stages = g.stages;
        for (var i = 0; i < PARTS.length; i++) {
            var k = PARTS[i].key;
            if (g.parts && g.parts[k]) {
                base.parts[k].on = !!g.parts[k].on;
                base.parts[k].level = g.parts[k].level || 1;
                base.parts[k].h = base.parts[k].on ? heightOf(base.parts[k].level) : 0;
            }
        }
        game = base;
    } catch (e) { }
}

function overlaysOpen() {
    var ids = ["welcomeScreen", "evolutionScreen", "stageTheater", "feedbackModal", "benchModal"];
    for (var i = 0; i < ids.length; i++) if (el(ids[i]) && !el(ids[i]).classList.contains("hidden")) return true;
    return false;
}

function renderAll() { renderStages(); renderBot(); if (typeof renderBenchList === "function") renderBenchList(); renderStats(); renderHud(); renderRight(); drawChip(); }

setInterval(function () { gainCp(totalCps() / 10); }, 100);

setInterval(function () {
    var diff = game.cp - shownCp;
    if (Math.abs(diff) < 1) shownCp = game.cp; else shownCp += diff * 0.25;
    el("cp").innerHTML = fmt(shownCp);
    if (menuOpen && !G && !view && tab === "upgrades") {
        var key = "";
        for (var i = 0; i < PARTS.length; i++) {
            var p = game.parts[PARTS[i].key];
            if (p.on && p.level < maxLevelFor(PARTS[i].key) && game.cp >= upCost(PARTS[i].key)) key += PARTS[i].key + ",";
        }
        if (key !== lastAfford) { lastAfford = key; renderRight(); }
    }
}, 60);

setInterval(function () {
    if (installedCount() >= 2 && !activeFault && !G && !overlaysOpen()) triggerFault();
}, 50000);

setInterval(save, 5000);

load();
shownCp = game.cp;
applyMotion();
placeGreenSpot();
lastEraId = currentEra().id;
eraReady = true;
renderAll();
if (!game.seenWelcome) openWelcome();

(function timingLoop(last) {
    function frame(now) {
        var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
        last = now;
        if (!timing.locked) {
            timing.pos += timingSpeed() * timing.dir * (dt / 0.016);
            if (timing.pos >= 1) { timing.pos = 1; timing.dir = -1; }
            if (timing.pos <= 0) { timing.pos = 0; timing.dir = 1; }
            var n = el("timingNeedle");
            if (n) n.style.left = (timing.pos * 100) + "%";
        }
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
})(0);

document.addEventListener("keydown", function (e) {
    if (e.code !== "Space" && e.key !== " ") return;
    if (G || overlaysOpen()) return;
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
    e.preventDefault();
    hitTiming();
});
