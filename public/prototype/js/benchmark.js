// benchmark.js: Architecture benchmark (CPU time = IC x CPI x cycle time)
// ---------------------------------------------------------
// =========================================================================
// BENCHMARK, WELCOME, EVOLUTION, FEEDBACK
// =========================================================================
function setArchChoice(kind, val) { game.archChoices[kind] = val; save(); renderHud(); if (!el("benchModal").classList.contains("hidden")) renderBenchmark(); }
function openBenchmark() { el("benchModal").classList.remove("hidden"); renderBenchmark(); }
function closeBenchmark() { el("benchModal").classList.add("hidden"); }
function runBenchWl(wl) { activeBenchWl = wl; renderBenchmark(); }
function renderBenchmark() {
    var wls = { compute: { name: "🧮 Dense Compute / AI Matrix", icBase: 1.0, memHeavy: 0.15, branchHeavy: 0.10, parRatio: 0.90 }, os: { name: "🔀 Branchy OS & Control Logic", icBase: 1.0, memHeavy: 0.25, branchHeavy: 0.70, parRatio: 0.20 }, memory: { name: "📦 Large Array Memory Stream", icBase: 1.0, memHeavy: 0.85, branchHeavy: 0.15, parRatio: 0.65 } };
    var w = wls[activeBenchWl], isa = game.archChoices.isa || "risc", accel = game.archChoices.accel || "cpu";
    var icFactor = (isa === "risc") ? 1.18 : 0.85, idealIpc = lvl("pipe") > 0 ? [0.50, 1.00, 2.00, 3.00, 4.00][lvl("pipe") - 1] : 0.25;
    var baseCpi = 1 / idealIpc; if (isa === "cisc" && lvl("decoder") < 4) baseCpi += 0.25;
    var branchPenalty = w.branchHeavy * (lvl("pipe") > 0 ? 1.4 : 0.3) * Math.max(0.2, 1.0 - lvl("cu") * 0.15);
    var regMiss = Math.max(0.05, 0.35 - lvl("regs") * 0.06), l1Miss = Math.max(0.04, 0.45 - lvl("l1") * 0.08), l2Mit = Math.max(0.15, 1.0 - lvl("l2") * 0.16);
    var memStall = w.memHeavy * (regMiss * 4 + l1Miss * 14 * l2Mit), cores = coresNow();
    var effCores = (accel === "gpu") ? cores * (w.parRatio > 0.7 ? 3.2 : 0.8) : cores, parallelGain = 1 / ((1 - w.parRatio) + (w.parRatio / Math.max(1, effCores)));
    if (accel === "gpu" && w.branchHeavy > 0.5) parallelGain *= 1.35;
    var effCpi = (baseCpi + branchPenalty + memStall) / parallelGain, /* FIX: speedup divides CPI (was *) */ clkGHz = Math.max(0.005, (clockMHz() || 5) / 1000);
    var cpuTime = ((icFactor * effCpi) / clkGHz).toFixed(2), tot = baseCpi + branchPenalty + memStall;
    var pComp = Math.max(8, Math.round((baseCpi / tot) * 100)), pHaz = Math.max(4, Math.round((branchPenalty / tot) * 100)), pMem = Math.max(4, 100 - pComp - pHaz);
    var diag = "";
    if (pMem >= 45) diag = "🚨 <b>Memory Wall!</b> " + pMem + "% of cycles stall waiting on DRAM. Build/upgrade <b>L1 Cache, L2 Cache &amp; Registers</b>!";
    else if (pHaz >= 35) diag = "⚠️ <b>Control Hazard Bottleneck!</b> Branch stalls inflate CPI. Upgrade <b>Control Unit (Speculative)</b> or keep CPU cores for branching!";
    else if (accel === "gpu" && activeBenchWl === "os") diag = "⚠️ <b>Warp Divergence!</b> Branchy OS code runs worse on GPU/NPU lanes than low-latency CPU cores.";
    else if (accel === "cpu" && activeBenchWl === "compute") diag = "💡 <b>Tip:</b> Try switching Stage 5 die focus to <b>GPU/NPU Vector Lanes</b> to accelerate parallel compute!";
    else diag = "✅ <b>Well-Balanced Silicon!</b> Low CPI (" + effCpi.toFixed(2) + ") across this workload.";
    el("benchCard").innerHTML = "<div style='display:flex;justify-content:space-between;align-items:center;'><h2 style='margin:0;'>📊 ARCHITECTURE BENCHMARK</h2><button class='ghost' onclick='closeBenchmark()'>✕</button></div><div class='muted' style='font-size:12px;margin-top:4px;'>Simulates <b>CPU Time = IC × CPI × Cycle Time</b> using your actual 3D CPU parts &amp; die choices.</div><div class='fb-label' style='color:var(--indigo);'>1. PICK WORKLOAD</div><div style='display:flex;gap:6px;flex-wrap:wrap;'>" + Object.keys(wls).map(function (k) { return "<button class='inst-pill" + (activeBenchWl === k ? " on" : "") + "' onclick=\"runBenchWl('" + k + "')\">" + wls[k].name + "</button>"; }).join("") + "</div><div class='fb-label' style='color:var(--indigo);'>2. SILICON DESIGN CHOICES</div><div class='arch-grid'><button class='arch-opt" + (isa === "risc" ? " on" : "") + "' onclick=\"setArchChoice('isa','risc')\"><b>RISC (Fixed 32-bit)</b><small>More instructions (1.18× IC), simpler decode &amp; +15% Pipe/Dec CP/s.</small></button><button class='arch-opt" + (isa === "cisc" ? " on" : "") + "' onclick=\"setArchChoice('isa','cisc')\"><b>CISC (Variable ISA)</b><small>Compact code (0.85× IC), heavier decode (+0.25 CPI if low Dec).</small></button><button class='arch-opt" + (accel === "cpu" ? " on" : "") + "' onclick=\"setArchChoice('accel','cpu')\"><b>CPU Latency Focus</b><small>Excels on branchy OS code &amp; pointer-heavy serial tasks.</small></button><button class='arch-opt" + (accel === "gpu" ? " on" : "") + "' onclick=\"setArchChoice('accel','gpu')\"><b>GPU / NPU Lanes</b><small>3.2× throughput on parallel compute; stalls on branch divergence.</small></button></div><div class='part' style='margin-top:12px;background:#f8fafc;'><div style='display:flex;justify-content:space-between;font-family:ui-monospace,monospace;font-size:12px;'><span>IC: <b>" + icFactor.toFixed(2) + "×</b></span><span>Eff. CPI: <b>" + effCpi.toFixed(2) + "</b></span><span>Clock: <b>" + clkGHz.toFixed(2) + " GHz</b></span><span>Rel. Time: <b style='color:#1f9d73'>" + cpuTime + " ns/op</b></span></div><div class='bench-bar'><div style='width:" + pComp + "%;background:#10b981'>Compute " + pComp + "%</div><div style='width:" + pHaz + "%;background:#f59e0b'>Hazard " + pHaz + "%</div><div style='width:" + pMem + "%;background:#ef4444'>Memory " + pMem + "%</div></div><div style='font-size:12.5px;line-height:1.4;'>" + diag + "</div></div>";
}
