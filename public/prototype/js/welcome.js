// welcome.js: Welcome screen and CPU Evolution finale
// ---------------------------------------------------------
function makeStars(id) { var c = el(id), h = ""; for (var i = 0; i < 48; i++) { var sz = (1 + (i % 3)).toFixed(1), x = ((i * 73) % 98) + 1, y = ((i * 41) % 94) + 2, dur = (1.8 + (i % 5) * 0.6).toFixed(1), del = ((i % 7) * 0.35).toFixed(2); h += "<div class='w-star' style='width:" + sz + "px;height:" + sz + "px;left:" + x + "%;top:" + y + "%;animation-duration:" + dur + "s;animation-delay:" + del + "s'></div>"; } c.innerHTML = h; }

function openWelcome() {
    var scr = el("welcomeScreen"); scr.classList.remove("hidden", "fade-out"); makeStars("welcomeStars");
    el("welcomeContent").innerHTML =
        "<svg class='crystal-pulse' viewBox='0 0 80 80' width='84' height='84'><rect x='18' y='18' width='44' height='44' rx='10' fill='#1e293b' stroke='#38bdf8' stroke-width='3'/><rect x='27' y='27' width='26' height='26' rx='5' fill='#bae6fd'/><path d='M26 10v8M35 10v8M45 10v8M54 10v8M26 62v8M35 62v8M45 62v8M54 62v8M10 26h8M10 35h8M10 45h8M10 54h8M62 26h8M62 35h8M62 45h8M62 54h8' stroke='#38bdf8' stroke-width='3' stroke-linecap='round'/></svg>" +
        "<h1 class='w-title seq' style='animation-delay:0.15s'>OVERCLOCKED</h1>" +
        "<p class='w-sub seq' style='animation-delay:0.25s'>An idle learning game for computer organization. Complete short challenges to assemble a 3D CPU and advance from early microprocessor designs to modern multi-core systems.</p>" +
        "<div class='w-flow'>" +
        "<div class='w-card seq' style='animation-delay:0.35s'><span class='w-badge' style='background:#0ea5e9;color:#fff;'>1 · MINI GAMES</span><p>Complete 10 interactive modules to unlock and mount each CPU part.</p></div>" +
        "<div class='w-arrow seq' style='animation-delay:0.42s'>›</div>" +
        "<div class='w-card seq' style='animation-delay:0.5s'><span class='w-badge' style='background:#6366f1;color:#fff;'>2 · COMPUTE</span><p>Press <b>EXECUTE</b> to earn <b>Compute</b> (ops), the currency you spend on upgrades. Open <b>Instruction Lab</b> to watch paths on the CPU.</p></div>" +
        "<div class='w-arrow seq' style='animation-delay:0.58s'>›</div>" +
        "<div class='w-card seq' style='animation-delay:0.65s'><span class='w-badge' style='background:#f59e0b;color:#111;'>3 · FAULTS</span><p>Respond to hardware alerts by clicking the failing component for bonus Compute.</p></div>" +
        "<div class='w-arrow seq' style='animation-delay:0.72s'>›</div>" +
        "<div class='w-card seq' style='animation-delay:0.8s'><span class='w-badge' style='background:#10b981;color:#fff;'>4 · MASTERY</span><p>Spend Compute to upgrade parts, then check your CPU in <b>Speed Tests</b> (optional) for bonus Compute.</p></div>" +
        "</div>" +
        "<button class='w-start seq' style='animation-delay:0.95s' onclick='closeWelcome()'>▶ START BUILDING</button>";
}

function closeWelcome() {
    var scr = el("welcomeScreen"); scr.classList.add("fade-out");
    game.seenWelcome = true; save();
    setTimeout(function () {
        scr.classList.add("hidden");
        if (!game.seenStages[0]) openHub(0);
        else if (!menuOpen && partsOn() === 0) { tab = "stages"; toggleMenu(); }
    }, 360);
}

function openEvolution(isPreview) {
    if (!isPreview) { game.finaleShown = true; save(); }
    var scr = el("evolutionScreen"); scr.classList.remove("hidden", "fade-out"); makeStars("evoStars");
    var cards = "";
    for (var m = 1; m <= 5; m++) {
        var onMap = {}, lvMap = {};
        for (var i = 0; i < PARTS.length; i++) { var p = PARTS[i]; if (p.stage <= m) { onMap[p.key] = true; lvMap[p.key] = Math.min(5, (m - p.stage) + 1); } }
        cards += "<div class='evo-card seq' style='animation-delay:" + (0.25 + (m - 1) * 0.2).toFixed(2) + "s'><svg viewBox='0 30 720 460'>" + buildChipSvg({ interactive: false, onMap: onMap, lvMap: lvMap }) + "</svg><div class='evo-tag'>STAGE " + m + "</div><div class='evo-name'>" + STAGES[m - 1].model + "</div><div class='evo-spec'>" + STAGES[m - 1].spec + "</div></div>";
    }
    el("evoContent").innerHTML = "<div class='label seq' style='color:#38bdf8;animation-delay:0.1s;'>CPU BUILDER COMPLETE" + (isPreview ? " (PREVIEW)" : "") + "</div><h1 class='w-title seq' style='font-size:34px;animation-delay:0.18s;'>YOUR 5-STAGE CPU EVOLUTION</h1><p class='w-sub seq' style='animation-delay:0.25s;'>From bare tri-unit logic to " + currentEra().name + " (" + (game.archChoices.isa || "risc").toUpperCase() + " ISA).</p><div class='evo-grid'>" + cards + "</div><button class='w-start seq' style='animation-delay:1.25s;' onclick='finishToFeedback()'>▶ CONTINUE TO FEEDBACK</button>";
}

function finishToFeedback() {
    var scr = el("evolutionScreen"); scr.classList.add("fade-out");
    setTimeout(function () { scr.classList.add("hidden"); openFeedback(); }, 340);
}
