// benchmark.js: Architecture benchmark (CPU time = IC x CPI x cycle time)
// ---------------------------------------------------------
function setArchChoice(kind, val) { game.archChoices[kind] = val; save(); renderHud(); if (!el("benchModal").classList.contains("hidden")) renderBenchmark(); }
function openBenchmark() { el("benchModal").classList.remove("hidden"); renderBenchmark(); }
function closeBenchmark() { clearInterval(renderAnimId); renderAnimId = null; el("benchModal").classList.add("hidden"); }
function runBenchWl(wl) { activeBenchWl = wl; renderBenchmark(); }
function computeBenchMetrics() {
    var wls = {
        compute: { name: "🧮 AI / Pixel Render", icBase: 1.0, memHeavy: 0.15, branchHeavy: 0.10, parRatio: 0.90 },
        os: { name: "🔀 Branchy OS", icBase: 1.0, memHeavy: 0.25, branchHeavy: 0.70, parRatio: 0.20 },
        memory: { name: "📦 Large Array", icBase: 1.0, memHeavy: 0.85, branchHeavy: 0.15, parRatio: 0.65 }
    };
    var w = wls[activeBenchWl], isa = game.archChoices.isa || "risc", accel = game.archChoices.accel || "cpu";
    var icFactor = (isa === "risc") ? 1.18 : 0.85, idealIpc = lvl("pipe") > 0 ? [0.50, 1.00, 2.00, 3.00, 4.00][lvl("pipe") - 1] : 0.25;
    var baseCpi = 1 / idealIpc; if (isa === "cisc" && lvl("decoder") < 4) baseCpi += 0.25;
    var branchPenalty = w.branchHeavy * (lvl("pipe") > 0 ? 1.4 : 0.3) * Math.max(0.2, 1.0 - lvl("cu") * 0.15);
    var regMiss = Math.max(0.05, 0.35 - lvl("regs") * 0.06), l1Miss = Math.max(0.04, 0.45 - lvl("l1") * 0.08), l2Mit = Math.max(0.15, 1.0 - lvl("l2") * 0.16);
    var memStall = w.memHeavy * (regMiss * 4 + l1Miss * 14 * l2Mit), cores = coresNow();
    var effCores = (accel === "gpu") ? cores * (w.parRatio > 0.7 ? 3.2 : 0.8) : cores;
    var parallelGain = 1 / ((1 - w.parRatio) + (w.parRatio / Math.max(1, effCores)));
    if (accel === "gpu" && w.branchHeavy > 0.5) parallelGain *= 1.35;
    var effCpi = (baseCpi + branchPenalty + memStall) / parallelGain, /* FIX: speedup divides CPI (was *) */ clkGHz = Math.max(0.005, (clockMHz() || 5) / 1000);
    var cpuTime = (icFactor * effCpi) / clkGHz, tot = baseCpi + branchPenalty + memStall;
    var pComp = Math.max(8, Math.round((baseCpi / tot) * 100)), pHaz = Math.max(4, Math.round((branchPenalty / tot) * 100)), pMem = Math.max(4, 100 - pComp - pHaz);
    return { wls: wls, w: w, isa: isa, accel: accel, icFactor: icFactor, effCpi: effCpi, clkGHz: clkGHz, cpuTime: cpuTime, pComp: pComp, pHaz: pHaz, pMem: pMem };
}
function startPixelRender() {
    clearInterval(renderAnimId);
    var cells = el("pxGrid") ? el("pxGrid").children : null; if (!cells || cells.length < 256) return;
    for (var i = 0; i < 256; i++)cells[i].style.background = "#0f172a";
    var accel = game.archChoices.accel || "cpu";
    var lanes = Math.min(16, coresNow() * (accel === "gpu" ? 2 : 1));
    var clkBoost = lvl("clock") + 1, pipeBoost = lvl("pipe") + 1, hasL1 = lvl("l1") > 0, hasL2 = lvl("l2") > 0, hasFpu = lvl("fpu") > 0;
    var stepMs = Math.max(18, Math.round(95 - clkBoost * 10 - pipeBoost * 6 - (hasFpu ? 12 : 0)));
    var nextIdx = 0, t0 = Date.now(), stallTicks = 0;
    el("pxStatus").innerHTML = "Drawing with <b>" + lanes + " lane" + (lanes > 1 ? "s" : "") + "</b>...";
    renderAnimId = setInterval(function () {
        if (stallTicks > 0) { stallTicks--; return; }
        if (!hasL1 && nextIdx > 0 && nextIdx % 12 === 0 && Math.random() < 0.7) {
            stallTicks = hasL2 ? 1 : 2;
            el("pxStatus").innerHTML = "<span style='color:#f87171'>🐢 RAM Stall! (No L1 Cache)</span>";
            return;
        }
        for (var b = 0; b < lanes && nextIdx < 256; b++) {
            var r = Math.floor(nextIdx / 16), c = nextIdx % 16, ch = PIXEL_ART[r].charAt(c);
            cells[nextIdx].style.background = PX_COLORS[ch] || "#38bdf8";
            nextIdx++;
        }
        var sec = ((Date.now() - t0) / 1000).toFixed(2);
        el("pxStatus").innerHTML = "⚡ " + lanes + " px/step · <b>" + sec + "s</b> (" + Math.round(nextIdx * 100 / 256) + "%)";
        if (nextIdx >= 256) {
            clearInterval(renderAnimId); renderAnimId = null;
            el("pxStatus").innerHTML = "✅ Rendered in <b style='color:#34d399'>" + sec + "s</b> (" + lanes + " parallel lane" + (lanes > 1 ? "s" : "") + ")!";
            beep(720, 120);
        }
    }, stepMs);
}
function renderBenchmark() {
    clearInterval(renderAnimId); renderAnimId = null;
    var m = computeBenchMetrics(), lanes = Math.min(16, coresNow() * (m.accel === "gpu" ? 2 : 1));
    var gridCells = ""; for (var i = 0; i < 256; i++)gridCells += "<div class='px-cell'></div>";
    var c1 = m.pMem < 35, c2 = (lvl("cores") >= 1 && m.accel === "gpu"), c3 = (m.pHaz < 35 && m.accel === "cpu");
    el("benchCard").innerHTML =
        "<div style='display:flex;justify-content:space-between;align-items:center;'><h2 style='margin:0;'>🎨 TEST RENDER &amp; BENCHMARK</h2><button class='ghost' onclick='closeBenchmark()'>✕</button></div>" +
        "<div class='render-split'><div id='pxGrid' class='px-grid'>" + gridCells + "</div><div><div class='mono' style='font-size:11px;color:#38bdf8;font-weight:800;'>WATCH YOUR CPU RENDER (16×16)</div><div style='font-size:12px;color:#cbd5e1;margin:4px 0 8px;'>Active Lanes: <b style='color:#34d399'>" + lanes + " px/step</b> · L1 Cache: <b>" + (lvl("l1") > 0 ? "ON ⚡" : "OFF 🐢") + "</b></div><button class='bigbtn' style='padding:9px 18px;font-size:13px;' onclick='startPixelRender()'>▶ Render Picture with My CPU</button><div id='pxStatus' class='mono' style='font-size:11.5px;margin-top:8px;color:#94a3b8;'>Click Render to watch 1 vs multi-lane speed!</div></div></div>" +
        "<div style='display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;'>" + Object.keys(m.wls).map(function (k) { return "<button class='inst-pill" + (activeBenchWl === k ? " on" : "") + "' onclick=\"runBenchWl('" + k + "')\">" + m.wls[k].name + "</button>"; }).join("") + "</div>" +
        "<div class='arch-grid'><button class='arch-opt" + (m.isa === "risc" ? " on" : "") + "' onclick=\"setArchChoice('isa','risc')\"><b>RISC (Fixed 32b)</b><small>Simple fast decode (+15% Pipe/Dec CP/s)</small></button><button class='arch-opt" + (m.isa === "cisc" ? " on" : "") + "' onclick=\"setArchChoice('isa','cisc')\"><b>CISC (Variable ISA)</b><small>0.85× IC, heavier decode if Dec &lt; Lv4</small></button><button class='arch-opt" + (m.accel === "cpu" ? " on" : "") + "' onclick=\"setArchChoice('accel','cpu')\"><b>CPU Latency Focus</b><small>Best on Branchy OS</small></button><button class='arch-opt" + (m.accel === "gpu" ? " on" : "") + "' onclick=\"setArchChoice('accel','gpu')\"><b>GPU / NPU Vector</b><small>3.2× parallel AI &amp; pixel lanes</small></button></div>" +
        "<div class='part' style='margin-top:10px;background:#f8fafc;'><div style='display:flex;justify-content:space-between;font-family:ui-monospace,monospace;font-size:11.5px;'><span>IC: <b>" + m.icFactor.toFixed(2) + "×</b></span><span>CPI: <b>" + m.effCpi.toFixed(2) + "</b></span><span>Clock: <b>" + m.clkGHz.toFixed(2) + " GHz</b></span><span>Time: <b style='color:#1f9d73'>" + m.cpuTime.toFixed(2) + " ns/op</b></span></div><div class='bench-bar'><div style='width:" + m.pComp + "%;background:#10b981'>Compute " + m.pComp + "%</div><div style='width:" + m.pHaz + "%;background:#f59e0b'>Hazard " + m.pHaz + "%</div><div style='width:" + m.pMem + "%;background:#ef4444'>Memory " + m.pMem + "%</div></div><div class='contract-row'><span class='contract-pill" + (c1 ? " ok" : "") + "'>" + (c1 ? "✅" : "⬜") + " Memory Wall &lt; 35%</span><span class='contract-pill" + (c2 ? " ok" : "") + "'>" + (c2 ? "✅" : "⬜") + " Vector Lanes Ready</span><span class='contract-pill" + (c3 ? " ok" : "") + "'>" + (c3 ? "✅" : "⬜") + " Low-Hazard OS</span></div></div>";
}

// =========================================================================
// WELCOME / EVOLUTION / FEEDBACK
// =========================================================================
