// ui.js: Collapsible MENU, 5 tabs (STAGES, UPGRADES with 3D icons, PARTS LAB, PROGRESS, SETTINGS)
// ---------------------------------------------------------
function toggleMenu() {
    menuOpen = !menuOpen;
    el("app").classList.toggle("menu-open", menuOpen);
    el("menuToggle").innerHTML = menuOpen ? "MENU ✓" : "MENU";
    if (menuOpen) renderRight();
}

function renderStages() {
    var h = "<h2 class='h'>STAGES</h2><p class='muted'>Beat each minigame (≥70% accuracy) to mount 3D parts onto silicon. Finish a stage to unlock the next.</p>";
    for (var i = 0; i < STAGES.length; i++) {
        var st = game.stages[i];
        var sub = st === "open" ? ((i === 0 && !game.parts.cu.on) ? "Open · play to build!" : "Open · play challenges") : st === "passed" ? "Complete ✓ · replay / debrief" : "Locked";
        h += "<div class='stagecard " + st + "' onclick='openHub(" + i + ")'><div class='t'>" + (i + 1) + " · " + STAGES[i].name + "</div><div class='s'>" + sub + "</div></div>";
    }
    el("rbody").innerHTML = h;
}

function renderLeft() {
    if (menuOpen && !G && !view && tab === "stages") renderStages();
}

function renderHud() {
    var era = checkEra(true);
    el("cps").innerHTML = "+" + totalCps().toFixed(1) + " instructions/sec" + (overclockOn && lvl("clock") > 0 ? " (🔥 1.5× OC)" : "");
    var ob = el("ocBtn"); if (ob) { ob.classList.toggle("hidden", lvl("clock") <= 0); ob.classList.toggle("on", overclockOn); ob.innerHTML = overclockOn ? "🔥 OVERCLOCK: ON" : "🔥 OVERCLOCK: OFF"; }
    el("build").innerHTML = era.short + " · BUILD LEVEL " + totalLevels();
    el("clickVal").innerHTML = "+" + clickPower();
    el("era").innerHTML = era.name;
    refreshDiagUi();
}

function renderStats() {
    var m = clockMHz(), ck = m > 0 ? ((m >= 1000) ? (m / 1000).toFixed(1) + " GHz" : m + " MHz") : "—";
    var cards = [["BITS", wordWidthText()], ["CLOCK", ck], ["IDEAL IPC", ipcNow()], ["L1 CACHE", l1CacheText()], ["CORES", coresNow()]], h = "";
    for (var i = 0; i < cards.length; i++) h += "<div class='stat'><div class='k'>" + cards[i][0] + "</div><div class='v'>" + cards[i][1] + "</div></div>";
    el("stats").innerHTML = h;
}

function toast(msg) {
    var t = el("toast"); t.innerHTML = msg; t.classList.add("show");
    clearTimeout(toast._tid); toast._tid = setTimeout(function () { t.classList.remove("show"); }, 2600);
}

function clickPart(key) {
    if (activeFault && !G) {
        var stIdx = PART[activeFault.ans].stage - 1; game.answers++;
        if (key === activeFault.ans) {
            if (activeFault.firstTry) { game.right++; game.objStats[stIdx].hits++; }
            var reward = Math.max(60, Math.round(totalCps() * 8 + 60));
            gainCp(reward); setHot(key);
            toast("✅ Repaired " + PART[key].short + "! +" + fmt(reward) + " instructions");
            BOT.hit(activeFault.cKey, "✅ Repaired <b>" + PART[key].name + "</b>! " + activeFault.why);
            activeFault = null; refreshDiagUi(); renderHud();
            if (menuOpen && !view && tab === "progress") renderRight();
        } else {
            activeFault.firstTry = false; game.objStats[stIdx].misses++;
            var hint = (activeFault.wrong && activeFault.wrong[key]) || (PART[key].name + ": " + PART[key].what);
            toast("❌ Not " + PART[key].short + "!");
            BOT.miss(activeFault.cKey, hint);
            beep(180, 140);
        }
        return;
    }
    selected = key;
    if (!G && !view) {
        tab = "learning"; learnOpen = key;
        if (!menuOpen) toggleMenu(); else renderRight();
    }
    drawChip();
    playPartDemo(key);
}

function clickSlot(key) { toast("Locked: open MENU → STAGES (Stage " + PART[key].stage + ") to install " + PART[key].short); }

function setTab(t) {
    tab = t;
    if (G) { stopGameTimers(G); G = null; }
    view = null;
    if (!menuOpen) toggleMenu();
    else renderRight();
}

function renderRight() {
    var tabs = ["stages", "upgrades", "learning", "progress", "settings"];
    for (var i = 0; i < tabs.length; i++) el("tab_" + tabs[i]).className = (tabs[i] === tab && !G && !view) ? "on" : "";
    el("tabs").style.display = (G || view) ? "none" : "flex";
    if (G) return;
    if (view) { renderHub(); return; }
    if (tab === "stages") renderStages();
    if (tab === "upgrades") renderUpgrades();
    if (tab === "learning") renderLearning();
    if (tab === "progress") renderProgress();
    if (tab === "settings") renderSettings();
}

function partThumb(P) {
    var c = P.color, mid = shade(c, 0.35), dark = shade(c, -0.28), lit = shade(c, 0.55);
    var mark = P.short.length > 4 ? P.short.slice(0, 3) : P.short;
    return "<svg viewBox='0 0 64 64' aria-hidden='true'>" +
        "<polygon points='32,10 52,20 32,30 12,20' fill='" + lit + "'/>" +
        "<polygon points='12,20 32,30 32,50 12,40' fill='" + mid + "'/>" +
        "<polygon points='32,30 52,20 52,40 32,50' fill='" + dark + "'/>" +
        "<rect x='22' y='24' width='20' height='12' rx='3' fill='rgba(255,255,255,0.22)'/>" +
        "<text x='32' y='33' text-anchor='middle' font-size='7' font-family='ui-monospace,Menlo,monospace' font-weight='800' fill='#fff'>" + mark + "</text></svg>";
}

function renderUpgrades() {
    var h = "<h2 class='h'>UPGRADES</h2><p class='muted'>Spend instructions to level up hardware. Higher module stars unlock Lv 3–5 (★→Lv2, ★★→Lv4, ★★★→Lv5).</p>", cnt = 0;
    for (var g = 1; g <= 5; g++) {
        var part = "";
        for (var i = 0; i < PARTS.length; i++) {
            var P = PARTS[i]; if (P.stage !== g || !game.parts[P.key].on) continue;
            cnt++;
            var p = game.parts[P.key], cap = maxLevelFor(P.key);
            var next = (p.level < 5) ? "Next: " + P.levels[p.level] + " (" + P.levelNotes[p.level] + ")" : "MAX: " + P.levels[4];
            var rate = "+" + partCps(P.key).toFixed(1) + "/sec";
            part += "<div class='upg-card" + (selected === P.key ? " sel" : "") + "'>" +
                "<div class='upg-thumb'>" + partThumb(P) + "</div>" +
                "<div class='upg-info'><span class='nm'>" + P.name + "</span><span class='lv'>Lv " + p.level + "/" + cap + " · " + starsText(P.key) + "</span>" +
                "<div class='desc'>" + P.desc + "</div><div class='nx'>" + next + "</div>" +
                "<button class='ghost' style='margin-top:6px;padding:3px 9px;font-size:11px;' onclick=\"openGame('" + P.key + "','upgrades')\">▶ " + GAMES[P.key].title + "</button></div>" +
                "<div class='upg-buy'>";
            if (p.level >= 5) part += "<span class='maxmark'>MAX</span>";
            else if (p.level >= cap) part += "<button class='upg cap' onclick=\"openGame('" + P.key + "','upgrades')\">Need " + needStarFor(p.level + 1) + "</button>";
            else { var cost = upCost(P.key); part += "<button class='upg" + (game.cp >= cost ? " can" : "") + "' onclick=\"buyUpgrade('" + P.key + "')\">" + fmt(cost) + "</button>"; }
            part += "<div class='upg-rate'>" + rate + "</div></div></div>";
        }
        if (part !== "") h += "<div class='label upg-stage'>" + TAGS[g - 1] + "</div>" + part;
    }
    if (cnt === 0) h += "<div class='part'><b>No parts installed yet.</b><div class='muted'>Open the <b>STAGES</b> tab and play Stage 1 modules. Earn ★ to mount your first 3D CPU parts!</div></div>";
    el("rbody").innerHTML = h;
}

function buyUpgrade(key) {
    var p = game.parts[key], cap = maxLevelFor(key);
    if (p.level >= cap) { toast("Earn " + needStarFor(p.level + 1) + " in " + GAMES[key].title + " to unlock Lv " + (p.level + 1) + "!"); return; }
    var cost = upCost(key);
    if (game.cp < cost) { toast("Not enough instructions yet! Hit green on TIME IT or play a stage."); return; }
    game.cp -= cost; p.level++; kickAnim(); renderHud(); renderStats(); renderRight();
    BOT.say("Upgraded <b>" + PART[key].name + "</b> to Lv " + p.level + ": " + PART[key].levelNotes[p.level - 1], "happy", "good");
}

function renderLearning() {
    var h = "<h2 class='h'>PARTS LAB</h2><p class='muted'>Architecture notes grounded in textbook CPU tiers. Click a part on the chip to inspect it.</p>";
    for (var i = 0; i < PARTS.length; i++) {
        var P = PARTS[i], p = game.parts[P.key];
        h += "<div class='part" + (learnOpen === P.key ? " sel" : "") + "' style='cursor:pointer' onclick=\"openLearn('" + P.key + "')\">";
        if (!p.on) { h += "<span class='swatch' style='background:#c5ced8'></span><span class='nm' style='color:#8a99a8'>🔒 " + P.name + "</span><div class='muted'>Pass Stage " + P.stage + " to unlock.</div></div>"; continue; }
        h += "<span class='swatch' style='background:" + P.color + "'></span><span class='nm'>" + P.name + "</span><span class='lv'>Lv " + p.level + "</span><button class='ghost' style='float:right;padding:3px 8px' onclick=\"event.stopPropagation();playPartDemo('" + P.key + "')\">🎬 Demo</button>";
        if (learnOpen === P.key) {
            h += "<p class='muted'>" + P.what + "</p><p class='muted'><b>Analogy:</b> " + P.analogy + "</p><div class='nx'>Current (Lv " + p.level + "): " + P.levels[p.level - 1] + " — " + P.levelNotes[p.level - 1] + "</div>";
            if (p.level < 5) h += "<div class='nx'>Next (Lv " + (p.level + 1) + "): " + P.levels[p.level] + " — " + P.levelNotes[p.level] + "</div>";
        } else h += "<div class='muted'>" + P.desc + "</div>";
        h += "</div>";
    }
    el("rbody").innerHTML = h;
}

function openLearn(key) { learnOpen = (learnOpen === key) ? "" : key; if (game.parts[key].on) { selected = key; drawChip(); playPartDemo(key); } renderRight(); }

function renderProgress() {
    var passed = 0, installed = 0, starTotal = 0, next = "All 5 models built! View CPU Evolution or replay for ★★★.";
    for (var i = 0; i < 5; i++) if (game.stages[i] === "passed") passed++;
    for (var j = 0; j < PARTS.length; j++) if (game.parts[PARTS[j].key].on) installed++;
    for (var sk in game.stars) starTotal += game.stars[sk];
    for (var k = 0; k < 5; k++) if (game.stages[k] === "open") { next = "Play Stage " + (k + 1) + ": " + STAGES[k].name; break; }

    var era = currentEra(), nxt = nextEra(), eraIdx = 0;
    for (var ei = 0; ei < CHIP_ERAS.length; ei++) if (CHIP_ERAS[ei].id === era.id) { eraIdx = ei; break; }

    var totHits = 0, totMiss = 0;
    for (var o = 0; o < 5; o++) { var s = game.objStats[o] || { hits: 0, misses: 0 }; totHits += s.hits; totMiss += s.misses; }
    var accPct = (totHits + totMiss) > 0 ? Math.round((totHits / (totHits + totMiss)) * 100) : 100;
    var confSlices = [], sliceCols = ["#ef4444", "#f59e0b", "#f97316", "#ec4899"], confPairs = [];
    for (var ck in game.confusions) if (game.confusions[ck] > 0 && CONFUSIONS[ck]) confPairs.push({ k: ck, c: game.confusions[ck] });
    confPairs.sort(function (a, b) { return b.c - a.c; });
    confSlices.push({ label: "Correct / Mastered", value: Math.max(1, totHits), color: "#10b981" });
    for (var p = 0; p < Math.min(3, confPairs.length); p++) confSlices.push({ label: CONFUSIONS[confPairs[p].k].title, value: confPairs[p].c, color: sliceCols[p] });
    if (totMiss > 0 && confPairs.length === 0) confSlices.push({ label: "Timing / Slips", value: totMiss, color: "#94a3b8" });

    var h = "<h2 class='h'>PROGRESS &amp; MASTERY</h2>";
    h += "<div class='part'><b>Chip era</b><div class='mono' style='font-size:15px;color:#4a47c8;margin-top:4px'>" + era.name + "</div><div class='muted' style='margin-top:4px'>" + era.blurb + "</div><div class='bar' style='margin-top:8px'><div style='width:" + (eraIdx * 100 / (CHIP_ERAS.length - 1)) + "%'></div></div><div class='muted'>" + (nxt ? ("Next: " + nxt.name + ". " + era.nextHint) : era.nextHint) + "</div></div>";
    h += "<div class='donut-card' style='margin-bottom:10px;'><div class='label' style='margin-bottom:4px;'>OVERALL MASTERY &amp; WEAK SPOTS</div>" + buildDonutSvg(confSlices, accPct + "%", "OVERALL") + "<div class='donut-legend'>" + confSlices.map(function (sl) { return "<div class='donut-leg-row'><span><span class='donut-dot' style='background:" + sl.color + "'></span>" + sl.label + "</span><b class='mono'>" + sl.value + "</b></div>"; }).join("") + "</div></div>";
    h += "<div class='part'><b>Stages passed</b> " + passed + " / 5<div class='bar'><div style='width:" + (passed * 20) + "%'></div></div><b>Parts installed</b> " + installed + " / " + PARTS.length + "<div class='bar'><div style='width:" + (installed * 100 / PARTS.length) + "%'></div></div><b>Minigame stars</b> " + starTotal + " / " + (PARTS.length * 3) + "<div class='bar'><div style='width:" + (starTotal * 100 / (PARTS.length * 3)) + "%'></div></div></div>";
    h += "<div class='part'><b>Course Objective Accuracy</b><div class='muted' style='font-size:11px;margin-bottom:8px'>Evidence across all 5 COD objectives:</div>";
    for (var ob = 0; ob < 5; ob++) { var st = game.objStats[ob] || { hits: 0, misses: 0 }, tot = st.hits + st.misses, pct = tot > 0 ? Math.round((st.hits / tot) * 100) : 0; h += "<div style='font-size:12px;display:flex;justify-content:space-between;'><span>" + STAGES[ob].objTitle + "</span><b class='mono'>" + (tot > 0 ? pct + "% (" + st.hits + "/" + tot + ")" : "—") + "</b></div><div class='bar'><div style='width:" + pct + "%'></div></div>"; }
    var topCk = topConfusionKey(); if (topCk) h += "<div style='margin-top:6px;font-size:12px;color:#b45309'><b>Top Weak Spot:</b> " + CONFUSIONS[topCk].title + " <button class='ghost' style='margin-left:6px;padding:2px 8px;' onclick=\"openConfusionKey('" + topCk + "')\">⚖️ Review</button></div>";
    h += "</div><div class='part'><b>Total instructions earned</b><div class='mono' style='font-size:20px;color:#1f9d73'>" + fmt(game.earned) + "</div></div>";
    h += "<div class='part'><b>Next goal</b><div class='muted'>" + next + "</div>" + (allStagesPassed() ? "<button class='btn' style='margin-top:6px' onclick='openEvolution(false)'>🏆 View CPU Evolution &amp; Feedback</button>" : "") + "</div>";
    el("rbody").innerHTML = h;
}

function renderSettings() {
    var h = "<h2 class='h'>SETTINGS</h2><div class='part'><b>Welcome &amp; Finale Preview</b><div class='muted'>Replay the animated start screen, or preview the 5-Model CPU Evolution + Feedback flow.</div><button class='btn' onclick='openWelcome()'>Show Welcome Screen</button><button class='ghost' onclick='openEvolution(true)'>🎬 Preview Ending (Models 1–5 &amp; Feedback)</button></div>";
    h += "<div class='part'><b>Reduce motion</b><div class='muted'>Turns off floating chip, glowing wires and rising animations.</div><button class='btn' onclick='toggleReduce()'>" + (game.reduce ? "Motion is OFF (click to turn on)" : "Motion is ON (click to turn off)") + "</button></div>";
    h += "<div class='part'><b>Sound effects</b><div class='muted'>Beeps for hits and misses in minigames.</div><button class='btn' onclick='toggleSound()'>" + (game.sound ? "Sound is ON (click to turn off)" : "Sound is OFF (click to turn on)") + "</button></div>";
    h += "<div class='part'><b>Showcase / Grading Mode</b><div class='muted'>Unlock all 5 stages right away so instructors or reviewers can play any stage in any order.</div><button class='btn' style='background:#0ea5e9' onclick='unlockAllStages()'>🎓 Unlock All 5 Stages</button></div>";
    h += "<div class='part'><b>Save</b><div class='muted'>Saves automatically under <code>" + SAVE_KEY + "</code>.</div></div>";
    h += "<div class='part'><b>Reset everything</b><div class='muted'>Deletes your chip, instructions and stage progress.</div><button class='btn' style='background:#c94a4a' onclick='resetGame()'>" + (resetArmed ? "Click again to DELETE everything" : "Reset game") + "</button></div>";
    el("rbody").innerHTML = h;
}

function toggleReduce() { game.reduce = !game.reduce; applyMotion(); renderRight(); }
function applyMotion() { document.body.className = (game.reduce ? "reduce " : "") + (overclockOn && lvl("clock") > 0 ? "overclock-on" : ""); }
function toggleSound() { game.sound = !game.sound; renderRight(); }

function resetGame() {
    if (!resetArmed) { resetArmed = true; renderRight(); setTimeout(function () { resetArmed = false; if (!G && !view && tab === "settings" && menuOpen) renderRight(); }, 4000); return; }
    resetArmed = false; try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
    if (G) stopGameTimers(G);
    G = null; view = null; activeFault = null; game = newGame();
    overclockOn = false; selected = ""; hot = ""; tab = "stages"; learnOpen = ""; shownCp = 0; lastEraId = "bare";
    if (menuOpen) toggleMenu();
    BOT.say("Fresh silicon ready! Open <b>MENU → STAGES</b> to begin.", "idle", "");
    applyMotion(); renderAll(); openWelcome();
}

function unlockAllStages() {
    for (var i = 0; i < 5; i++) if (game.stages[i] === "locked") game.stages[i] = "open";
    save(); renderStages(); renderRight();
    toast("🎓 All 5 stages unlocked! Open STAGES to play any level.");
    BOT.say("🎓 <b>Showcase Mode:</b> All 5 stages unlocked in <b>MENU → STAGES</b>!", "happy", "good");
}
