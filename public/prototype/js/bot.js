// bot.js: Left-side ChipBot card, Evan CHAT_QA bubble log, confusion compare, part demos
// ---------------------------------------------------------
var chatLog = [{ who: "bot", text: "Hey! Open <b>MENU → STAGES</b> to build Stage 1, or tap a question below anytime." }];
var chatBusy = false;

var BOT = {
    mood: "idle", text: "Open <b>MENU → STAGES</b> to build Stage 1, or ask me anything!", tone: "", drawer: "", lastCKey: "",
    say: function (msg, mood, tone) { BOT.text = msg; BOT.mood = mood || "idle"; BOT.tone = tone || ""; renderBot(); },
    miss: function (cKey, fallbackMsg) {
        game.confusions[cKey] = (game.confusions[cKey] || 0) + 1; BOT.lastCKey = cKey;
        if (CONFUSIONS[cKey]) { var st = CONFUSIONS[cKey].stage; if (!game.stageConfusions[st]) game.stageConfusions[st] = {}; game.stageConfusions[st][cKey] = (game.stageConfusions[st][cKey] || 0) + 1; }
        var count = game.confusions[cKey], info = CONFUSIONS[cKey];
        if (info) BOT.say(count >= 2 ? ("<b>Confusion spotted (" + info.title + "):</b> " + info.hint2) : info.hint1, count >= 2 ? "alert" : "think", "warn");
        else BOT.say(fallbackMsg || "Check the clue and try again!", "think", "warn");
        save();
    },
    hit: function (cKey, msg) { if (cKey && game.confusions[cKey] > 0) game.confusions[cKey]--; if (msg) BOT.say(msg, "happy", "good"); }
};

function topConfusionKey() { var best = "", max = 0; for (var k in game.confusions) if (game.confusions[k] > max && CONFUSIONS[k]) { max = game.confusions[k]; best = k; } return max > 0 ? best : ""; }

function pushChat(who, text) {
    chatLog.push({ who: who, text: text });
    if (chatLog.length > 24) chatLog.shift();
    if (BOT.drawer === "ask") renderBotDrawer();
}

function chatUnlocked(item) {
    if (item.part) return !!(game.parts[item.part] && game.parts[item.part].on);
    if (item.era) {
        var cur = currentEra(), ok = false;
        for (var i = 0; i < CHIP_ERAS.length; i++) {
            if (CHIP_ERAS[i].id === item.era) ok = true;
            if (CHIP_ERAS[i].id === cur.id) break;
        }
        return ok && item.era !== "bare";
    }
    return true;
}

function askChat(id) {
    if (chatBusy) return;
    var item = null;
    for (var i = 0; i < CHAT_QA.length; i++) if (CHAT_QA[i].id === id) { item = CHAT_QA[i]; break; }
    if (!item || !chatUnlocked(item)) return;
    chatBusy = true;
    pushChat("you", item.q);
    BOT.drawer = "ask";
    renderBotDrawer();
    setTimeout(function () {
        pushChat("bot", item.a);
        if (item.part) { selected = item.part; drawChip(); }
        chatBusy = false;
        renderBotDrawer();
    }, 220);
}

function renderBot() {
    var labels = { idle: "Online · watching your CPU", happy: "Nice reasoning!", think: "Analyzing slip...", alert: "Confusion detected!", party: "Era / Stage milestone! ★" };
    el("botFace").innerHTML = humanoidBotSvg(BOT.mood, 54, 64);
    el("botMoodLabel").textContent = labels[BOT.mood] || labels.idle;
    var bub = el("botBubble");
    bub.className = "bot-bubble" + (BOT.tone ? " " + BOT.tone : "");
    bub.innerHTML = BOT.text;
    var ck = topConfusionKey(), btnC = el("btnConfusion");
    if (ck) { btnC.classList.remove("hidden"); btnC.className = game.confusions[ck] >= 2 ? "pulse" : ""; } else btnC.classList.add("hidden");
    var gb = el("gameBotBar");
    if (gb) { gb.className = BOT.tone || ""; gb.innerHTML = "<span style='font-size:18px'>" + (BOT.mood === "alert" ? "🚨" : BOT.mood === "think" ? "🤔" : BOT.mood === "happy" ? "✨" : "🤖") + "</span><span>" + BOT.text + "</span>"; }
    renderBotDrawer();
}

function toggleDrawer(mode) { BOT.drawer = (BOT.drawer === mode) ? "" : mode; renderBotDrawer(); }
function openConfusionKey(ck) { BOT.lastCKey = ck; BOT.drawer = "confusion"; renderBotDrawer(); }

function renderBotDrawer() {
    var d = el("botDrawer"); if (!d) return;
    if (!BOT.drawer) { d.classList.add("hidden"); return; }
    d.classList.remove("hidden");
    if (BOT.drawer === "confusion") {
        var ck = (BOT.lastCKey && game.confusions[BOT.lastCKey] > 0 && CONFUSIONS[BOT.lastCKey]) ? BOT.lastCKey : topConfusionKey();
        if (!ck) { d.innerHTML = "No active confusion spots! You're reasoning cleanly."; return; }
        var info = CONFUSIONS[ck];
        d.innerHTML = "<b>⚖️ " + info.title + "</b><div class='cmp-grid'><div class='cmp-box'><b>" + info.a[0] + "</b>" + info.a[1] + "</div><div class='cmp-box'><b>" + info.b[0] + "</b>" + info.b[1] + "</div></div><button class='ghost' style='margin-top:6px;width:100%' onclick=\"clearConfusion('" + ck + "')\">Got it! Clear flag ✓</button>";
    } else if (BOT.drawer === "demo") {
        var hd = "<b>Tap a part to animate it on the 3D chip:</b><div class='bot-btns'>", anyd = false;
        for (var di = 0; di < PARTS.length; di++) if (game.parts[PARTS[di].key].on) { anyd = true; hd += "<button onclick=\"playPartDemo('" + PARTS[di].key + "')\">🎬 " + PARTS[di].short + "</button>"; }
        if (!anyd) hd += "<span class='muted'>Build a part in MENU → STAGES first!</span>";
        d.innerHTML = hd + "</div>";
    } else if (BOT.drawer === "ask") {
        var logHtml = "<div id='botChatLog' class='chat-log'>" + chatLog.map(function (m) { return "<div class='bubble " + m.who + "'>" + m.text + "</div>"; }).join("") + "</div>";
        var qHtml = "<div class='chat-qs'>", locked = 0;
        for (var i = 0; i < CHAT_QA.length; i++) {
            var q = CHAT_QA[i];
            if (!chatUnlocked(q)) { locked++; continue; }
            qHtml += "<button onclick=\"askChat('" + q.id + "')\">" + q.q + "</button>";
        }
        qHtml += "</div>" + (locked > 0 ? "<div class='muted' style='font-size:11px;margin-top:4px;'>Build parts &amp; unlock new CPU eras to reveal " + locked + " more questions.</div>" : "");
        d.innerHTML = logHtml + qHtml;
        var box = el("botChatLog"); if (box) box.scrollTop = box.scrollHeight;
    }
}

function clearConfusion(ck) { game.confusions[ck] = 0; BOT.drawer = ""; BOT.say("Confusion cleared! Ready for the next round.", "happy", "good"); save(); }
function tutorSay(key) {
    selected = key; drawChip(); playPartDemo(key);
    if (game.parts[key] && game.parts[key].on) { BOT.drawer = "ask"; askChat(key); }
}
function botTip() {
    if (activeFault) { BOT.say("Read the fault symptom above the chip: math (ALU), opcode (DEC), order (CU), timing (CLK), operands (REG), or RAM speed (L1)?", "think", "warn"); return; }
    if (G && CONFUSIONS[BOT.lastCKey]) { BOT.say(CONFUSIONS[BOT.lastCKey].hint1, "think", ""); return; }
    for (var i = 0; i < 5; i++) if (game.stages[i] === "open") { BOT.say("Tip: Open <b>MENU → STAGES</b> and play <b>Stage " + (i + 1) + " · " + STAGES[i].name + "</b>. Time your <b>EXECUTE</b> bar on green for 1.25×!", "idle", ""); return; }
    BOT.say("All 5 CPU models built! Check <b>PROGRESS</b> or view your <b>5-Stage CPU Evolution</b>.", "happy", "good");
}
