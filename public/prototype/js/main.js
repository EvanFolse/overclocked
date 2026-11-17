// main.js: save/load, income timers, start-up (must load LAST)
// ---------------------------------------------------------
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); } catch (e) { } }
function load() {
    try {
        var s = localStorage.getItem(SAVE_KEY); if (!s) return; var g = JSON.parse(s), base = newGame();
        base.cp = g.cp || 0; base.earned = g.earned || 0; base.answers = g.answers || 0; base.right = g.right || 0;
        base.seenWelcome = !!(g.seenWelcome || g.seenHelp); base.finaleShown = !!g.finaleShown; base.reduce = !!g.reduce; base.sound = (g.sound !== false); base.stars = g.stars || {};
        if (g.seenStages && g.seenStages.length == 5) base.seenStages = g.seenStages; if (g.archChoices) base.archChoices = g.archChoices;
        if (g.confusions) base.confusions = g.confusions; if (g.stageConfusions && g.stageConfusions.length == 5) base.stageConfusions = g.stageConfusions;
        if (g.objStats && g.objStats.length == 5) base.objStats = g.objStats; base.dareIdx = g.dareIdx || 0;
        if (g.stages && g.stages.length == 5) base.stages = g.stages;
        for (var i = 0; i < PARTS.length; i++) { var k = PARTS[i].key; if (g.parts && g.parts[k]) { base.parts[k].on = !!g.parts[k].on; base.parts[k].level = g.parts[k].level || 1; base.parts[k].h = base.parts[k].on ? heightOf(base.parts[k].level) : 0; } }
        game = base;
    } catch (e) { }
}
function renderAll() { renderLeft(); renderBot(); renderStats(); renderHud(); renderRight(); drawChip(); }
setInterval(function () { gainCp(totalCps() / 10); }, 100);
setInterval(function () {
    updateFrenzyUi(); var diff = game.cp - shownCp; if (Math.abs(diff) < 1) shownCp = game.cp; else shownCp += diff * 0.25; el("cp").innerHTML = fmt(shownCp) + " CP";
    if (!G && !view && tab == "upgrades") { var key = ""; for (var i = 0; i < PARTS.length; i++) { var p = game.parts[PARTS[i].key]; if (p.on && p.level < maxLevelFor(PARTS[i].key) && game.cp >= upCost(PARTS[i].key)) key += PARTS[i].key + ","; } if (key != lastAfford) { lastAfford = key; renderRight(); } }
}, 60);
setInterval(function () { if (installedCount() >= 2 && !goldenActive && !modalsBusy()) spawnGoldenChip(); }, 22000);
setInterval(save, 5000);
load(); shownCp = game.cp; applyMotion(); renderAll();
if (!game.seenWelcome) openWelcome();
if (installedCount() >= 2) setTimeout(spawnGoldenChip, 8000);
