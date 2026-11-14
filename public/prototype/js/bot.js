// bot.js: Sidebar ChipBot: tips, dares, confusion drawer
// ---------------------------------------------------------
// =========================================================================
// SIDEBAR CHIPBOT + ISOMETRIC 3D SVG ENGINE + MAIN LOOP
// =========================================================================
var BOT = {
    mood: "idle", text: "Click <b>1 · KNOW CPU</b> below to start building your 3D processor!", tone: "", drawer: "", lastCKey: "",
    say: function (msg, mood, tone) { BOT.text = msg; BOT.mood = mood || "idle"; BOT.tone = tone || ""; renderBot(); },
    miss: function (cKey, fallbackMsg) {
        game.confusions[cKey] = (game.confusions[cKey] || 0) + 1; BOT.lastCKey = cKey;
        if (CONFUSIONS[cKey]) { var st = CONFUSIONS[cKey].stage; if (!game.stageConfusions[st]) game.stageConfusions[st] = {}; game.stageConfusions[st][cKey] = (game.stageConfusions[st][cKey] || 0) + 1; }
        var count = game.confusions[cKey], info = CONFUSIONS[cKey];
        if (info) BOT.say(count >= 2 ? ("<b>Confusion spotted (" + info.title + "):</b> " + info.hint2) : info.hint1, count >= 2 ? "alert" : "think", "warn");
        else BOT.say(fallbackMsg || "Check the clue and try again!", "think", "warn");
        save();
    },
    hit: function (cKey, msg) { if (cKey && game.confusions[cKey] > 0) game.confusions[cKey]--; if (msg) BOT.say(msg, "happy", "good"); },
    checkDare: function (ctx) { var d = BOT_DARES[game.dareIdx % BOT_DARES.length]; if (d && d.check(ctx)) { gainCp(d.reward); game.dareIdx++; BOT.say("🎉 <b>Bot Dare Complete!</b> +" + d.reward + " CP earned!", "party", "good"); toast("🤖 ChipBot Dare Complete! +" + d.reward + " CP!"); beep(780, 130); save(); renderHud(); } }
};
function topConfusionKey() { var best = "", max = 0; for (var k in game.confusions) if (game.confusions[k] > max && CONFUSIONS[k]) { max = game.confusions[k]; best = k; } return max > 0 ? best : ""; }
function renderBot() {
    var labels = { idle: "Online · watching your CPU", happy: "Nice reasoning!", think: "Analyzing slip...", alert: "Confusion detected!", party: "Supercharged! ★" };
    el("botFace").innerHTML = humanoidBotSvg(BOT.mood, 54, 64); el("botMoodLabel").textContent = labels[BOT.mood] || labels.idle;
    var bub = el("botBubble"); bub.className = "bot-bubble" + (BOT.tone ? " " + BOT.tone : ""); bub.innerHTML = BOT.text;
    var dare = BOT_DARES[game.dareIdx % BOT_DARES.length]; el("botDareBox").innerHTML = "<b>🎯 BOT DARE (+" + dare.reward + " CP):</b> " + dare.text;
    var ck = topConfusionKey(), btnC = el("btnConfusion");
    if (ck) { btnC.classList.remove("hidden"); btnC.className = game.confusions[ck] >= 2 ? "pulse" : ""; } else btnC.classList.add("hidden");
    var gb = el("gameBotBar"); if (gb) { gb.className = BOT.tone || ""; gb.innerHTML = "<span style='font-size:18px'>" + (BOT.mood === "alert" ? "🚨" : BOT.mood === "think" ? "🤔" : BOT.mood === "happy" ? "✨" : "🤖") + "</span><span>" + BOT.text + "</span>"; }
    renderBotDrawer();
}
function toggleDrawer(mode) { BOT.drawer = (BOT.drawer === mode) ? "" : mode; renderBotDrawer(); }
function openConfusionKey(ck) { BOT.lastCKey = ck; BOT.drawer = "confusion"; renderBotDrawer(); }
function renderBotDrawer() {
    var d = el("botDrawer"); if (!BOT.drawer) { d.classList.add("hidden"); return; } d.classList.remove("hidden");
    if (BOT.drawer === "confusion") {
        var ck = (BOT.lastCKey && game.confusions[BOT.lastCKey] > 0 && CONFUSIONS[BOT.lastCKey]) ? BOT.lastCKey : topConfusionKey();
        if (!ck) { d.innerHTML = "No active confusion spots! You're reasoning cleanly."; return; }
        var info = CONFUSIONS[ck]; d.innerHTML = "<b>⚖️ " + info.title + "</b><div class='cmp-grid'><div class='cmp-box'><b>" + info.a[0] + "</b>" + info.a[1] + "</div><div class='cmp-box'><b>" + info.b[0] + "</b>" + info.b[1] + "</div></div><button class='ghost' style='margin-top:6px;width:100%' onclick=\"clearConfusion('" + ck + "')\">Got it! Clear flag ✓</button>";
    } else if (BOT.drawer === "ask") {
        var h = "<b>Ask about an unlocked part:</b><div class='bot-btns'>", any = false;
        for (var i = 0; i < PARTS.length; i++)if (game.parts[PARTS[i].key].on) { any = true; h += "<button onclick=\"tutorSay('" + PARTS[i].key + "')\">" + PARTS[i].short + "</button>"; }
        if (!any) h += "<span class='muted'>Unlock a part in Stage 1 first!</span>";
        d.innerHTML = h + "</div><div id='tutorAns' style='margin-top:6px'></div>";
    }
}
function clearConfusion(ck) { game.confusions[ck] = 0; BOT.drawer = ""; BOT.say("Confusion cleared! Ready for the next round.", "happy", "good"); save(); }
function tutorSay(key) { var p = PART[key], ans = el("tutorAns"); if (ans) ans.innerHTML = "<b>" + p.name + ":</b> " + p.what + "<br><i>Analogy: " + p.analogy + "</i>"; selected = key; drawChip(); }
function botTip() {
    if (activeFault) { BOT.say("Read the fault symptom: math (ALU), opcode (DEC), order (CU), timing (CLK), variables (REG), or RAM speed (L1)?", "think", "warn"); return; }
    if (G && CONFUSIONS[BOT.lastCKey]) { BOT.say(CONFUSIONS[BOT.lastCKey].hint1, "think", ""); return; }
    for (var i = 0; i < 5; i++)if (game.stages[i] === "open") { BOT.say("Tip: Open <b>Stage " + (i + 1) + " · " + STAGES[i].name + "</b> and watch for Golden Chips to trigger 3× Overclock Frenzy!", "idle", ""); return; }
    BOT.say("All 5 CPU models built! Try <b>📊 Run Benchmark</b> or catch Golden Chips for 3× Overclock!", "happy", "good");
}
