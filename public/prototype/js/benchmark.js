// benchmark.js: 3 Client Benchmark Missions (Time = IC * CPI * T, Before/After, ChipBot diagnosis)
// ---------------------------------------------------------
var BENCH_MISSIONS = [
    {
        id: "photo",
        icon: "📱",
        title: "Phone Camera Burst",
        short: "Fix: more cores",
        targetNs: 8.0,
        unit: "ns/px",
        reward: 1200,
        hasPixelGrid: true,
        bg: "Tapping the shutter processes 4 million pixels at once. Each pixel is independent, but a single core forces every pixel to wait in one long queue.",
        profile: "92% Parallel · Integer + Float · Low Branching"
    },
    {
        id: "browser",
        icon: "🌐",
        title: "Browser & OS Tabs",
        short: "Fix: pipeline & control unit",
        targetNs: 6.5,
        unit: "ns/op",
        reward: 650,
        hasPixelGrid: false,
        bg: "Web layouts and OS schedulers are packed with if/else branches. Every mispredicted jump flushes the instruction pipeline and wastes work.",
        profile: "Heavy if/else Branches · Control Hazards · ISA Decode"
    },
    {
        id: "bigdata",
        icon: "📊",
        title: "Big Data Table Scan",
        short: "Fix: L1/L2 cache",
        targetNs: 12.0,
        unit: "ns/row",
        reward: 950,
        hasPixelGrid: false,
        bg: "Scanning a 2 GB dataset dwarfs on-chip storage. Without L1/L2 caches and compact code, the core stalls waiting on slow main RAM.",
        profile: "Memory Wall · Streaming Reads · Cache Locality"
    }
];

var activeBenchId = "", benchRenderTimer = null, benchReadyNotified = {};

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
        var bwFactor = isCisc ? 0.84 : 1.12; // compact CISC instructions reduce instruction-fetch traffic
        memCpi = bwFactor * (l1Miss * (1.6 + 8.5 * l2Miss));
        note = isCisc ? "CISC compact code eases memory traffic (-15% IC)." : "RISC +15% IC increases fetch pressure on RAM.";
    }

    var totalCpi = compCpi + hazCpi + memCpi;
    var timeNs = ic * totalCpi * cycleNs;
    var compPct = Math.round((compCpi / totalCpi) * 100);
    var hazPct = Math.round((hazCpi / totalCpi) * 100);
    var memPct = Math.max(0, 100 - compPct - hazPct);

    var diag = "";
    if (clkLv === 0) diag = "No Clock built yet (running at 2 MHz fallback). Build Stage 2 Clock & Pipeline!";
    else if (id === "photo" && cores < 4) diag = "Single/Dual-core bottleneck! Upgrade Multi-core in Stage 5 to unlock Amdahl parallel speedup (max 92% parallel).";
    else if (id === "photo" && fpuLv === 0) diag = "Software float emulation adds extra IC. Build the FPU in Stage 5!";
    else if (memPct >= 45) diag = memPct + "% of time is lost waiting on Memory! Build/upgrade L1 & L2 Cache (or test CISC to shrink IC).";
    else if (hazPct >= 35) diag = hazPct + "% of time is lost to Pipeline/Branch hazards! Upgrade CU & Pipeline (or test RISC for zero decode CPI).";
    else diag = "Balanced silicon! Push Clock frequency, Pipeline IPC, or toggle Overclock to shave off the last nanoseconds.";

    return {
        ic: ic, totalCpi: totalCpi, cycleNs: cycleNs, timeNs: timeNs,
        compPct: compPct, hazPct: hazPct, memPct: memPct,
        diag: diag, note: note, mhz: mhz
    };
}

function getMission(id) {
    for (var i = 0; i < BENCH_MISSIONS.length; i++) if (BENCH_MISSIONS[i].id === id) return BENCH_MISSIONS[i];
    return BENCH_MISSIONS[0];
}

function renderBenchList() {
    var card = el("benchCard");
    if (!card) return;
    if (!game.benchPassed) game.benchPassed = {};
    var passedCnt = 0;
    for (var i = 0; i < BENCH_MISSIONS.length; i++) if (game.benchPassed[BENCH_MISSIONS[i].id]) passedCnt++;

    var h = "<div class='panel-head'><div class='bench-head'><span class='bot-name'>SPEED TESTS</span><span class='mono' style='font-size:10.5px;color:var(--mint);font-weight:800'>" + passedCnt + "/3 PASSED</span></div><button type='button' class='ghost panel-close' onclick=\"toggleLeftPanel('bench')\" title='Collapse'>✕</button></div>";
    h += "<div class='muted' style='font-size:11px;margin:3px 0 6px;'>Real jobs your CPU has to run. Each one is slow because one part is weak. Upgrade that part to beat the goal. <b>Lower time = faster.</b></div>";
    for (var j = 0; j < BENCH_MISSIONS.length; j++) {
        var m = BENCH_MISSIONS[j], ev = evalBench(m.id), ok = !!game.benchPassed[m.id], meets = ev.timeNs <= m.targetNs;
        if (meets && !ok && !benchReadyNotified[m.id] && typeof eraReady !== "undefined" && eraReady && !G) {
            benchReadyNotified[m.id] = true;
            if (typeof BOT !== "undefined") BOT.say("🎉 Your CPU now beats <b>" + m.icon + " " + m.title + "</b>! Tap the <b>clock icon</b> on the left, then claim +" + fmt(m.reward) + " ops!", "party", "good");
            var dock = el("btnBenchDock");
            if (dock && leftPanel !== "bench") dock.classList.add("dock-ping");
        }
        h += "<div class='bench-row" + (ok ? " passed" : (meets ? " ready" : "")) + "' onclick=\"openBenchmark('" + m.id + "')\">" +
            "<div class='bench-row-top'><span><b>" + m.icon + " " + m.title + "</b></span>" +
            "<span class='mono' style='font-size:10px;white-space:nowrap;color:" + (ok ? "#059669" : (meets ? "#0284c7" : "#d97706")) + ";font-weight:800'>" + (ok ? "✓ PASS" : (meets ? "★ CLAIM!" : formatNs(ev.timeNs) + (ev.timeNs < 1000 ? " " + m.unit : "/" + m.unit.split("/")[1]))) + "</span></div>" +
            "<div class='bench-row-sub'>" + m.short + " · Goal ≤ " + m.targetNs + " " + m.unit + "</div></div>";
    }
    card.innerHTML = h;
}

function formatNs(v) { return v >= 1000 ? (v / 1000).toFixed(2) + " µs" : v.toFixed(1); }

function openBenchmark(id) {
    activeBenchId = id;
    if (!game.benchBaseline) game.benchBaseline = {};
    if (!game.benchPassed) game.benchPassed = {};
    var ev = evalBench(id);
    if (!game.benchBaseline[id]) { game.benchBaseline[id] = ev.timeNs; save(); }
    el("benchModal").classList.remove("hidden");
    renderBenchModal(false);
}

function closeBenchmark() {
    if (benchRenderTimer) { clearInterval(benchRenderTimer); benchRenderTimer = null; }
    el("benchModal").classList.add("hidden");
    activeBenchId = "";
}

function runBenchNow() {
    if (!activeBenchId) return;
    var m = getMission(activeBenchId), ev = evalBench(m.id);
    if (ev.timeNs <= m.targetNs && !game.benchPassed[m.id]) {
        game.benchPassed[m.id] = true;
        gainCp(m.reward);
        toast("🏆 Passed " + m.title + "! +" + fmt(m.reward) + " ops");
        BOT.say("🏆 Benchmark passed: <b>" + m.title + "</b> (" + ev.timeNs.toFixed(1) + " ≤ " + m.targetNs + " " + m.unit + ")! +" + fmt(m.reward) + " ops!", "party", "good");
        save();
        renderHud();
        renderBenchList();
    } else if (ev.timeNs <= m.targetNs) {
        toast("✅ Still passing (" + ev.timeNs.toFixed(1) + " " + m.unit + ")!");
        beep(640, 70);
    } else {
        BOT.say("📊 " + m.title + ": " + ev.diag, "think", "warn");
        beep(320, 90);
    }
    renderBenchModal(true);
}

function renderBenchModal(animatePixels) {
    var m = getMission(activeBenchId), ev = evalBench(m.id);
    var baseNs = (game.benchBaseline && game.benchBaseline[m.id]) || ev.timeNs;
    var speedup = baseNs / Math.max(0.01, ev.timeNs);
    var meets = ev.timeNs <= m.targetNs;
    var passed = !!(game.benchPassed && game.benchPassed[m.id]);

    var pxHtml = "";
    if (m.hasPixelGrid) {
        var cells = "";
        for (var p = 0; p < 256; p++) cells += "<div class='px-cell' id='pxc_" + p + "'></div>";
        pxHtml = "<div class='render-split'><div class='px-grid' id='benchPxGrid'>" + cells + "</div><div><div class='mono' style='font-size:11px;color:#38bdf8;font-weight:800'>LIVE 16×16 SENSOR BURST</div><div style='font-size:12.5px;margin:4px 0 8px;color:#cbd5e1;line-height:1.4'>Watch cores shade 256 pixels. More cores + higher clock = faster shutter frame!</div><div class='mono' style='font-size:11px;color:#34d399'>" + ev.note + "</div></div></div>";
    }

    var isaSwitch = "<div class='arch-grid' style='margin:6px 0 10px;'>" +
        "<button class='arch-opt" + (game.archChoices.isa === "risc" ? " on" : "") + "' onclick=\"setArchChoice('isa','risc');renderBenchModal(false);renderBenchList();\"><b>RISC (Fixed 32b)</b><small>0 decode CPI · +15% IC (wins Branchy)</small></button>" +
        "<button class='arch-opt" + (game.archChoices.isa === "cisc" ? " on" : "") + "' onclick=\"setArchChoice('isa','cisc');renderBenchModal(false);renderBenchList();\"><b>CISC (Compact)</b><small>-15% IC · +decode CPI (helps Memory)</small></button></div>";

    var html = "<div class='modal-card'>" +
        "<div style='display:flex;justify-content:space-between;align-items:flex-start;gap:10px;'><div><h2>" + m.icon + " " + m.title.toUpperCase() + "</h2><div class='mono' style='font-size:11px;color:var(--indigo);font-weight:700'>" + m.profile + "</div></div><button class='ghost' onclick='closeBenchmark()'>✕</button></div>" +
        "<p class='muted' style='margin:8px 0 8px'>" + m.bg + "</p>" +
        "<div class='mono' style='font-size:11px;background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;border-radius:9px;padding:6px 10px;margin-bottom:8px;'><b>HOW IT WORKS:</b> 1. Read the bottleneck bar &rarr; 2. Build/upgrade CPU parts &rarr; 3. Re-test &amp; claim ops!</div>" +
        pxHtml +
        "<div class='part' style='margin:6px 0;background:#f8fafc;'>" +
        "<div class='mono' style='font-size:12px;font-weight:800;color:#1e293b'>Time = IC (" + ev.ic.toFixed(1) + ") × CPI (" + ev.totalCpi.toFixed(2) + ") × T (" + ev.cycleNs.toFixed(1) + " ns) = <span style='color:" + (meets ? "#059669" : "#d97706") + "'>" + formatNs(ev.timeNs) + " " + (ev.timeNs < 1000 ? m.unit : "") + "</span></div>" +
        "<div class='bench-bar'>" +
        "<div style='width:" + ev.compPct + "%;background:#22b585' title='CPU work'>CPU " + ev.compPct + "%</div>" +
        "<div style='width:" + ev.hazPct + "%;background:#f59e0b' title='Hazards'>HAZ " + ev.hazPct + "%</div>" +
        "<div style='width:" + ev.memPct + "%;background:#ef4444' title='Memory'>MEM " + ev.memPct + "%</div>" +
        "</div>" +
        "<div class='mono' style='font-size:10.5px;color:var(--muted)'>" + ev.note + "</div>" +
        "</div>" +
        "<div class='stage-speech' style='text-align:left;margin:8px 0;'>🤖 <b>ChipBot Diagnosis:</b> " + ev.diag + "</div>" +
        "<div class='mono' style='font-size:10.5px;color:var(--muted);margin-top:6px'>TEST ISA TRADE-OFF LIVE:</div>" +
        isaSwitch +
        "<div class='visual-ba' style='margin-top:6px;'>" +
        "<div class='ba-card'><div class='ba-title'>BEFORE (BASELINE)</div><div class='mono' style='font-size:18px;font-weight:800'>" + formatNs(baseNs) + " " + (baseNs < 1000 ? m.unit : "") + "</div></div>" +
        "<div class='mono' style='font-size:20px;font-weight:900;color:var(--indigo);text-align:center'>➔</div>" +
        "<div class='ba-card " + (meets ? "after" : "") + "'><div class='ba-title'>AFTER (TARGET ≤ " + m.targetNs + " " + m.unit + ")</div><div class='mono' style='font-size:18px;font-weight:800;color:" + (meets ? "#065f46" : "#b45309") + "'>" + formatNs(ev.timeNs) + " " + (ev.timeNs < 1000 ? m.unit : "") + "</div><small class='mono'>" + (speedup > 1.05 ? speedup.toFixed(1) + "× faster!" : (passed ? "Target met ✓" : "Upgrade parts & re-run")) + "</small></div>" +
        "</div>" +
        benchActionsHtml(m, meets, passed) +
        "</div>";

    el("benchModal").innerHTML = html;
    if (m.hasPixelGrid) startPixelBurst(ev.timeNs, animatePixels);
}

function startPixelBurst(timeNs, animate) {
    if (benchRenderTimer) { clearInterval(benchRenderTimer); benchRenderTimer = null; }
    var palette = ["#0ea5e9", "#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#818cf8"];
    function paintCell(idx) {
        var c = el("pxc_" + idx); if (!c) return;
        var x = idx % 16, y = Math.floor(idx / 16);
        var ring = Math.abs(x - 7.5) + Math.abs(y - 7.5);
        c.style.background = palette[Math.floor(ring + (x * 3 + y) % 3) % palette.length];
    }
    if (!animate) { for (var i = 0; i < 256; i++) paintCell(i); return; }
    var idx = 0, batch = Math.max(2, Math.min(32, Math.round(320 / Math.max(4, timeNs))));
    benchRenderTimer = setInterval(function () {
        for (var k = 0; k < batch && idx < 256; k++, idx++) paintCell(idx);
        if (idx >= 256) { clearInterval(benchRenderTimer); benchRenderTimer = null; }
    }, 35);
}

function benchNextFix(id) {
    var prio = (id === "photo") ? ["cores", "fpu", "clock", "pipe"]
             : (id === "browser") ? ["pipe", "cu", "clock", "decoder"]
             : ["l1", "l2", "clock", "pipe"];
    for (var i = 0; i < prio.length; i++) {
        var k = prio[i], P = PART[k], stIdx = P.stage - 1;
        if (!game.parts[k].on) {
            if (game.stages[stIdx] === "open") {
                return { mode: "stage", arg: stIdx, label: "▶ Build Stage " + P.stage + " (" + P.short + ")" };
            }
        } else if (game.parts[k].level < 5) {
            return { mode: "upgrades", arg: 0, label: "🔧 Upgrade " + P.short + " in MENU" };
        }
    }
    for (var s = 0; s < 5; s++) {
        if (game.stages[s] === "open") return { mode: "stage", arg: s, label: "▶ Open Stage " + (s + 1) + " to Unlock More" };
    }
    return { mode: "upgrades", arg: 0, label: "🔧 Open UPGRADES" };
}

function benchActionsHtml(m, meets, passed) {
    if (meets && !passed) {
        return "<div style='display:flex;gap:8px;margin-top:12px;'>" +
            "<button class='bigbtn' style='flex:1;padding:10px 18px;font-size:14px;' onclick='runBenchNow()'>🏆 Claim +" + fmt(m.reward) + " ops!</button>" +
            "<button class='ghost' onclick='closeBenchmark()'>Close</button></div>";
    }
    if (passed) {
        return "<div style='display:flex;gap:8px;margin-top:12px;'>" +
            "<button class='bigbtn' style='flex:1;padding:10px 18px;font-size:14px;' onclick='runBenchNow()'>↻ Re-run Benchmark (✓ Passed)</button>" +
            "<button class='ghost' onclick='closeBenchmark()'>Close</button></div>";
    }
    var act = benchNextFix(m.id);
    return "<div style='display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;'>" +
        "<button class='bigbtn' style='flex:1;padding:10px 16px;font-size:13.5px;background:linear-gradient(135deg,#4a47c8,#0ea5e9);' onclick=\"goBenchFix('" + act.mode + "'," + act.arg + ")\">" + act.label + "</button>" +
        "<button class='ghost' onclick='runBenchNow()'>↻ Re-test</button>" +
        "<button class='ghost' onclick='closeBenchmark()'>Close</button></div>";
}

function goBenchFix(mode, arg) {
    closeBenchmark();
    if (mode === "stage") { openHub(arg); return; }
    setTab(mode === "upgrades" ? "upgrades" : "stages");
}
