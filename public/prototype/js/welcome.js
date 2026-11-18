// welcome.js: Welcome screen and CPU Evolution finale
// ---------------------------------------------------------
function makeStars(id) { var c = el(id), h = ""; for (var i = 0; i < 48; i++) { var sz = (1 + (i % 3)).toFixed(1), x = ((i * 73) % 98) + 1, y = ((i * 41) % 94) + 2, dur = (1.8 + (i % 5) * 0.6).toFixed(1), del = ((i % 7) * 0.35).toFixed(2); h += "<div class='w-star' style='width:" + sz + "px;height:" + sz + "px;left:" + x + "%;top:" + y + "%;animation-duration:" + dur + "s;animation-delay:" + del + "s'></div>"; } c.innerHTML = h; }

function openWelcome() {
    var scr = el("welcomeScreen"); scr.classList.remove("hidden", "fade-out"); makeStars("welcomeStars");
    el("welcomeContent").innerHTML = "<svg class='crystal-pulse' viewBox='0 0 80 80' width='84' height='84'><rect x='18' y='18' width='44' height='44' rx='10' fill='#1e293b' stroke='#38bdf8' stroke-width='3'/><rect x='27' y='27' width='26' height='26' rx='5' fill='#bae6fd'/><path d='M26 10v8M35 10v8M45 10v8M54 10v8M26 62v8M35 62v8M45 62v8M54 62v8M10 26h8M10 35h8M10 45h8M10 54h8M62 26h8M62 35h8M62 45h8M62 54h8' stroke='#38bdf8' stroke-width='3' stroke-linecap='round'/></svg><h1 class='w-title seq' style='animation-delay:0.15s'>OVERCLOCKED</h1><p class='w-sub seq' style='animation-delay:0.25s'>Build a 3D CPU piece by piece—time your instructions, watch datapaths light up, and evolve from a 1971 Intel 4004 to a Modern Multi-Core SoC.</p><div class='w-flow'><div class='w-card seq' style='animation-delay:0.35s'><span class='w-badge' style='background:#0ea5e9;color:#fff;'>1 · PLAY TO BUILD</span><p>Open MENU → STAGES and beat 10 hands-on modules to snap real 3D parts onto silicon.</p></div><div class='w-arrow seq' style='animation-delay:0.42s'>›</div><div class='w-card seq' style='animation-delay:0.5s'><span class='w-badge' style='background:#6366f1;color:#fff;'>2 · TIME IT &amp; TRACE</span><p>Hit green on TIME IT (1.25×) to trace ADD, LW &amp; BEQ paths across the 3D chip.</p></div><div class='w-arrow seq' style='animation-delay:0.58s'>›</div><div class='w-card seq' style='animation-delay:0.65s'><span class='w-badge' style='background:#f59e0b;color:#111;'>3 · FAULT REPAIR</span><p>Catch hardware fault alerts and click the failing 3D component for bonus instructions.</p></div><div class='w-arrow seq' style='animation-delay:0.72s'>›</div><div class='w-card seq' style='animation-delay:0.8s'><span class='w-badge' style='background:#10b981;color:#fff;'>4 · EVOLVE</span><p>Track mastery with Donut Charts &amp; evolve across 8 real CPU eras.</p></div></div><button class='w-start seq' style='animation-delay:0.95s' onclick='closeWelcome()'>▶ START BUILDING</button>";
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
