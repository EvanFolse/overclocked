// bot.js: Sidebar ChipBot: tips, dares, confusion drawer
// ---------------------------------------------------------
var BOT = {
    mood: "idle", text: "Open <b>1 · KNOW CPU</b> below to build!", tone: "", drawer: "", lastCKey: "",
    say: function (msg, mood, tone) { BOT.text = msg; BOT.mood = mood || "idle"; BOT.tone = tone || ""; renderBot(); },
    miss: function (cKey, fallbackMsg) {
        game.confusions[cKey] = (game.confusions[cKey] || 0) + 1; BOT.lastCKey = cKey;
        if (CONFUSIONS[cKey]) { var st = CONFUSIONS[cKey].stage; if (!game.stageConfusions[st]) game.stageConfusions[st] = {}; game.stageConfusions[st][cKey] = (game.stageConfusions[st][cKey] || 0) + 1; }
        var count = game.confusions[cKey], info = CONFUSIONS[cKey];
        if (info) BOT.say(count >= 2 ? info.hint2 : info.hint1, count >= 2 ? "alert" : "think", "warn");
        else BOT.say(fallbackMsg || "Check the visual clue!", "think", "warn");
        save();
    },
    hit: function (cKey, msg) { if (cKey && game.confusions[cKey] > 0) game.confusions[cKey]--; if (msg) BOT.say(msg, "happy", "good"); },
    checkDare: function (ctx) { var d = BOT_DARES[game.dareIdx % BOT_DARES.length]; if (d && d.check(ctx)) { gainCp(d.reward); game.dareIdx++; BOT.say("🎉 <b>Dare Done!</b> +" + d.reward + " CP!", "party", "good"); toast("🤖 Bot Dare! +" + d.reward + " CP!"); beep(780, 130); save(); renderHud(); } }
};
function topConfusionKey() { var best = "", max = 0; for (var k in game.confusions) if (game.confusions[k] > max && CONFUSIONS[k]) { max = game.confusions[k]; best = k; } return max > 0 ? best : ""; }
function renderBot() {
    var labels = { idle: "Watching your 3D CPU", happy: "Nice move!", think: "Check the visual!", alert: "Spot the pattern!", party: "Overclocked! ★" };
    el("botFace").innerHTML = humanoidBotSvg(BOT.mood, 52, 60); el("botMoodLabel").textContent = labels[BOT.mood] || labels.idle;
    var bub = el("botBubble"); bub.className = "bot-bubble" + (BOT.tone ? " " + BOT.tone : ""); bub.innerHTML = BOT.text;
    var dare = BOT_DARES[game.dareIdx % BOT_DARES.length]; el("botDareBox").innerHTML = "<b>🎯 DARE (+" + dare.reward + " CP):</b> " + dare.text;
    var ck = topConfusionKey(), btnC = el("btnConfusion");
    if (ck) { btnC.classList.remove("hidden"); btnC.className = game.confusions[ck] >= 2 ? "pulse" : ""; } else btnC.classList.add("hidden");
    var gb = el("gameBotBar"); if (gb) { gb.className = BOT.tone || ""; gb.innerHTML = "<span style='font-size:17px'>" + (BOT.mood === "alert" ? "🚨" : BOT.mood === "think" ? "🤔" : BOT.mood === "happy" ? "✨" : "🤖") + "</span><span>" + BOT.text + "</span>"; }
    renderBotDrawer();
}
function toggleDrawer(mode) { BOT.drawer = (BOT.drawer === mode) ? "" : mode; renderBotDrawer(); }
function openConfusionKey(ck) { BOT.lastCKey = ck; BOT.drawer = "confusion"; renderBotDrawer(); }
function renderBotDrawer() {
    var d = el("botDrawer"); if (!BOT.drawer) { d.classList.add("hidden"); return; } d.classList.remove("hidden");
    if (BOT.drawer === "confusion") {
        var ck = (BOT.lastCKey && game.confusions[BOT.lastCKey] > 0 && CONFUSIONS[BOT.lastCKey]) ? BOT.lastCKey : topConfusionKey();
        if (!ck) { d.innerHTML = "Clean execution—no weak spots!"; return; }
        var info = CONFUSIONS[ck]; d.innerHTML = "<b>⚖️ " + info.title + "</b><div class='cmp-grid'><div class='cmp-box'><b>" + info.a[0] + "</b>" + info.a[1] + "</div><div class='cmp-box'><b>" + info.b[0] + "</b>" + info.b[1] + "</div></div><button class='ghost' style='margin-top:6px;width:100%' onclick=\"clearConfusion('" + ck + "')\">Got it ✓</button>";
    } else if (BOT.drawer === "ask") {
        var h = "<b>Tap a part to animate it on the 3D chip:</b><div class='bot-btns'>", any = false;
        for (var i = 0; i < PARTS.length; i++)if (game.parts[PARTS[i].key].on) { any = true; h += "<button onclick=\"playPartDemo('" + PARTS[i].key + "')\">🎬 " + PARTS[i].short + "</button>"; }
        if (!any) h += "<span class='muted'>Build a part in Stage 1 first!</span>";
        d.innerHTML = h + "</div>";
    }
}
function clearConfusion(ck) { game.confusions[ck] = 0; BOT.drawer = ""; BOT.say("Spot cleared! Ready.", "happy", "good"); save(); }
function botTip() {
    if (activeGoldenRescue) { BOT.say("🪙 " + activeGoldenRescue.clue + " right on the 3D chip!", "party", "good"); return; }
    if (activeFault) { BOT.say("🚨 " + activeFault.symptom + " Click the failing 3D block!", "think", "warn"); return; }
    if (G && CONFUSIONS[BOT.lastCKey]) { BOT.say(CONFUSIONS[BOT.lastCKey].hint1, "think", ""); return; }
    for (var i = 0; i < 5; i++)if (game.stages[i] === "open") { BOT.say("Play <b>Stage " + (i + 1) + "</b> &amp; try <b>🎨 Test Render</b>!", "idle", ""); return; }
    BOT.say("All 5 stages done! Try <b>🎨 Test Render</b> with GPU Lanes!", "happy", "good");
}

// =========================================================================
// ISOMETRIC 3D SVG ENGINE
// =========================================================================
