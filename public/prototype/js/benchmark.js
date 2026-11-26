// benchmark.js: Speed Testing — simulated client benchmarks (Time = IC * CPI * T)
// ---------------------------------------------------------
// Ordered by when a student can realistically beat them:
// Stage 2 (pipe/CU) → Stage 4 (L1/L2) → Stage 5 (cores/FPU)
var BENCH_MISSIONS = [
    {
        id: "browser",
        icon: "🌐",
        title: "Browser & OS Tabs",
        short: "Pipeline & control cut stalls",
        learn: "Tests how your CPU handles lots of if/else decisions, like browser tabs. Pipeline and Control Unit matter most. Bad guesses pause work and slow the page.",
        tipNeed: "Upgrade Pipeline and Control Unit to keep instructions moving.",
        earlyNeed: "Build Clock and Pipeline in Stage 2, then upgrade Control Unit.",
        targetNs: 6.5,
        unit: "ns/op",
        reward: 650,
        profile: "Heavy if/else Branches · Control Hazards · ISA Decode",
        bg: "Browsers and OS code use lots of if/else branches. Mispredicts flush the pipeline."
    },
    {
        id: "bigdata",
        icon: "📊",
        title: "Big Data Table Scan",
        short: "Caches cut RAM waits",
        learn: "Tests reading a huge table of data. L1 and L2 Cache matter most. Data kept nearby means less waiting on slow RAM.",
        tipNeed: "Upgrade L1 and L2 Cache so fewer trips wait on slow RAM.",
        earlyNeed: "Build L1 and L2 Cache in Stage 4.",
        targetNs: 12.0,
        unit: "ns/row",
        reward: 950,
        profile: "Memory Wall · Streaming Reads · Cache Locality",
        bg: "A big scan is larger than cache. Caches help nearby rows, but most data still lives in RAM."
    },
    {
        id: "photo",
        icon: "📱",
        title: "Phone Camera Burst",
        short: "More cores finish pixels sooner",
        learn: "Tests processing many photos at once. Multi-core and FPU matter most. Extra cores share the work so the burst finishes sooner.",
        tipNeed: "Build Multi-core (Stage 5) so several cores share the work.",
        earlyNeed: "Build Multi-core in Stage 5 to see a big speed jump.",
        targetNs: 8.0,
        unit: "ns/px",
        reward: 1200,
        profile: "92% Parallel · Integer + Float · Low Branching",
        bg: "A camera burst processes many independent pixels. Extra cores finish the frame faster."
    }
];

var activeBenchId = "", benchRenderTimer = null, benchAnimTimeout = null, benchReadyNotified = {}, benchShowTech = false;
var BENCH_ANIM_SLOW = 2.025; // previous 1.5×, then another ~35% slower for presenting

function evalBench(id) {
    var clkLv = lvl("clock"), pipeLv = lvl("pipe"), cuLv = lvl("cu"),
        l1Lv = lvl("l1"), l2Lv = lvl("l2"), fpuLv = lvl("fpu"), decLv = lvl("decoder"), coreLv = lvl("cores");
    var mhz = clkLv > 0 ? [5, 33, 200, 1500, 4500][clkLv - 1] : 2;
    if (overclockOn && clkLv > 0) mhz = Math.round(mhz * 1.35);
    var cycleNs = 1000 / mhz;
    var idealIpc = pipeLv > 0 ? [1.0, 1.0, 2.0, 3.0, 4.0][pipeLv - 1] : (cuLv > 0 ? 0.25 : 0.20);
    var isCisc = (game.archChoices.isa === "cisc");
    var icFactor = isCisc ? 0.85 : 1.15;
    var decodeCpi = isCisc ? (decLv >= 4 ? 0.06 : Math.max(0.10, 0.34 - decLv * 0.06)) : 0.0;
    var l1Miss = l1MissRateFor(l1Lv), l2Miss = l2MissRateFor(l2Lv);
    var cores = coreLv > 0 ? [1, 2, 4, 8, 16][coreLv - 1] : 1;

    var ic = 10, compCpi = 1 / idealIpc + decodeCpi, hazCpi = 0.1, memCpi = 0.2, amdahl = 1, note = "";

    if (id === "photo") {
        ic = (fpuLv > 0 ? 9 : 12) * icFactor;
        hazCpi = 0.06;
        memCpi = 0.18 * l1Miss * (1.2 + 4.0 * l2Miss);
        amdahl = 1 / (0.08 + 0.92 / cores);
        compCpi = compCpi / amdahl; hazCpi = hazCpi / amdahl; memCpi = memCpi / amdahl;
        note = "Amdahl Speedup (" + cores + "C, 92% parallel): " + amdahl.toFixed(2) + "×" + (fpuLv === 0 ? " · No FPU (+3 sw-float IC)" : "");
    } else if (id === "browser") {
        ic = 10 * icFactor;
        hazCpi = Math.max(0.08, 1.45 - (cuLv * 0.16 + pipeLv * 0.18));
        memCpi = 0.28 * l1Miss * (1.2 + 3.5 * l2Miss);
        note = isCisc ? "CISC saves IC (-15%), but heavier decode adds +" + decodeCpi.toFixed(2) + " CPI." : "RISC keeps decode CPI = 0, letting Pipeline handle branchy code.";
    } else {
        ic = 8 * icFactor;
        hazCpi = 0.12;
        var bwFactor = isCisc ? 0.84 : 1.12;
        memCpi = bwFactor * (l1Miss * (1.6 + 8.5 * l2Miss));
        note = isCisc ? "CISC compact code eases memory traffic (-15% IC)." : "RISC +15% IC increases fetch pressure on RAM.";
    }

    var totalCpi = compCpi + hazCpi + memCpi;
    var timeNs = ic * totalCpi * cycleNs;
    var compPct = Math.round((compCpi / totalCpi) * 100);
    var hazPct = Math.round((hazCpi / totalCpi) * 100);
    var memPct = Math.max(0, 100 - compPct - hazPct);

    var diag = "";
    if (clkLv === 0) diag = "Build the Clock in Stage 2 to speed everything up.";
    else if (id === "photo" && cores < 4) diag = "Upgrade Multi-core in Stage 5 so more cores paint at once.";
    else if (id === "photo" && fpuLv === 0) diag = "Build the FPU in Stage 5 to cut extra float work.";
    else if (memPct >= 45) diag = "Upgrade L1 & L2 Cache so less time is spent waiting on RAM.";
    else if (hazPct >= 35) diag = "Upgrade Control Unit & Pipeline to cut stalls and flushes.";
    else diag = "Looking good. Raise Clock or turn on Overclock to shave the last bit.";

    return {
        ic: ic, totalCpi: totalCpi, cycleNs: cycleNs, timeNs: timeNs,
        compPct: compPct, hazPct: hazPct, memPct: memPct,
        diag: diag, note: note, mhz: mhz, cores: cores,
        pipeLv: pipeLv, cuLv: cuLv, l1Lv: l1Lv, l2Lv: l2Lv, fpuLv: fpuLv, clkLv: clkLv
    };
}

function getMission(id) {
    for (var i = 0; i < BENCH_MISSIONS.length; i++) if (BENCH_MISSIONS[i].id === id) return BENCH_MISSIONS[i];
    return BENCH_MISSIONS[0];
}

function formatNs(v) { return v >= 1000 ? (v / 1000).toFixed(2) + " µs" : v.toFixed(1) + " ns"; }

function formatBenchTime(ns, unit) {
    var per = (unit && unit.indexOf("/") >= 0) ? unit.split("/")[1] : "op";
    if (ns >= 1000) return (ns / 1000).toFixed(2) + " µs/" + per;
    return ns.toFixed(1) + " ns/" + per;
}

function benchIsEarly(id, ev) {
    if (id === "photo") return (ev.cores || 1) <= 1;
    if (id === "browser") return (ev.pipeLv || 0) === 0 && (ev.cuLv || 0) === 0;
    return (ev.l1Lv || 0) === 0 && (ev.l2Lv || 0) === 0;
}

function renderBenchList() {
    var card = el("benchCard");
    if (!card) return;
    if (!game.benchPassed) game.benchPassed = {};
    var passedCnt = 0;
    for (var i = 0; i < BENCH_MISSIONS.length; i++) if (game.benchPassed[BENCH_MISSIONS[i].id]) passedCnt++;

    var h = "<div class='panel-head'><div class='bench-head'><span class='bot-name'>SPEED TESTS</span><span class='mono' style='font-size:10.5px;color:var(--mint);font-weight:800'>" + passedCnt + "/3 PASSED</span></div><button type='button' class='ghost panel-close' onclick=\"toggleLeftPanel('bench')\" title='Collapse'>✕</button></div>";
    h += "<div class='muted' style='font-size:11px;margin:3px 0 6px;'>Optional simulated jobs. Lower time is better. Claim ops once when you beat the goal.</div>";
    for (var j = 0; j < BENCH_MISSIONS.length; j++) {
        var m = BENCH_MISSIONS[j], ev = evalBench(m.id), ok = !!game.benchPassed[m.id], meets = ev.timeNs <= m.targetNs;
        if (meets && !ok && !benchReadyNotified[m.id] && typeof eraReady !== "undefined" && eraReady && !G) {
            benchReadyNotified[m.id] = true;
            if (typeof BOT !== "undefined") BOT.say("Your CPU now beats <b>" + m.icon + " " + m.title + "</b>! Open Speed Testing and claim +" + fmt(m.reward) + " ops.", "party", "good");
            var dock = el("btnBenchDock");
            if (dock && leftPanel !== "bench") dock.classList.add("dock-ping");
        }
        h += "<div class='bench-row" + (ok ? " passed" : (meets ? " ready" : "")) + "' onclick=\"openBenchmark('" + m.id + "')\">" +
            "<div class='bench-row-top'><span><b>" + m.icon + " " + m.title + "</b></span>" +
            "<span class='mono' style='font-size:10px;white-space:nowrap;color:" + (ok ? "#059669" : (meets ? "#0284c7" : "#d97706")) + ";font-weight:800'>" + (ok ? "✓ PASS" : (meets ? "★ CLAIM!" : formatBenchTime(ev.timeNs, m.unit))) + "</span></div>" +
            "<div class='bench-row-sub'>" + m.short + " · Goal ≤ " + formatBenchTime(m.targetNs, m.unit) + "</div></div>";
    }
    card.innerHTML = h;
}

function openBenchmark(id) {
    activeBenchId = id;
    benchShowTech = false;
    if (!game.benchBaseline) game.benchBaseline = {};
    if (!game.benchPassed) game.benchPassed = {};
    var ev = evalBench(id);
    if (!game.benchBaseline[id]) { game.benchBaseline[id] = ev.timeNs; save(); }
    el("benchModal").classList.remove("hidden");
    renderBenchModal(true);
}

function closeBenchmark() {
    stopBenchAnim();
    el("benchModal").classList.add("hidden");
    activeBenchId = "";
    benchShowTech = false;
}

function stopBenchAnim() {
    if (benchRenderTimer) { clearInterval(benchRenderTimer); clearTimeout(benchRenderTimer); benchRenderTimer = null; }
    if (benchAnimTimeout) { clearTimeout(benchAnimTimeout); benchAnimTimeout = null; }
}

function toggleBenchTech() {
    benchShowTech = !benchShowTech;
    renderBenchModal(!benchShowTech);
}

function runBenchNow() {
    if (!activeBenchId) return;
    var m = getMission(activeBenchId), ev = evalBench(m.id);
    if (ev.timeNs <= m.targetNs && !game.benchPassed[m.id]) {
        game.benchPassed[m.id] = true;
        gainCp(m.reward);
        toast("Passed " + m.title + "! +" + fmt(m.reward) + " ops");
        BOT.say("Benchmark passed: <b>" + m.title + "</b> (" + formatBenchTime(ev.timeNs, m.unit) + " ≤ " + formatBenchTime(m.targetNs, m.unit) + ")! +" + fmt(m.reward) + " ops!", "party", "good");
        save();
        renderHud();
        renderBenchList();
    } else if (ev.timeNs <= m.targetNs) {
        toast("Still passing (" + formatBenchTime(ev.timeNs, m.unit) + ")");
        beep(640, 70);
    } else {
        BOT.say(m.title + ": " + ev.diag, "think", "warn");
        beep(320, 90);
    }
    benchShowTech = false;
    renderBenchModal(true);
}

function renderBenchModal(animate) {
    if (!activeBenchId) return;
    var m = getMission(activeBenchId), ev = evalBench(m.id);
    var baseNs = (game.benchBaseline && game.benchBaseline[m.id]) || ev.timeNs;
    var speedup = baseNs / Math.max(0.01, ev.timeNs);
    var meets = ev.timeNs <= m.targetNs;
    var passed = !!(game.benchPassed && game.benchPassed[m.id]);
    var early = benchIsEarly(m.id, ev);
    var status = passed ? "Passed" : (meets ? "Ready to claim" : "Not yet");
    var improve = speedup > 1.05 ? (speedup.toFixed(1) + "× faster than baseline") : "About the same as baseline";

    var html = "<div class='modal-card bench-modal-card'>" +
        "<div class='bench-modal-head'>" +
        "<div><h2>" + m.icon + " " + m.title + "</h2>" +
        "<p class='bench-learn'>" + (early ? m.earlyNeed : m.learn) + "</p></div>" +
        "<div class='bench-head-actions'>" +
        "<button type='button' class='ghost bench-tech-btn' onclick='toggleBenchTech()'>" + (benchShowTech ? "Back to demo" : "Technical details") + "</button>" +
        "<button class='ghost' onclick='closeBenchmark()' title='Close'>✕</button>" +
        "</div></div>";

    if (benchShowTech) {
        html += renderBenchTech(m, ev);
    } else {
        html += "<div class='bench-stage' id='benchStage'>" + (early ? benchEarlyScaffold(m, ev) : benchStageScaffold(m.id, ev)) + "</div>" +
            "<div class='bench-results'>" +
            "<div><span>Current</span><b class='" + (meets ? "ok" : "") + "'>" + formatBenchTime(ev.timeNs, m.unit) + "</b></div>" +
            "<div><span>Target</span><b>≤ " + formatBenchTime(m.targetNs, m.unit) + "</b></div>" +
            "<div><span>Status</span><b class='" + (passed ? "ok" : (meets ? "ready" : "")) + "'>" + status + "</b></div>" +
            "<div><span>Improvement</span><b>" + improve + "</b></div>" +
            "</div>" +
            "<div class='bench-tip'>" + ev.diag + "</div>";
    }

    html += benchActionsHtml(m, meets, passed) + "</div>";
    el("benchModal").innerHTML = html;
    if (!benchShowTech && !early) startBenchVisual(m.id, ev, !!animate);
}

function renderBenchTech(m, ev) {
    var isa = (game.archChoices && game.archChoices.isa) || "risc";
    return "<div class='bench-tech'>" +
        "<p class='muted' style='margin:0 0 8px'>" + m.bg + "</p>" +
        "<div class='bench-tech-formula mono'>Time = IC (" + ev.ic.toFixed(1) + ") × CPI (" + ev.totalCpi.toFixed(2) + ") × T (" + ev.cycleNs.toFixed(1) + " ns) = <b>" + formatBenchTime(ev.timeNs, m.unit) + "</b></div>" +
        "<div class='bench-bar'>" +
        "<div style='width:" + ev.compPct + "%;background:#22b585'>CPU " + ev.compPct + "%</div>" +
        "<div style='width:" + ev.hazPct + "%;background:#f59e0b'>Stalls " + ev.hazPct + "%</div>" +
        "<div style='width:" + ev.memPct + "%;background:#ef4444'>Memory " + ev.memPct + "%</div>" +
        "</div>" +
        "<div class='mono' style='font-size:11px;color:var(--muted);margin-bottom:8px'>" + ev.note + "</div>" +
        "<div class='mono' style='font-size:10.5px;color:var(--muted);margin:6px 0 4px'>ISA choice (live)</div>" +
        "<div class='arch-grid'>" +
        "<button class='arch-opt" + (isa === "risc" ? " on" : "") + "' onclick=\"setArchChoice('isa','risc');renderBenchModal(false);renderBenchList();\"><b>RISC</b><small>0 decode cost · more instructions</small></button>" +
        "<button class='arch-opt" + (isa === "cisc" ? " on" : "") + "' onclick=\"setArchChoice('isa','cisc');renderBenchModal(false);renderBenchList();\"><b>CISC</b><small>Fewer instructions · heavier decode</small></button>" +
        "</div></div>";
}

function benchEarlyScaffold(m, ev) {
    var icon = m.id === "photo" ? "🧩" : (m.id === "browser" ? "➡️" : "📦");
    return "<div class='bench-early'>" +
        "<div class='bench-early-ico'>" + icon + "</div>" +
        "<div class='bench-early-title'>What this tests</div>" +
        "<p>" + m.learn + "</p>" +
        "<p class='bench-early-need'>" + m.earlyNeed + "</p>" +
        "<p class='bench-caption'>You can still Run Benchmark anytime. It uses your current simulated CPU.</p></div>";
}

function benchStageScaffold(id, ev) {
    if (id === "photo") {
        var cores = Math.max(1, ev.cores || 1);
        return "<div class='bench-photo'>" +
            "<canvas id='benchCanvas' width='360' height='240' aria-label='Christmas camera burst'></canvas>" +
            "<div class='bench-photo-side'>" +
            "<div class='bench-cores-label'>" + cores + " core" + (cores === 1 ? "" : "s") + " painting</div>" +
            "<div class='bench-core-row' id='benchCoreRow'></div>" +
            "<div class='bench-caption' id='benchCaption'>Run to watch cores fill the picture.</div></div></div>";
    }
    if (id === "browser") {
        return "<div class='bench-pipe-wrap'>" +
            "<div class='bench-pipe-board'>" +
            "<div class='bench-pipe-cols'>" +
            "<div class='bench-pipe-col'><span>1. Fetch</span></div>" +
            "<div class='bench-pipe-col'><span>2. Decode</span></div>" +
            "<div class='bench-pipe-col'><span>3. Execute</span></div>" +
            "<div class='bench-pipe-col'><span>4. Memory</span></div>" +
            "<div class='bench-pipe-col'><span>5. Write</span></div>" +
            "</div>" +
            "<div class='bench-pipe-movers' id='benchPipeMovers'></div>" +
            "</div>" +
            "<div class='bench-caption' id='benchCaption'>Instructions travel left to right.</div></div>";
    }
    return "<div class='bench-mem-wrap'>" +
        "<div class='bench-mem-stack'>" +
        "<div class='bench-mem-tier cpu' id='tierCpu'><b>CPU</b><small>needs data</small></div>" +
        "<div class='bench-mem-tier l1' id='tierL1'><b>L1 Cache</b><small>" + (ev.l1Lv > 0 ? "built" : "not built") + "</small></div>" +
        "<div class='bench-mem-tier l2' id='tierL2'><b>L2 Cache</b><small>" + (ev.l2Lv > 0 ? "built" : "not built") + "</small></div>" +
        "<div class='bench-mem-tier ram' id='tierRam'><b>RAM</b><small>slow · large</small></div>" +
        "<div class='bench-mem-blocks' id='benchMemBlocks'></div>" +
        "</div>" +
        "<div class='bench-caption' id='benchCaption'>Blocks climb toward the CPU. Cache hits are short trips.</div></div>";
}

function startBenchVisual(id, ev, animate) {
    stopBenchAnim();
    if (id === "photo") startPhotoVisual(ev, animate);
    else if (id === "browser") startPipeVisual(ev, animate);
    else startMemVisual(ev, animate);
}

/* ---------- Hand-drawn Christmas pixel map (32×24) ---------- */
// . sky  * snowflake  S snow  T trunk  G green  g dark green
// Y star  R red ornament  B blue  P pink  O gold  A red gift  C blue gift
var XMAS_MAP = [
    "........*.*......*.*........*.*.",
    "...*...........Y...........*....",
    "......*.......YYY......*........",
    "....*..........Y................",
    "..............GGG...............",
    ".*...........GgGgG........*.....",
    "............GGRGGG..............",
    "...........GgGgOgGg......*......",
    "..........GGGGGGGGG.............",
    ".*.......GgGgBgGgGgG...*........",
    "........GGGRGGGGPGGGG...........",
    ".......GgGgGgOgGgGgGg...........",
    "......GGGGGGGGGGGGGGG......*....",
    ".*...GgBgGgGgRgGgGgBgG..........",
    "....GGGGPGGGGGGGOGGGGG..........",
    "...GgGgGgGgGgGgGgGgGgGg.........",
    ".......SS..TTTTTT..SS...........",
    "......SSSS.TTTTTT.SSSS...*......",
    ".....SSSSSS......SSSSSS.........",
    "....SSSASSSSSSSSSSSSCSSSS.......",
    "...SSSAAASSSSSSSSSSCCCSSSSS.....",
    "..SSSSASASSSSSSSSSCSCSCSSSSS....",
    ".SSSSSSSSSSSSSSSSSSSSSSSSSSSS...",
    "SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS.."
];

var XMAS_PAL = {
    ".": "#7eb6d9",
    "*": "#f8fafc",
    "S": "#eef6ff",
    "T": "#8b5a2b",
    "G": "#22c55e",
    "g": "#15803d",
    "Y": "#facc15",
    "R": "#ef4444",
    "B": "#38bdf8",
    "P": "#f472b6",
    "O": "#fbbf24",
    "A": "#dc2626",
    "C": "#2563eb"
};

function startPhotoVisual(ev, animate) {
    var canvas = el("benchCanvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var W = XMAS_MAP[0].length, H = XMAS_MAP.length;
    var cw = canvas.width / W, ch = canvas.height / H;
    var cores = Math.max(1, Math.min(16, ev.cores || 1));
    var cells = [];
    for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
            var chv = XMAS_MAP[y].charAt(x);
            cells.push(XMAS_PAL[chv] || "#7eb6d9");
        }
    }

    var row = el("benchCoreRow");
    if (row) {
        var chips = "";
        for (var c = 0; c < Math.min(cores, 8); c++) chips += "<span class='bench-core-chip' style='--c:" + c + "'>C" + (c + 1) + "</span>";
        if (cores > 8) chips += "<span class='bench-core-chip more'>+" + (cores - 8) + "</span>";
        row.innerHTML = chips;
    }

    function paintIndex(i) {
        var x = i % W, y = Math.floor(i / W);
        ctx.fillStyle = cells[i];
        ctx.fillRect(Math.floor(x * cw), Math.floor(y * ch), Math.ceil(cw) + 0.5, Math.ceil(ch) + 0.5);
    }
    function paintAll() {
        for (var i = 0; i < cells.length; i++) paintIndex(i);
        var cap = el("benchCaption");
        if (cap) cap.textContent = cores + " core" + (cores === 1 ? "" : "s") + " finished the frame.";
    }

    ctx.fillStyle = "#5b91b8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!animate) { paintAll(); return; }

    // Region strips: each core owns contiguous column bands
    var band = Math.ceil(W / cores);
    var cursor = [];
    for (var c3 = 0; c3 < cores; c3++) cursor[c3] = { x: c3 * band, y: 0 };
    var done = 0, total = cells.length;
    var steps = Math.max(1, Math.round((2 + 24 / Math.max(4, ev.timeNs)) / BENCH_ANIM_SLOW));
    var cap = el("benchCaption");
    if (cap) cap.textContent = (cores === 1 ? "1 core painting the whole scene…" : cores + " cores painting bands together…");

    benchRenderTimer = setInterval(function () {
        var progressed = false;
        for (var c = 0; c < cores; c++) {
            var x0 = c * band, x1 = Math.min(W, x0 + band);
            for (var s = 0; s < steps; s++) {
                var cur = cursor[c];
                if (cur.y >= H) break;
                if (cur.x >= x1) { cur.x = x0; cur.y++; if (cur.y >= H) break; }
                paintIndex(cur.y * W + cur.x);
                cur.x++;
                done++;
                progressed = true;
            }
        }
        if (cap) cap.textContent = "Painting " + Math.min(100, Math.round(done / total * 100)) + "% · " + cores + " core" + (cores === 1 ? "" : "s");
        if (!progressed || done >= total) {
            stopBenchAnim();
            paintAll();
            if (cap) cap.textContent = cores + " core" + (cores === 1 ? "" : "s") + " done · " + formatBenchTime(ev.timeNs, "ns/px");
        }
    }, Math.round(30 * BENCH_ANIM_SLOW));
}

/* ---------- Pipeline: traveling instruction chips ---------- */
function startPipeVisual(ev, animate) {
    var board = el("benchPipeMovers");
    if (!board) return;
    var ops = ["ADD", "LOAD", "IF?", "SUB", "AND", "LOAD", "IF?", "OR"];
    var labels = { "IF?": "BRANCH", "LOAD": "LOAD" };
    var hazardRate = Math.min(0.5, Math.max(0.1, ev.hazPct / 100));
    var stepMs = Math.round(Math.max(260, Math.min(700, Math.round(40 * ev.timeNs + 180))) * BENCH_ANIM_SLOW);
    var items = [];
    var issued = 0;
    var cap = el("benchCaption");
    var paused = false;

    function draw() {
        var h = "";
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            var left = (it.stage + 0.5) * 20;
            h += "<div class='bench-mover " + (it.state || "") + "' style='left:" + left + "%'>" + (labels[it.op] || it.op) + "</div>";
        }
        board.innerHTML = h;
    }

    if (!animate) {
        items = [
            { op: "ADD", stage: 0 },
            { op: "LOAD", stage: 1, state: "stall" },
            { op: "IF?", stage: 2, state: "flush" },
            { op: "SUB", stage: 3 },
            { op: "AND", stage: 4 }
        ];
        draw();
        if (cap) cap.textContent = "Snapshot · stall/flush chance about " + ev.hazPct + "%";
        return;
    }

    if (cap) cap.textContent = "Instructions moving through the pipeline…";
    benchRenderTimer = setInterval(function () {
        if (paused) return;
        // advance
        for (var i = items.length - 1; i >= 0; i--) {
            var it = items[i];
            if (it.state === "stall") {
                it.stallLeft = (it.stallLeft || 1) - 1;
                if (it.stallLeft <= 0) it.state = "";
                continue;
            }
            it.stage++;
            if (it.stage > 4) items.splice(i, 1);
        }
        // spawn
        if (items.length < 5) {
            var op = ops[issued % ops.length];
            var state = "";
            if (op === "IF?" && Math.random() < hazardRate) state = "flush";
            else if (op === "LOAD" && Math.random() < hazardRate * 0.7) state = "stall";
            items.push({ op: op, stage: 0, state: state, stallLeft: state === "stall" ? 1 : 0 });
            issued++;
            if (state === "flush") {
                if (cap) cap.textContent = "Wrong branch guess! That instruction is thrown away.";
                paused = true;
                benchAnimTimeout = setTimeout(function () {
                    items = items.filter(function (x) { return x.state !== "flush"; });
                    // also clear later stages as a simple flush visual
                    items = items.filter(function (x) { return x.stage < 2; });
                    draw();
                    paused = false;
                    if (cap) cap.textContent = "Pipeline refilling…";
                }, Math.round(520 * BENCH_ANIM_SLOW));
            } else if (state === "stall") {
                if (cap) cap.textContent = "Load stall: waiting one step for data.";
            } else if (cap) {
                cap.textContent = "Smooth flow · better Control/Pipeline = fewer pauses";
            }
        }
        draw();
    }, stepMs);
}

/* ---------- Memory: blocks climbing the hierarchy ---------- */
function startMemVisual(ev, animate) {
    var lane = el("benchMemBlocks");
    if (!lane) return;
    var l1Hit = Math.max(0.12, 1 - (ev.memPct / 100) * 0.9);
    if (ev.l1Lv <= 0) l1Hit = 0.06;
    var l2Hit = ev.l2Lv > 0 ? Math.min(0.85, l1Hit + 0.28) : 0.08;
    var blocks = [];
    var cap = el("benchCaption");
    var speed = Math.round(Math.max(28, Math.min(70, Math.round(100 / Math.max(4, ev.timeNs)))) * BENCH_ANIM_SLOW);
    // Y positions: CPU 8%, L1 30%, L2 55%, RAM 80%
    var Y = { cpu: 10, l1: 32, l2: 56, ram: 80 };

    function pathFor() {
        var r = Math.random();
        if (r < l1Hit) return ["l1", "cpu"];
        if (r < l2Hit) return ["l2", "l1", "cpu"];
        return ["ram", "l2", "l1", "cpu"];
    }

    function draw() {
        var h = "";
        for (var i = 0; i < blocks.length; i++) {
            var b = blocks[i];
            h += "<div class='bench-block " + b.kind + (b.flash ? " flash" : "") + "' style='left:" + b.x + "%;top:" + b.y + "%'>" + b.label + "</div>";
        }
        lane.innerHTML = h;
    }

    function pulse(name) {
        ["tierRam", "tierL2", "tierL1", "tierCpu"].forEach(function (id) {
            var n = el(id); if (n) n.classList.remove("hot");
        });
        var map = { ram: "tierRam", l2: "tierL2", l1: "tierL1", cpu: "tierCpu" };
        var node = el(map[name]);
        if (node) node.classList.add("hot");
    }

    if (!animate) {
        blocks = [
            { x: 20, y: Y.ram, kind: "miss", label: "row" },
            { x: 45, y: Y.l2, kind: "near", label: "row" },
            { x: 70, y: Y.l1, kind: "hit", label: "HIT" },
            { x: 85, y: Y.cpu, kind: "hit", label: "CPU" }
        ];
        draw();
        if (cap) cap.textContent = "Snapshot · memory wait share " + ev.memPct + "%";
        return;
    }

    if (cap) cap.textContent = "Data blocks moving toward the CPU…";
    var tick = 0;
    benchRenderTimer = setInterval(function () {
        tick++;
        if (tick % 4 === 0 && blocks.length < 6) {
            var path = pathFor();
            var kind = path[0] === "l1" ? "hit" : (path[0] === "l2" ? "near" : "miss");
            blocks.push({
                x: 12 + Math.random() * 70,
                y: Y[path[0]],
                path: path,
                step: 0,
                kind: kind,
                label: kind === "hit" ? "HIT" : "row",
                flash: false
            });
        }
        for (var i = blocks.length - 1; i >= 0; i--) {
            var b = blocks[i];
            var dest = b.path[Math.min(b.step, b.path.length - 1)];
            var ty = Y[dest];
            b.y += (ty - b.y) * 0.22;
            b.flash = false;
            if (Math.abs(b.y - ty) < 1.8) {
                pulse(dest);
                b.flash = true;
                b.step++;
                if (dest === "l1") { b.kind = "hit"; b.label = "HIT"; }
                if (b.step >= b.path.length) {
                    blocks.splice(i, 1);
                    continue;
                }
            }
        }
        draw();
        if (cap) {
            cap.textContent = l1Hit > 0.4
                ? "More short trips (cache hits). Less waiting on RAM."
                : "Many long trips from RAM. Build caches to shorten them.";
        }
    }, speed);
}

function benchNextFix(id) {
    var prio = (id === "photo") ? ["cores", "fpu", "clock", "pipe"]
             : (id === "browser") ? ["pipe", "cu", "clock", "decoder"]
             : ["l1", "l2", "clock", "pipe"];
    for (var i = 0; i < prio.length; i++) {
        var k = prio[i], P = PART[k], stIdx = P.stage - 1;
        if (!game.parts[k].on) {
            if (game.stages[stIdx] === "open") {
                return { mode: "stage", arg: stIdx, label: "Build Stage " + P.stage + " (" + P.short + ")" };
            }
        } else if (game.parts[k].level < 5) {
            return { mode: "upgrades", arg: 0, label: "Upgrade " + P.short };
        }
    }
    for (var s = 0; s < 5; s++) {
        if (game.stages[s] === "open") return { mode: "stage", arg: s, label: "Open Stage " + (s + 1) };
    }
    return { mode: "upgrades", arg: 0, label: "Open Upgrades" };
}

function benchActionsHtml(m, meets, passed) {
    if (meets && !passed) {
        return "<div class='bench-actions'>" +
            "<button class='bigbtn bench-claim' onclick='runBenchNow()'>Claim +" + fmt(m.reward) + " ops</button>" +
            "<button class='btn' onclick='runBenchNow()'>Run Benchmark</button>" +
            "<button class='ghost' onclick='closeBenchmark()'>Close</button></div>";
    }
    if (passed) {
        return "<div class='bench-actions'>" +
            "<button class='bigbtn' onclick='runBenchNow()'>Run again</button>" +
            "<span class='bench-passed-pill'>Reward claimed</span>" +
            "<button class='ghost' onclick='closeBenchmark()'>Close</button></div>";
    }
    var act = benchNextFix(m.id);
    return "<div class='bench-actions'>" +
        "<button class='bigbtn' onclick='runBenchNow()'>Run Benchmark</button>" +
        "<button class='ghost' onclick=\"goBenchFix('" + act.mode + "'," + act.arg + ")\">" + act.label + "</button>" +
        "<button class='ghost' onclick='closeBenchmark()'>Close</button></div>";
}

function goBenchFix(mode, arg) {
    closeBenchmark();
    if (mode === "stage") { openHub(arg); return; }
    setTab(mode === "upgrades" ? "upgrades" : "stages");
}
