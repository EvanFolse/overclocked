// bot.js: ChipBot Tutor — home nav + Learn / Review / Hint / Diagnose
// Underlying confusion, fault, Q&A, and demo logic preserved.
// ---------------------------------------------------------
var chatLog = [{ who: "bot", text: "Hey! Open <b>MENU → STAGES</b> to build Stage 1, or ask me anything." }];
var chatBusy = false;
var leftPanel = ""; // "" | "bot" | "bench" | "lab"

var BOT = {
    mood: "idle",
    text: "Open <b>MENU → STAGES</b> to build Stage 1, or ask me anything!",
    tone: "",
    drawer: "",
    lastCKey: "",
    tutorView: "home",
    tutorCat: "",
    tutorQId: "",
    say: function (msg, mood, tone) {
        BOT.text = msg; BOT.mood = mood || "idle"; BOT.tone = tone || "";
        renderBot();
        if (leftPanel !== "bot") {
            var dock = el("btnBotDock");
            if (dock) dock.classList.add("dock-ping");
        }
    },
    miss: function (cKey, fallbackMsg) {
        game.confusions[cKey] = (game.confusions[cKey] || 0) + 1; BOT.lastCKey = cKey;
        if (CONFUSIONS[cKey]) { var st = CONFUSIONS[cKey].stage; if (!game.stageConfusions[st]) game.stageConfusions[st] = {}; game.stageConfusions[st][cKey] = (game.stageConfusions[st][cKey] || 0) + 1; }
        var count = game.confusions[cKey], info = CONFUSIONS[cKey];
        if (info) BOT.say(count >= 2 ? ("Want to review <b>" + info.title + "</b>? " + info.hint2) : info.hint1, count >= 2 ? "alert" : "think", "warn");
        else BOT.say(fallbackMsg || "Check the clue and try again!", "think", "warn");
        save();
    },
    hit: function (cKey, msg) { if (cKey && game.confusions[cKey] > 0) game.confusions[cKey]--; if (msg) BOT.say(msg, "happy", "good"); }
};

var LEARN_CATS = [
    { id: "start", icon: "🚀", title: "Getting Started", desc: "How the game works", ids: ["what", "menu", "instr", "bar"] },
    { id: "parts", icon: "🧩", title: "CPU Components", desc: "What each part does · demos", ids: ["cu", "alu", "regs", "clock", "pipe", "decoder", "l1", "l2", "fpu", "cores"], demos: true },
    { id: "perf", icon: "⚡", title: "Computer Performance", desc: "Compute, timing, and eras", ids: ["instr", "bar", "eras"] },
    { id: "hist", icon: "📜", title: "Chip History", desc: "From 4004 to multi-core", ids: ["eras", "era4004", "era6502", "era8086", "era386", "eraPentium", "era64", "eraModern"] }
];

function toggleLeftPanel(which) {
    leftPanel = (leftPanel === which) ? "" : which;
    if (leftPanel === "bot" && !BOT.tutorView) BOT.tutorView = "home";
    applyLeftPanels();
}

function openLeftPanel(which) {
    leftPanel = which;
    applyLeftPanels();
}

function applyLeftPanels() {
    var bot = el("botCard"), bench = el("benchCard"), lab = el("labCard");
    var btnBot = el("btnBotDock"), btnBench = el("btnBenchDock"), btnLab = el("btnLabDock");
    if (bot) bot.classList.toggle("collapsed", leftPanel !== "bot");
    if (bench) bench.classList.toggle("collapsed", leftPanel !== "bench");
    if (lab) lab.classList.toggle("collapsed", leftPanel !== "lab");
    if (btnBot) {
        btnBot.classList.toggle("on", leftPanel === "bot");
        btnBot.setAttribute("aria-expanded", leftPanel === "bot" ? "true" : "false");
        if (leftPanel === "bot") btnBot.classList.remove("dock-ping");
    }
    if (btnBench) {
        btnBench.classList.toggle("on", leftPanel === "bench");
        btnBench.setAttribute("aria-expanded", leftPanel === "bench" ? "true" : "false");
        if (leftPanel === "bench") btnBench.classList.remove("dock-ping");
    }
    if (btnLab) {
        btnLab.classList.toggle("on", leftPanel === "lab");
        btnLab.setAttribute("aria-expanded", leftPanel === "lab" ? "true" : "false");
        if (leftPanel === "lab") btnLab.classList.remove("dock-ping");
    }
    if (leftPanel === "bot") renderBot();
    if (leftPanel === "bench" && typeof renderBenchList === "function") renderBenchList();
    if (leftPanel === "lab" && typeof renderInstructionLab === "function") renderInstructionLab();
}

function topConfusionKey() {
    var best = "", max = 0;
    for (var k in game.confusions) if (game.confusions[k] > 0 && CONFUSIONS[k] && game.confusions[k] > max) { max = game.confusions[k]; best = k; }
    return max > 0 ? best : "";
}

function confusionList() {
    var list = [];
    for (var k in game.confusions) {
        if (game.confusions[k] > 0 && CONFUSIONS[k]) list.push({ k: k, c: game.confusions[k], title: CONFUSIONS[k].title });
    }
    list.sort(function (a, b) { return b.c - a.c; });
    return list;
}

function pushChat(who, text) {
    chatLog.push({ who: who, text: text });
    if (chatLog.length > 24) chatLog.shift();
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

function findChat(id) {
    for (var i = 0; i < CHAT_QA.length; i++) if (CHAT_QA[i].id === id) return CHAT_QA[i];
    return null;
}

function askChat(id) {
    if (chatBusy) return;
    var item = findChat(id);
    if (!item || !chatUnlocked(item)) return;
    chatBusy = true;
    pushChat("you", item.q);
    BOT.tutorView = "learn-answer";
    BOT.tutorQId = id;
    BOT.drawer = "ask";
    renderTutor();
    setTimeout(function () {
        pushChat("bot", item.a);
        if (item.part) { selected = item.part; drawChip(); }
        chatBusy = false;
        renderTutor();
    }, 220);
}

function setTutorView(view, opts) {
    opts = opts || {};
    BOT.tutorView = view;
    if (opts.cat !== undefined) BOT.tutorCat = opts.cat;
    if (opts.qId !== undefined) BOT.tutorQId = opts.qId;
    if (opts.ck) BOT.lastCKey = opts.ck;
    if (view === "home") BOT.drawer = "";
    else if (view === "review" || view === "review-detail") BOT.drawer = "confusion";
    else if (view.indexOf("learn") === 0) BOT.drawer = "ask";
    else if (view === "diagnose") BOT.drawer = "demo";
    else if (view === "hint") BOT.drawer = "";
    renderTutor();
}

// Legacy entry points used elsewhere in the app
function toggleDrawer(mode) {
    openLeftPanel("bot");
    if (mode === "confusion") setTutorView("review");
    else if (mode === "ask") setTutorView("learn");
    else if (mode === "demo") setTutorView("learn-cat", { cat: "parts" });
    else setTutorView("home");
}

function openConfusionKey(ck) {
    openLeftPanel("bot");
    setTutorView("review-detail", { ck: ck });
}

function clearConfusion(ck) {
    game.confusions[ck] = 0;
    BOT.say("Nice — that concept is cleared. Ready for the next round.", "happy", "good");
    save();
    setTutorView("review");
}

function tutorSay(key) {
    selected = key; drawChip(); playPartDemo(key);
    if (game.parts[key] && game.parts[key].on) {
        openLeftPanel("bot");
        BOT.tutorCat = "parts";
        askChat(key);
    }
}

function botTip() {
    if (activeFault) { BOT.say("Read the fault symptom above the chip: math (ALU), opcode (DEC), order (CU), timing (CLK), operands (REG), or RAM speed (L1)?", "think", "warn"); return; }
    if (G && CONFUSIONS[BOT.lastCKey]) { BOT.say(CONFUSIONS[BOT.lastCKey].hint1, "think", ""); return; }
    for (var i = 0; i < 5; i++) if (game.stages[i] === "open") { BOT.say("Tip: Open <b>MENU → STAGES</b> and play <b>Stage " + (i + 1) + " · " + STAGES[i].name + "</b>. Press <b>EXECUTE</b> for Compute, or open <b>Instruction Lab</b> to watch paths!", "idle", ""); return; }
    BOT.say("All 5 CPU models built! Check <b>PROGRESS</b> or view your <b>5-Stage CPU Evolution</b>.", "happy", "good");
}

function tutorNavRow(icon, title, desc, badge, onclickAttr) {
    return "<button type='button' class='tutor-nav' onclick=\"" + onclickAttr + "\">" +
        "<span class='tutor-nav-ico'>" + icon + "</span>" +
        "<span class='tutor-nav-text'><b>" + title + "</b><small>" + desc + "</small></span>" +
        (badge ? "<span class='tutor-nav-badge'>" + badge + "</span>" : "") +
        "<span class='tutor-nav-arrow' aria-hidden='true'></span></button>";
}

function tutorBack(label, view, opts) {
    var o = opts || {};
    var arg = "'" + view + "'";
    if (o.cat) arg = "'" + view + "',{cat:'" + o.cat + "'}";
    return "<button type='button' class='tutor-back' onclick=\"setTutorView(" + arg + ")\">← " + label + "</button>";
}

function renderTutorHome() {
    var confN = confusionList().length;
    var faultReady = installedCount() >= 2;
    var h = "<div class='tutor-home'>";
    h += tutorNavRow("📚", "Learn", "Components, concepts, history, and demos", "", "setTutorView('learn')");
    h += tutorNavRow("📝", "Review Mistakes", confN ? "Concepts worth another look" : "Nothing queued right now", confN ? String(confN) : "", "setTutorView('review')");
    h += tutorNavRow("💡", "Get a Hint", "Context-aware tip for what you're doing", "", "setTutorView('hint')");
    h += tutorNavRow("🔧", "Diagnose Chip", faultReady ? (activeFault ? "A fault is waiting on the chip" : "Practice spotting a failing part") : "Build 2 parts to unlock", activeFault ? "!" : "", "setTutorView('diagnose')");
    h += "</div>";
    return h;
}

function renderTutorLearn() {
    var h = tutorBack("ChipBot", "home") + "<div class='tutor-section-title'>Learn</div><div class='tutor-list'>";
    for (var i = 0; i < LEARN_CATS.length; i++) {
        var c = LEARN_CATS[i];
        h += tutorNavRow(c.icon, c.title, c.desc, "", "setTutorView('learn-cat',{cat:'" + c.id + "'})");
    }
    h += "</div>";
    return h;
}

function renderTutorLearnCat() {
    var cat = null;
    for (var i = 0; i < LEARN_CATS.length; i++) if (LEARN_CATS[i].id === BOT.tutorCat) cat = LEARN_CATS[i];
    if (!cat) return renderTutorLearn();
    var h = tutorBack("Learn", "learn") + "<div class='tutor-section-title'>" + cat.title + "</div>";
    if (cat.demos) {
        h += "<div class='tutor-demo-block'><div class='tutor-kicker'>Part demos</div><div class='tutor-demo-row'>";
        var any = false;
        for (var d = 0; d < PARTS.length; d++) {
            if (!game.parts[PARTS[d].key].on) continue;
            any = true;
            h += "<button type='button' class='tutor-chip' onclick=\"playPartDemo('" + PARTS[d].key + "')\">🎬 " + PARTS[d].short + "</button>";
        }
        if (!any) h += "<span class='muted'>Build a part in MENU → STAGES to unlock demos.</span>";
        h += "</div></div>";
    }
    h += "<div class='tutor-kicker'>Questions</div><div class='tutor-qlist'>";
    var shown = 0, locked = 0;
    for (var q = 0; q < cat.ids.length; q++) {
        var item = findChat(cat.ids[q]);
        if (!item) continue;
        if (!chatUnlocked(item)) { locked++; continue; }
        shown++;
        h += "<button type='button' class='tutor-q' onclick=\"askChat('" + item.id + "')\">" + item.q + "</button>";
    }
    if (!shown) h += "<div class='tutor-empty'>Nothing unlocked here yet. Keep building!</div>";
    if (locked > 0) h += "<div class='muted tutor-locked-note'>Build parts and unlock eras to reveal " + locked + " more.</div>";
    h += "</div>";
    return h;
}

function renderTutorLearnAnswer() {
    var item = findChat(BOT.tutorQId);
    var cat = BOT.tutorCat || "start";
    var h = tutorBack("Questions", "learn-cat", { cat: cat });
    if (!item) return h + "<div class='tutor-empty'>Question not found.</div>";
    var answered = false;
    for (var i = chatLog.length - 1; i >= 0; i--) {
        if (chatLog[i].who === "bot") { answered = true; break; }
    }
    h += "<div class='tutor-qa'>";
    h += "<div class='tutor-qa-q'>" + item.q + "</div>";
    if (chatBusy) h += "<div class='tutor-qa-a muted'>…</div>";
    else h += "<div class='tutor-qa-a'>" + item.a + "</div>";
    if (item.part && game.parts[item.part] && game.parts[item.part].on) {
        h += "<button type='button' class='ghost tutor-demo-link' onclick=\"playPartDemo('" + item.part + "')\">🎬 Watch " + PART[item.part].short + " demo</button>";
    }
    h += "</div>";
    return h;
}

function renderTutorReview() {
    var list = confusionList();
    var h = tutorBack("ChipBot", "home") + "<div class='tutor-section-title'>Review Mistakes</div>";
    if (!list.length) {
        h += "<div class='tutor-empty positive'>You're doing great! There are no concepts to review right now.</div>";
        return h;
    }
    h += "<div class='tutor-list'>";
    for (var i = 0; i < list.length; i++) {
        h += tutorNavRow("📘", list[i].title, "Open a quick comparison", list[i].c > 1 ? "×" + list[i].c : "", "setTutorView('review-detail',{ck:'" + list[i].k + "'})");
    }
    h += "</div>";
    return h;
}

function renderTutorReviewDetail() {
    var ck = (BOT.lastCKey && game.confusions[BOT.lastCKey] > 0 && CONFUSIONS[BOT.lastCKey]) ? BOT.lastCKey : topConfusionKey();
    var h = tutorBack("Review Mistakes", "review");
    if (!ck) {
        h += "<div class='tutor-empty positive'>You're doing great! There are no concepts to review right now.</div>";
        return h;
    }
    var info = CONFUSIONS[ck];
    h += "<div class='tutor-section-title'>" + info.title + "</div>";
    h += "<div class='cmp-grid tutor-cmp'><div class='cmp-box'><b>" + info.a[0] + "</b>" + info.a[1] + "</div><div class='cmp-box'><b>" + info.b[0] + "</b>" + info.b[1] + "</div></div>";
    h += "<button type='button' class='btn tutor-clear' onclick=\"clearConfusion('" + ck + "')\">Got it — clear this</button>";
    return h;
}

function renderTutorHint() {
    var h = tutorBack("ChipBot", "home") + "<div class='tutor-section-title'>Get a Hint</div>";
    h += "<p class='tutor-lead'>ChipBot looks at your current stage, recent slips, or an active fault, then offers one tip.</p>";
    h += "<button type='button' class='btn tutor-clear' onclick=\"botTip(); setTutorView('hint')\">Ask for a hint</button>";
    h += "<div class='tutor-hint-note muted'>The tip appears in ChipBot's message above.</div>";
    return h;
}

function renderTutorDiagnose() {
    var h = tutorBack("ChipBot", "home") + "<div class='tutor-section-title'>Diagnose Chip</div>";
    h += "<p class='tutor-lead'>You'll get a symptom, then click the failing part on the 3D chip. Correct repairs earn Compute.</p>";
    if (activeFault) {
        h += "<div class='tutor-fault-card'><b>Active fault</b><div>" + activeFault.symptom + "</div><div class='muted' style='margin-top:6px'>Click the failing 3D part, or dismiss from the banner above the chip.</div></div>";
        h += "<div class='tutor-fault-hint'><b>Hint</b><div>Match the symptom to the unit: math → ALU, opcode bits → Decoder, order/control → CU, timing/sync → Clock, active operands → Registers, slow RAM loops → L1.</div></div>";
    } else if (installedCount() < 2) {
        h += "<div class='tutor-empty'>Build at least two CPU parts first, then come back to practice diagnosis.</div>";
    } else {
        h += "<button type='button' class='btn tutor-clear' onclick='runFaultTest()'>Start fault test</button>";
        h += "<div class='tutor-hint-note muted'>Automatic faults can still appear while you build when no minigame is open.</div>";
    }
    return h;
}

function renderTutor() {
    var body = el("tutorBody");
    if (!body) return;
    var view = BOT.tutorView || "home";
    var html = "";
    if (view === "learn") html = renderTutorLearn();
    else if (view === "learn-cat") html = renderTutorLearnCat();
    else if (view === "learn-answer") html = renderTutorLearnAnswer();
    else if (view === "review") html = renderTutorReview();
    else if (view === "review-detail") html = renderTutorReviewDetail();
    else if (view === "hint") html = renderTutorHint();
    else if (view === "diagnose") html = renderTutorDiagnose();
    else html = renderTutorHome();
    body.innerHTML = html;
}

function renderBot() {
    var labels = {
        idle: "Ready when you are",
        happy: "Nice work!",
        think: "Thinking it through…",
        alert: "Want to review something?",
        party: "Milestone unlocked!"
    };
    var face = humanoidBotSvg(BOT.mood, 54, 64);
    var faceEl = el("botFace"); if (faceEl) faceEl.innerHTML = face;
    var dockFace = el("dockBotFace"); if (dockFace) dockFace.innerHTML = humanoidBotSvg(BOT.mood, 36, 44);
    var moodEl = el("botMoodLabel"); if (moodEl) moodEl.textContent = labels[BOT.mood] || labels.idle;
    var bub = el("botBubble");
    if (bub) {
        bub.className = "bot-bubble" + (BOT.tone ? " " + BOT.tone : "");
        bub.innerHTML = BOT.text;
    }
    var btnC = el("btnConfusion"); if (btnC) btnC.classList.add("hidden");
    var btnF = el("btnFault"); if (btnF) btnF.classList.add("hidden");
    var gb = el("gameBotBar");
    if (gb) {
        gb.className = BOT.tone || "";
        gb.innerHTML = "<span style='font-size:18px'>" + (BOT.mood === "alert" ? "📝" : BOT.mood === "think" ? "🤔" : BOT.mood === "happy" ? "✨" : "🤖") + "</span><span>" + BOT.text + "</span>";
    }
    if (leftPanel === "bot") renderTutor();
}
