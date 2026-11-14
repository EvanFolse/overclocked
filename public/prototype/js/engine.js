// engine.js: Minigame engine: makeApi, timer, stars, results, stage hub, checkStages
// ---------------------------------------------------------
var GAMES = {}, audioCtx = null;
var MIN_BUILD_ACC = 70; // FIX: a part is only built if run accuracy >= this percent
function beep(f, ms) { if (!game.sound) return; try { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); var o = audioCtx.createOscillator(), v = audioCtx.createGain(); o.type = "triangle"; o.frequency.value = f; v.gain.value = 0.05; o.connect(v); v.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + ms / 1000); } catch (e) { } }
function mk(p, t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h !== undefined) e.innerHTML = h; p.appendChild(e); return e; }
function starsText(k) { var n = game.stars[k] || 0, s = ""; for (var i = 0; i < 3; i++)s += (i < n) ? "★" : "☆"; return s; }
function stopGameTimers(g) { if (!g) return; for (var i = 0; i < g.ids.length; i++) { clearInterval(g.ids[i]); clearTimeout(g.ids[i]); } g.ids = []; g.running = false; }
function openHub(i) { if (game.stages[i] == "locked") { toast("Build every part in the previous stage to unlock this one."); return; } if (G) { stopGameTimers(G); G = null; } view = { type: "hub", stage: i }; renderRight(); if (!game.seenStages[i]) { game.seenStages[i] = true; save(); openBrief(i, true); } }
function closeHub() { view = null; renderRight(); }
function renderHub() {
    var i = view.stage, st = STAGES[i], db = game.stages[i] === "passed" ? "<button class='ghost' style='margin-right:6px' onclick='openStageDebrief(" + i + ")'>📊 Debrief</button>" : "";
    var h = "<div class='rhead'><span>STAGE " + (i + 1) + " · " + st.name.toUpperCase() + "</span><div>" + db + "<button class='ghost' style='margin-right:6px' onclick='openBrief(" + i + ",false)'>🤖 Brief</button><button class='ghost' onclick='closeHub()'>✕</button></div></div><p class='muted' style='margin-top:12px'>" + st.blurb + "</p>";
    for (var j = 0; j < st.parts.length; j++) { var key = st.parts[j], P = PART[key], on = game.parts[key].on; h += "<div class='part'><div class='top'><div><span class='swatch' style='background:" + P.color + "'></span><span class='nm'>" + GAMES[key].icon + " " + GAMES[key].title + "</span></div><span class='mono'>" + starsText(key) + "</span></div><div class='muted'>" + (on ? P.name + " built (max Lv " + maxLevelFor(key) + "). Earn more ★ to unlock higher levels!" : "Earn ★ to build the " + P.name + ".") + "</div><button class='btn' onclick=\"openGame('" + key + "','hub')\">▶ " + (on ? "Play" : "Play to build") + "</button></div>"; }
    el("rbody").innerHTML = h;
}
function openGame(key, back) {
    if (G) stopGameTimers(G); var def = GAMES[key];
    G = { key: key, def: def, back: back, score: 0, combo: 0, best: 0, hits: 0, misses: 0, runConfusions: {}, left: def.time, running: false, ended: false, ids: [], onKey: null, extra: {} };
    makeApi(G); el("tabs").style.display = "none";
    var h = "<div class='rhead'><span>" + def.icon + " " + def.title + "</span><button class='ghost' onclick='quitGame()'>✕ Quit</button></div><div class='gbar'><div id='gTime'></div></div><div class='gstats'><span>SCORE <b id='gScore'>0</b></span><span id='gCombo'></span><span id='gInfo'></span></div><div id='gameBotBar'></div><div id='arena' class='arena'></div>";
    el("rbody").innerHTML = h; G.arena = el("arena"); BOT.say("Module: <b>" + PART[key].name + "</b> — mistakes cost hardware points (no exam gate—recover with combos!).", "idle", ""); showIntro();
}
function quitGame() { if (G) { stopGameTimers(G); if (G.back == "upgrades") { view = null; tab = "upgrades"; } } G = null; renderRight(); }
function showIntro() {
    var g = G, def = g.def, P = PART[g.key], ov = mk(g.arena, "div", "overlay", "");
    ov.innerHTML = "<div class='bigicon'>" + def.icon + "</div><div class='otitle'>" + def.title + "</div><div class='orule'>" + def.rule + "</div><div class='ostars'>★ " + def.stars[0] + " (Lv2) &nbsp; ★★ " + def.stars[1] + " (Lv4) &nbsp; ★★★ " + def.stars[2] + " (Lv5)</div><div class='muted' style='font-size:12px;'>Wrong actions cost -" + (def.badPenalty || 8) + " pts (hardware stall). Build needs " + MIN_BUILD_ACC + "% accuracy.</div><div>" + (game.parts[g.key].on ? "Earn CP &amp; higher stars!" : "Earn ★ to build the <b>" + P.name + "</b>!") + "</div>";
    mk(ov, "button", "bigbtn", "▶ PLAY").onclick = beginPlay;
}
function beginPlay() {
    var g = G; g.arena.innerHTML = ""; g.score = 0; g.combo = 0; g.best = 0; g.hits = 0; g.misses = 0; g.runConfusions = {}; g.left = g.def.time; g.running = true; g.ended = false; hudUpdate(g);
    if (g.def.time > 0) g.every(100, function () { g.left -= 0.1; g.setBar(g.left / g.def.time); if (g.left <= 0) endGame(); }); else g.setBar(0);
    g.def.start(g, g.arena);
}
function hudUpdate(g) { if (!el("gScore")) return; el("gScore").innerHTML = g.score; el("gCombo").innerHTML = g.combo >= 2 ? "🔥 COMBO " + g.combo + (g.mult() > 1 ? " · x" + g.mult() : "") : ""; }
function makeApi(g) {
    var objIdx = PART[g.key].stage - 1;
    g.every = function (ms, fn) { var id = setInterval(function () { if (G === g && g.running) fn(); }, ms); g.ids.push(id); return id; };
    g.after = function (ms, fn) { var id = setTimeout(function () { if (G === g && g.running) fn(); }, ms); g.ids.push(id); return id; };
    g.mult = function () { return 1 + Math.min(4, Math.floor(g.combo / 4)) * 0.5; };
    g.pop = function (t, bad) { if (!g.arena) return; var p = mk(g.arena, "div", "gpop" + (bad ? " bad" : ""), t); p.style.left = (35 + Math.random() * 30) + "%"; p.style.top = (38 + Math.random() * 16) + "%"; setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 800); };
    g.say = function (html, cls) { if (!g.arena) return; var old = g.arena.querySelector(".gtoast"); if (old) old.parentNode.removeChild(old); var t = mk(g.arena, "div", "gtoast " + (cls || ""), html); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 1800); };
    g.good = function (pts, msg, cKey) { g.hits++; game.objStats[objIdx].hits++; g.combo++; if (g.combo > g.best) g.best = g.combo; var p = Math.round(pts * g.mult()); g.score += p; g.pop("+" + p, false); beep(520 + Math.min(g.combo, 12) * 35, 90); if (msg) g.say(msg, "good"); if (cKey) BOT.hit(cKey); if (g.combo === 5) BOT.say("🔥 5-Combo streak! Your hardware intuition is locking in!", "happy", "good"); BOT.checkDare({ combo: g.combo, game: g.key, score: g.score }); hudUpdate(g); };
    g.bad = function (msg, cKey) { g.misses++; game.objStats[objIdx].misses++; var pen = g.def.badPenalty || 8; if (g.score > 0) { g.score = Math.max(0, g.score - pen); g.pop("-" + pen, true); } g.combo = 0; beep(170, 150); g.arena.classList.add("shake"); setTimeout(function () { g.arena.classList.remove("shake"); }, 300); if (msg) g.say(msg + " (-" + pen + ")", "bad"); if (cKey) { g.runConfusions[cKey] = (g.runConfusions[cKey] || 0) + 1; BOT.miss(cKey, msg); } else BOT.say(msg || "Watch carefully and adjust!", "think", "warn"); hudUpdate(g); };
    g.setBar = function (f) { var bar = el("gTime"); if (bar) bar.style.width = Math.max(0, Math.min(1, f)) * 100 + "%"; };
    g.info = function (t) { if (el("gInfo")) el("gInfo").innerHTML = t; };
    g.finish = function () { endGame(); };
}
document.addEventListener("keydown", function (e) { if (G && G.running && G.onKey && G.onKey(e.key)) e.preventDefault(); });
function endGame() {
    var g = G; if (!g || g.ended) return; g.ended = true; stopGameTimers(g); g.setBar(0);
    var stars = 0; for (var i = 0; i < 3; i++)if (g.score >= g.def.stars[i]) stars = i + 1;
            var accTot = g.hits + g.misses, accPct = accTot > 0 ? Math.round((g.hits / accTot) * 100) : 100;
            var accBlocked = (!game.parts[g.key].on && stars >= 1 && accPct < MIN_BUILD_ACC); if (accBlocked) stars = 0; // FIX: accuracy gate
    var key = g.key, P = PART[key], wasOn = game.parts[key].on, level = wasOn ? game.parts[key].level : 1, pay = Math.round(P.cost * 0.3 * stars * (1 + 0.15 * (level - 1)));
    if (game.stars[key] === undefined || stars > game.stars[key]) game.stars[key] = stars; gainCp(pay);
    var installed = false; if (stars >= 1 && !wasOn) { installPart(key); setHot(key); installed = true; }
    var stageRes = checkStages(); renderHud(); BOT.checkDare({ combo: g.best, game: key, score: g.score, stars: stars, hitRate: g.extra.hitRate || 0 });
    var tot = g.hits + g.misses, runAcc = tot > 0 ? Math.round((g.hits / tot) * 100) : 100, topRunC = "", topCnt = 0;
    for (var ck in g.runConfusions) if (g.runConfusions[ck] > topCnt && CONFUSIONS[ck]) { topCnt = g.runConfusions[ck]; topRunC = ck; }
    var debriefHtml = "";
    if (topRunC) { var ci = CONFUSIONS[topRunC]; debriefHtml = "<div class='debrief'><b>🤖 ChipBot Post-Run Debrief (" + runAcc + "% accuracy):</b><br>Watch <b>" + ci.title + "</b> (" + topCnt + " slip" + (topCnt > 1 ? "s" : "") + "): " + ci.hint1 + "</div>"; BOT.say("Run finished (" + runAcc + "% accuracy). Review <b>" + ci.title + "</b> on the left anytime!", "think", "warn"); }
    else if (stars > 0) BOT.say("Clean run (" + runAcc + "% accuracy)! " + g.def.takeaway, "happy", "good");
    var starTxt = ""; for (var s = 0; s < 3; s++)starTxt += (s < stars) ? "⭐" : "☆";
    var ov = mk(g.arena, "div", "overlay", ""), html = "<div class='stars'>" + starTxt + "</div><div class='otitle'>" + (stars > 0 ? "NICE!" : "TRY AGAIN") + "</div><div>Score <b>" + g.score + "</b> · Accuracy <b>" + runAcc + "%</b> · Best combo <b>" + g.best + "</b></div><div class='gain'>+" + fmt(pay) + " CP</div>";
    if (installed) html += "<div class='inst'>🎉 " + P.name + " built! (★ unlocks upgrades up to Lv " + maxLevelFor(key) + ")</div>";
    if (stageRes.msg != "") html += "<div class='inst'>🏁 " + stageRes.msg + "</div>";
    if (accBlocked) html += "<div class='muted'>Accuracy " + accPct + "%: you need at least " + MIN_BUILD_ACC + "% to build this part. Slow down and read the hints.</div>"; else if (stars == 0 && !wasOn) html += "<div class='muted'>Reach ★ " + g.def.stars[0] + " to build this part.</div>";
    html += debriefHtml + "<div class='muted' style='max-width:320px;font-size:12px;'>" + g.def.takeaway + "</div>"; ov.innerHTML = html;
    if (topRunC) mk(ov, "button", "ghost", "⚖️ Compare: " + CONFUSIONS[topRunC].title).onclick = function () { openConfusionKey(topRunC); };
    if (stageRes.newlyPassed.length > 0) {
        var stDone = stageRes.newlyPassed[0];
        mk(ov, "button", "bigbtn", "🤖 Open Stage " + (stDone + 1) + " Debrief Banner →").onclick = function () { quitGame(); openStageDebrief(stDone); };
        setTimeout(function () { if (!el("stageTheater").classList.contains("hidden")) return; quitGame(); openStageDebrief(stDone); }, 1100);
    } else {
        mk(ov, "button", "bigbtn", "↻ Play again").onclick = function () { openGame(key, g.back); };
        mk(ov, "button", "ghost", "Back").onclick = quitGame;
    }
}
function checkStages() {
    var msg = "", newlyPassed = [];
    for (var i = 0; i < STAGES.length; i++) {
        if (game.stages[i] != "open") continue;
        var all = true; for (var j = 0; j < STAGES[i].parts.length; j++)if (!game.parts[STAGES[i].parts[j]].on) all = false;
        if (all) { game.stages[i] = "passed"; if (i + 1 < STAGES.length && game.stages[i + 1] == "locked") game.stages[i + 1] = "open"; var b = (i + 1) * 150; gainCp(b); msg += "Stage " + (i + 1) + " complete! +" + b + " CP. "; newlyPassed.push(i); }
    }
    renderLeft(); return { msg: msg, newlyPassed: newlyPassed };
}
