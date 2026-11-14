// ui.js: Left/center/right panels, tabs, upgrades, learning, progress, settings
// ---------------------------------------------------------
function renderLeft() {
    var h = ""; for (var i = 0; i < STAGES.length; i++) { var st = game.stages[i], sub = st == "open" ? ((i == 0 && !game.parts.cu.on) ? "Open · play to build!" : "Open · play challenges") : st == "passed" ? "Complete ✓ · replay / debrief" : "Locked"; h += "<div class='stagecard " + st + "' onclick='openHub(" + i + ")'><div class='t'>" + (i + 1) + " · " + STAGES[i].name + "</div><div class='s'>" + sub + "</div></div>"; }
    el("stageList").innerHTML = h;
}
function renderHud() {
    el("cps").innerHTML = "+" + totalCps().toFixed(1) + " CP/sec" + (currentFrenzyMult() > 1 ? " (" + currentFrenzyMult() + "×)" : "");
    el("build").innerHTML = "BUILD LEVEL " + totalLevels(); el("clickVal").innerHTML = "+" + clickPower();
    var pc = 0; for (var i = 0; i < 5; i++)if (game.stages[i] === "passed") pc++;
    el("era").innerHTML = (pc > 0 ? STAGES[pc - 1].model.toUpperCase() : "MODEL 0 · BARE SILICON") + " · " + (game.archChoices.isa || "risc").toUpperCase();
    refreshDiagUi();
}
function renderStats() {
    var m = clockMHz(), ck = m > 0 ? ((m >= 1000) ? (m / 1000).toFixed(1) + " GHz" : m + " MHz") : "—";
    var cards = [["WORD WIDTH", wordWidthText()], ["CLOCK", ck], ["IDEAL IPC", ipcNow()], ["L1 CACHE", l1CacheText()], ["CORES", coresNow()]], h = "";
    for (var i = 0; i < cards.length; i++)h += "<div class='stat'><div class='k'>" + cards[i][0] + "</div><div class='v'>" + cards[i][1] + "</div></div>";
    el("stats").innerHTML = h;
}
function toast(msg) { var t = el("toast"); t.innerHTML = msg; t.classList.add("show"); clearTimeout(toast._tid); toast._tid = setTimeout(function () { t.classList.remove("show"); }, 2600); }
function clickPart(key) {
    if (activeFault && !G) {
        var stIdx = PART[activeFault.ans].stage - 1; game.answers++;
        if (key === activeFault.ans) {
            if (activeFault.firstTry) { game.right++; game.objStats[stIdx].hits++; }
            var reward = Math.max(40, Math.round(totalCps() * 8 + 40)); gainCp(reward); setHot(key); toast("✅ Repaired " + PART[key].short + "! +" + reward + " CP");
            BOT.hit(activeFault.cKey, "✅ Repaired <b>" + PART[key].name + "</b>! " + activeFault.why);
            var wf = activeFault.firstTry; activeFault = null; refreshDiagUi(); renderHud(); BOT.checkDare({ faultFirstTry: wf }); if (!view && tab == "progress") renderRight();
        } else {
            activeFault.firstTry = false; game.objStats[stIdx].misses++;
            var hint = (activeFault.wrong && activeFault.wrong[key]) || (PART[key].name + ": " + PART[key].what);
            toast("❌ Not " + PART[key].short + "!"); BOT.miss(activeFault.cKey, hint); beep(180, 140);
        }
        return;
    }
    selected = key; if (!G && !view) { tab = "learning"; learnOpen = key; } drawChip(); renderRight(); BOT.say("Inspecting <b>" + PART[key].name + "</b>: " + PART[key].what, "idle", "");
}
function clickSlot(key) { toast("Locked: play Stage " + PART[key].stage + " on the left to install " + PART[key].short); }
function setTab(t) { tab = t; if (G) { stopGameTimers(G); G = null; } view = null; renderRight(); }
function renderRight() {
    var tabs = ["upgrades", "learning", "progress", "settings"];
    for (var i = 0; i < tabs.length; i++)el("tab_" + tabs[i]).className = (tabs[i] == tab && !G && !view) ? "on" : "";
    el("tabs").style.display = (G || view) ? "none" : "flex";
    if (G) return; if (view) { renderHub(); return; }
    if (tab == "upgrades") renderUpgrades(); if (tab == "learning") renderLearning(); if (tab == "progress") renderProgress(); if (tab == "settings") renderSettings();
}
function renderUpgrades() {
    var h = "<h2 class='h'>UPGRADES</h2><p class='muted'>Spend CP to level up hardware. Higher module stars unlock Lv 3–5 (★→Lv2, ★★→Lv4, ★★★→Lv5).</p>", cnt = 0;
    for (var g = 1; g <= 5; g++) {
        var part = "";
        for (var i = 0; i < PARTS.length; i++) {
            var P = PARTS[i]; if (P.stage != g || !game.parts[P.key].on) continue; cnt++; var p = game.parts[P.key], cap = maxLevelFor(P.key);
            var next = (p.level < 5) ? "-> " + P.levels[p.level] + " <span style='color:#6b7f92'>(" + P.levelNotes[p.level] + ")</span>" : "MAX: " + P.levels[4];
            part += "<div class='part" + (selected == P.key ? " sel" : "") + "'><div class='top'><div><span class='swatch' style='background:" + P.color + "'></span><span class='nm'>" + P.name + "</span><span class='lv'>Lv " + p.level + "/" + cap + "</span></div>";
            if (p.level >= 5) part += "<b class='mono' style='font-size:12px'>MAX</b>";
            else if (p.level >= cap) part += "<button class='upg cap' onclick=\"openGame('" + P.key + "','upgrades')\">Need " + needStarFor(p.level + 1) + "</button>";
            else { var cost = upCost(P.key); part += "<button class='upg" + (game.cp >= cost ? " can" : "") + "' onclick=\"buyUpgrade('" + P.key + "')\">" + fmt(cost) + " CP</button>"; }
            part += "</div><div class='muted'>" + P.desc + " +" + (P.cps * p.level) + " CP/sec</div><div class='nx'>" + next + "</div><button class='btn' onclick=\"openGame('" + P.key + "','upgrades')\">▶ Play " + GAMES[P.key].title + " " + starsText(P.key) + "</button></div>";
        }
        if (part != "") h += "<div class='label' style='margin-top:16px'>" + TAGS[g - 1] + "</div>" + part;
    }
    if (cnt == 0) h += "<div class='part'><b>No parts installed yet.</b><div class='muted'>Click <b>1 · KNOW CPU</b> on the left and earn ★ to build your first 3D CPU parts!</div></div>";
    el("rbody").innerHTML = h;
}
function buyUpgrade(key) {
    var p = game.parts[key], cap = maxLevelFor(key); if (p.level >= cap) { toast("Earn " + needStarFor(p.level + 1) + " in " + GAMES[key].title + " to unlock Lv " + (p.level + 1) + "!"); return; }
    var cost = upCost(key); if (game.cp < cost) { toast("Not enough CP yet!"); return; }
    game.cp -= cost; p.level++; kickAnim(); renderHud(); renderStats(); renderRight(); BOT.say("Upgraded <b>" + PART[key].name + "</b> to Lv " + p.level + ": " + PART[key].levelNotes[p.level - 1], "happy", "good");
}
function renderLearning() {
    var h = "<h2 class='h'>LEARNING</h2><p class='muted'>Architecture notes grounded in textbook CPU tiers. Click a part on the chip to jump here.</p>";
    for (var i = 0; i < PARTS.length; i++) {
        var P = PARTS[i], p = game.parts[P.key];
        h += "<div class='part" + (learnOpen == P.key ? " sel" : "") + "' style='cursor:pointer' onclick=\"openLearn('" + P.key + "')\">";
        if (!p.on) { h += "<span class='swatch' style='background:#c5ced8'></span><span class='nm' style='color:#8a99a8'>🔒 " + P.name + "</span><div class='muted'>Pass Stage " + P.stage + " to unlock.</div></div>"; continue; }
        h += "<span class='swatch' style='background:" + P.color + "'></span><span class='nm'>" + P.name + "</span><span class='lv'>Lv " + p.level + "</span>";
        if (learnOpen == P.key) {
            h += "<p class='muted'>" + P.what + "</p><p class='muted'><b>Analogy:</b> " + P.analogy + "</p><div class='nx'>Current (Lv " + p.level + "): " + P.levels[p.level - 1] + " — " + P.levelNotes[p.level - 1] + "</div>";
            if (p.level < 5) h += "<div class='nx'>Next (Lv " + (p.level + 1) + "): " + P.levels[p.level] + " — " + P.levelNotes[p.level] + "</div>";
        } else h += "<div class='muted'>" + P.desc + "</div>";
        h += "</div>";
    }
    el("rbody").innerHTML = h;
}
function openLearn(key) { learnOpen = (learnOpen == key) ? "" : key; if (game.parts[key].on) { selected = key; drawChip(); } renderRight(); }
function renderProgress() {
    var passed = 0, installed = 0, starTotal = 0, next = "All 5 models built! View CPU Evolution or test Benchmarks.";
    for (var i = 0; i < 5; i++)if (game.stages[i] == "passed") passed++; for (var j = 0; j < PARTS.length; j++)if (game.parts[PARTS[j].key].on) installed++;
    for (var sk in game.stars) starTotal += game.stars[sk]; for (var k = 0; k < 5; k++)if (game.stages[k] == "open") { next = "Play Stage " + (k + 1) + ": " + STAGES[k].name; break; }
    var totHits = 0, totMiss = 0; for (var o = 0; o < 5; o++) { var s = game.objStats[o] || { hits: 0, misses: 0 }; totHits += s.hits; totMiss += s.misses; }
    var accPct = (totHits + totMiss) > 0 ? Math.round((totHits / (totHits + totMiss)) * 100) : 100;
    var confSlices = [], sliceCols = ["#ef4444", "#f59e0b", "#f97316", "#ec4899"], confPairs = [];
    for (var ck in game.confusions) if (game.confusions[ck] > 0 && CONFUSIONS[ck]) confPairs.push({ k: ck, c: game.confusions[ck] });
    confPairs.sort(function (a, b) { return b.c - a.c; });
    confSlices.push({ label: "Correct / Mastered", value: Math.max(1, totHits), color: "#10b981" });
    for (var p = 0; p < Math.min(3, confPairs.length); p++)confSlices.push({ label: CONFUSIONS[confPairs[p].k].title, value: confPairs[p].c, color: sliceCols[p] });
    if (totMiss > 0 && confPairs.length === 0) confSlices.push({ label: "Timing / Slips", value: totMiss, color: "#94a3b8" });
    var h = "<h2 class='h'>PROGRESS &amp; LEARNING EVIDENCE</h2>";
    h += "<div class='donut-card' style='margin-bottom:10px;'><div class='label' style='margin-bottom:4px;'>OVERALL MASTERY &amp; WEAK SPOTS</div>" + buildDonutSvg(confSlices, accPct + "%", "OVERALL") + "<div class='donut-legend'>" + confSlices.map(function (sl) { return "<div class='donut-leg-row'><span><span class='donut-dot' style='background:" + sl.color + "'></span>" + sl.label + "</span><b class='mono'>" + sl.value + "</b></div>"; }).join("") + "</div></div>";
    h += "<div class='part'><b>Stages passed</b> " + passed + " / 5<div class='bar'><div style='width:" + (passed * 20) + "%'></div></div><b>Parts installed</b> " + installed + " / " + PARTS.length + "<div class='bar'><div style='width:" + (installed * 100 / PARTS.length) + "%'></div></div><b>Minigame stars</b> " + starTotal + " / " + (PARTS.length * 3) + "<div class='bar'><div style='width:" + (starTotal * 100 / (PARTS.length * 3)) + "%'></div></div></div>";
    h += "<div class='part'><b>Measurable Objective Accuracy</b><div class='muted' style='font-size:11px;margin-bottom:8px'>Display-only evidence across all 5 course objectives:</div>";
    for (var ob = 0; ob < 5; ob++) { var st = game.objStats[ob] || { hits: 0, misses: 0 }, tot = st.hits + st.misses, pct = tot > 0 ? Math.round((st.hits / tot) * 100) : 0; h += "<div style='font-size:12px;display:flex;justify-content:space-between;'><span>" + STAGES[ob].objTitle + "</span><b class='mono'>" + (tot > 0 ? pct + "% (" + st.hits + "/" + tot + ")" : "—") + "</b></div><div class='bar'><div style='width:" + pct + "%'></div></div>"; }
    var topCk = topConfusionKey(); if (topCk) h += "<div style='margin-top:6px;font-size:12px;color:#b45309'><b>Top Weak Spot:</b> " + CONFUSIONS[topCk].title + " <button class='ghost' style='margin-left:6px;padding:2px 8px;' onclick=\"openConfusionKey('" + topCk + "')\">⚖️ Review</button></div>";
    h += "</div><div class='part'><b>Total CP earned</b><div class='mono' style='font-size:20px;color:#1f9d73'>" + fmt(game.earned) + "</div></div>";
    h += "<div class='part'><b>Next goal</b><div class='muted'>" + next + "</div>" + (allStagesPassed() ? "<button class='btn' style='margin-top:6px' onclick='openEvolution(false)'>🏆 View CPU Evolution &amp; Feedback</button>" : "") + "</div>";
    el("rbody").innerHTML = h;
}
function renderSettings() {
    var h = "<h2 class='h'>SETTINGS</h2><div class='part'><b>Welcome &amp; Finale Preview</b><div class='muted'>Replay the animated start screen, or preview the 5-Model CPU Evolution + end-of-game Feedback flow.</div><button class='btn' onclick='openWelcome()'>Show Welcome Screen</button><button class='ghost' onclick='openEvolution(true)'>🎬 Preview Ending (Models 1–5 &amp; Feedback)</button></div>";
    h += "<div class='part'><b>Reduce motion</b><div class='muted'>Turns off floating chip, glowing wires and rising animations.</div><button class='btn' onclick='toggleReduce()'>" + (game.reduce ? "Motion is OFF (click to turn on)" : "Motion is ON (click to turn off)") + "</button></div>";
    h += "<div class='part'><b>Sound effects</b><div class='muted'>Beeps for hits and misses in minigames.</div><button class='btn' onclick='toggleSound()'>" + (game.sound ? "Sound is ON (click to turn off)" : "Sound is OFF (click to turn on)") + "</button></div>";
    h += "<div class='part'><b>Save</b><div class='muted'>Saves automatically under <code>" + SAVE_KEY + "</code>.</div></div>";
    h += "<div class='part'><b>Reset everything</b><div class='muted'>Deletes your chip, CP and stage progress.</div><button class='btn' style='background:#c94a4a' onclick='resetGame()'>" + (resetArmed ? "Click again to DELETE everything" : "Reset game") + "</button></div>";
    el("rbody").innerHTML = h;
}
function toggleReduce() { game.reduce = !game.reduce; applyMotion(); renderRight(); }
function applyMotion() { document.body.className = (game.reduce ? "reduce " : "") + (currentFrenzyMult() > 1 ? "frenzy-on" : ""); }
function toggleSound() { game.sound = !game.sound; renderRight(); }
function resetGame() {
    if (!resetArmed) { resetArmed = true; renderRight(); setTimeout(function () { resetArmed = false; if (!G && !view && tab == "settings") renderRight(); }, 4000); return; }
    resetArmed = false; try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
    if (G) stopGameTimers(G); frenzyUntil = 0; frenzyMult = 1; goldenActive = false; clearInterval(goldenTimer);
    G = null; view = null; activeFault = null; game = newGame(); selected = ""; hot = ""; tab = "upgrades"; learnOpen = ""; shownCp = 0;
    BOT.say("Fresh silicon ready! Open Stage 1 to begin.", "idle", ""); applyMotion(); renderAll(); openWelcome();
}
