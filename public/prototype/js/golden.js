// golden.js: Golden Chip challenge and Overclock Frenzy
// ---------------------------------------------------------
// =========================================================================
// GOLDEN CHIP: VISUAL OVERCLOCK BLITZ + 3× OVERCLOCK FRENZY
// =========================================================================
function activateFrenzy(mult, seconds) {
    frenzyMult = mult; frenzyUntil = Date.now() + seconds * 1000; document.body.classList.add("frenzy-on"); renderHud();
    BOT.say("🔥 <b>" + mult + "× OVERCLOCK FRENZY!</b> All chip traces supercharged for " + seconds + "s!", "party", "good");
}
function updateFrenzyUi() {
    var rem = frenzyUntil - Date.now(), b = el("frenzyBanner");
    if (rem > 0) { document.body.classList.add("frenzy-on"); b.classList.remove("hidden"); b.textContent = "🔥 " + frenzyMult + "× OVERCLOCK FRENZY · " + (rem / 1000).toFixed(1) + "s"; }
    else { if (document.body.classList.contains("frenzy-on")) { document.body.classList.remove("frenzy-on"); frenzyMult = 1; renderHud(); } b.classList.add("hidden"); }
}
function modalsBusy() {
    var ids = ["welcomeScreen", "evolutionScreen", "stageTheater", "goldenModal", "benchModal", "feedbackModal"];
    for (var i = 0; i < ids.length; i++)if (!el(ids[i]).classList.contains("hidden")) return true;
    return !!G;
}
function spawnGoldenChip() {
    if (goldenActive || modalsBusy() || installedCount() < 2) return;
    goldenActive = true;
    el("goldenLayer").innerHTML = "<button id='goldenBtn' class='golden-chip-btn' onclick='openGoldenChallenge()'><span class='golden-spin'>🪙</span><span>✨ GOLDEN CHIP!</span><span id='goldCd'>10s</span></button>";
    beep(660, 90);
    var left = 10; clearInterval(goldenTimer);
    goldenTimer = setInterval(function () { left--; var cd = el("goldCd"); if (cd) cd.textContent = left + "s"; if (left <= 0 || !goldenActive) { clearInterval(goldenTimer); goldenActive = false; if (el("goldenLayer")) el("goldenLayer").innerHTML = ""; } }, 1000);
}
function buildGoldenChallenge() {
    var pool = [];
    if (game.parts.l1.on) {
        pool.push({ cKey: "l1_lru", tag: "STAGE 4 · L1 CACHE LRU BLITZ", visual: "<div style='text-align:center;font-size:15px;margin-bottom:4px;'>CPU requests <b class='mono' style='font-size:22px;color:#fbbf24'>D</b> → <b style='color:#f87171'>CACHE MISS!</b></div><div class='muted' style='color:#94a3b8;text-align:center;font-size:12px;'>Click the <b>LRU slot</b> to evict:</div>", cols: "cols3", opts: ["<div style='text-align:center;font-size:22px;' class='mono'>A</div><div class='agebar'><div style='width:75%;background:#22c55e'></div></div><div class='mono' style='font-size:11px;color:#94a3b8;text-align:center;'>Slot 1 · age 1</div>", "<div style='text-align:center;font-size:22px;' class='mono'>B</div><div class='agebar'><div style='width:22%;background:#ef4444'></div></div><div class='mono' style='font-size:11px;color:#fca5a5;text-align:center;'>Slot 2 · age 4</div>", "<div style='text-align:center;font-size:22px;' class='mono'>C</div><div class='agebar'><div style='width:95%;background:#10b981'></div></div><div class='mono' style='font-size:11px;color:#94a3b8;text-align:center;'>Slot 3 · age 0</div>"], ans: 1, hint: "LRU = Least Recently Used = reddest bar (highest age)!", winText: "Evicted B (age 4)! Hot items A & C stay in L1." });
    }
    if (game.parts.pipe.on) {
        pool.push({ cKey: "pipe_loaduse", tag: "STAGE 2 · PIPELINE HAZARD BLITZ", visual: "<div class='pinfo' style='background:#0f172a;border-color:#334155;color:#f8fafc;margin-bottom:6px;'><b>A:</b> LW <span style='color:#f87171'>R1</span>, 0(R2)<br><b>B:</b> ADD R3, <span style='color:#f87171'>R1</span>, R4</div><table class='gantt' style='color:#1c2b3a'><tr><th>Inst</th><th>C1</th><th>C2</th><th>C3</th><th>C4</th><th>C5</th></tr><tr><td><b>A</b></td><td class='stg'>IF</td><td class='stg'>ID</td><td class='stg'>EX</td><td class='stg'>MEM</td><td class='stg'>WB</td></tr><tr><td><b>B</b></td><td></td><td class='stg'>IF</td><td class='stg'>ID</td><td class='haz'>HAZ!</td><td class='stg'>MEM</td></tr></table>", cols: "cols2", opts: ["✅ Run Normal (0 stalls)", "⚡ EX→EX Forward (0 stalls)", "⏸ Stall 1 + MEM→EX Fwd", "🧹 Flush Branch Path"], ans: 2, hint: "LW only reads RAM at the END of MEM (Cycle 4)!", winText: "Load-Use caught! 1 stall cycle + MEM→EX forwarding." });
        pool.push({ cKey: "pipe_sched", tag: "STAGE 2 · COMPILER SCHEDULING BLITZ", visual: "<div class='pinfo' style='background:#0f172a;border-color:#334155;color:#f8fafc;margin-bottom:6px;'><b>A:</b> LW <span style='color:#f87171'>R1</span>, 0(R2)<br><b>B:</b> ADD R7, R8, R9 <span style='color:#34d399'>[unrelated!]</span><br><b>C:</b> SUB R4, <span style='color:#f87171'>R1</span>, R5</div>", cols: "cols2", opts: ["⚡ MEM→EX Fwd (0 extra stalls!)", "⏸ Must Stall 1 extra cycle", "🧹 Flush B", "⚠️ Structural Bus Collision"], ans: 0, hint: "Unrelated instruction B already filled the 1-cycle load delay slot!", winText: "Compiler scheduling solved the wait with 0 extra stalls!" });
    }
    if (game.parts.alu.on) {
        pool.push({ cKey: "alu_overflow", tag: "STAGE 1 · 4-BIT OVERFLOW BLITZ", visual: "<div class='mono' style='text-align:center;font-size:16px;background:#0f172a;padding:10px;border-radius:10px;border:1px solid #334155;'>A = <b>1100</b> (12) &nbsp;+&nbsp; B = <b>0111</b> (7) &nbsp;=&nbsp; <b style='color:#fbbf24'>19</b></div><div class='muted' style='color:#94a3b8;text-align:center;font-size:12px;margin-top:4px;'>Pick the matching 5-lamp LED state [OVF(16) · 8 · 4 · 2 · 1]:</div>", cols: "cols2", opts: ["<div class='mono' style='font-size:12px'>Sum = 3, OVF OFF</div><div class='mini-lamps'><span class='mlamp'>0</span><span class='mlamp'>0</span><span class='mlamp'>0</span><span class='mlamp on'>1</span><span class='mlamp on'>1</span></div>", "<div class='mono' style='font-size:12px'>Max = 15, OVF OFF</div><div class='mini-lamps'><span class='mlamp'>0</span><span class='mlamp on'>1</span><span class='mlamp on'>1</span><span class='mlamp on'>1</span><span class='mlamp on'>1</span></div>", "<div class='mono' style='font-size:12px;color:#34d399'>16 (OVF) + 3 = 19</div><div class='mini-lamps'><span class='mlamp ovf'>1</span><span class='mlamp'>0</span><span class='mlamp'>0</span><span class='mlamp on'>1</span><span class='mlamp on'>1</span></div>", "<div class='mono' style='font-size:12px'>16 (OVF) + 4 = 20</div><div class='mini-lamps'><span class='mlamp ovf'>1</span><span class='mlamp'>0</span><span class='mlamp on'>1</span><span class='mlamp'>0</span><span class='mlamp'>0</span></div>"], ans: 2, hint: "4 bits max out at 15! 19 = 16 (OVF red LED) + 2 + 1.", winText: "OVF(16) = 1 and 4-bit remainder = 0011 (3)!" });
    }
    if (game.parts.decoder.on) {
        pool.push({ cKey: "decoder_bits", tag: "STAGE 3 · BINARY OPCODE BLITZ", visual: "<div class='mono' style='font-size:11.5px;background:#0f172a;padding:8px 10px;border-radius:8px;color:#cbd5e1;text-align:center;'>OP: <b>00</b> ADD · <b>01</b> SUB · <b>10</b> AND · <b>11</b> OR &nbsp;|&nbsp; REG: <b>00</b> R0 · <b>01</b> R1 · <b>10</b> R2 · <b>11</b> R3</div><div style='display:flex;justify-content:center;gap:10px;margin-top:8px;' class='mono'><span style='padding:6px 12px;border-radius:8px;border:2px solid #a78bfa;color:#c4b5fd;font-size:20px;font-weight:900'>01</span><span style='padding:6px 12px;border-radius:8px;border:2px solid #60a5fa;color:#93c5fd;font-size:20px;font-weight:900'>10</span><span style='padding:6px 12px;border-radius:8px;border:2px solid #34d399;color:#6ee7b7;font-size:20px;font-weight:900'>01</span></div>", cols: "cols2", opts: ["ADD R2, R1", "SUB R2, R1", "AND R1, R2", "SUB R1, R2"], ans: 1, hint: "Read left to right: [01 = SUB] [10 = R2] [01 = R1].", winText: "Decoded! 01=SUB, 10=R2, 01=R1." });
    }
    if (game.parts.cores.on) {
        pool.push({ cKey: "cores_serial", tag: "STAGE 5 · AMDAHL'S LAW BLITZ", visual: "<div style='background:#0f172a;padding:10px;border-radius:10px;border:1px solid #334155;font-size:12px;' class='mono'><div>CORE 1: <span style='color:#38bdf8'>[████░░] IMG (2s)</span></div><div>CORE 2–4: <span style='color:#94a3b8'>idle 💤</span></div><div style='margin-top:6px;padding:4px 8px;background:#334155;display:inline-block;border-radius:6px;'>NEXT TASK: <b>🔒 SERIAL</b></div></div>", cols: "cols2", opts: ["Dispatch SERIAL to Core 2 now", "Wait for Core 1 so ALL 4 cores are idle"], ans: 1, hint: "Amdahl's Law: a SERIAL task locks the entire chip and cannot overlap with IMG!", winText: "Correct! Serial bottlenecks must wait for all cores to clear." });
    }
    pool.push({ cKey: "cu_dispatch", tag: "STAGE 1 · DATAPATH ROUTING BLITZ", visual: "<div style='text-align:center;margin:6px 0;'><span class='dpop' style='color:#1c2b3a;display:inline-block;padding:10px 18px;font-size:22px;'>CMP R1, R2</span></div><div class='muted' style='color:#94a3b8;text-align:center;font-size:12px;'>Route to the unit that executes this comparison:</div>", cols: "cols3", opts: ["🎛️ Control Unit", "⚙️ ALU", "🗂️ Registers"], ans: 1, hint: "CU directs signals; which hardware unit actually computes math & comparisons?", winText: "Exact! The ALU executes arithmetic and comparisons." });
    var topC = topConfusionKey(); for (var i = 0; i < pool.length; i++)if (pool[i].cKey === topC) return pool[i];
    return pool[rand(0, pool.length - 1)];
}
function openGoldenChallenge() {
    clearInterval(goldenTimer); goldenActive = false; el("goldenLayer").innerHTML = "";
    currentGolden = buildGoldenChallenge(); currentGolden.attempt = 1; var q = currentGolden;
    var optsHtml = q.opts.map(function (html, idx) { return "<button id='gopt_" + idx + "' class='gvis-btn' onclick='answerGolden(" + idx + ")'>" + html + "</button>"; }).join("");
    el("goldenCard").innerHTML = "<div style='display:flex;justify-content:space-between;align-items:center;'><span class='mono' style='color:#fbbf24;font-size:11px;font-weight:800;letter-spacing:2px;'>⚡ GOLDEN CHIP · OVERCLOCK BLITZ</span><button class='ghost' style='background:#1e293b;color:#cbd5e1;border-color:#475569;' onclick='closeGolden()'>✕</button></div><div class='mono' style='font-size:10.5px;color:#38bdf8;margin:6px 0 8px;'>" + q.tag + "</div>" + q.visual + "<div class='gvis-grid " + q.cols + "'>" + optsHtml + "</div><div id='goldenStatus' style='margin-top:12px;font-size:12.5px;min-height:22px;color:#fde68a;text-align:center;'>⚡ <b>1st-Shot Hit:</b> 120s CP + <b>18s 3× OVERCLOCK FRENZY!</b> (0 CP lost on miss)</div>";
    el("goldenModal").classList.remove("hidden");
}
function answerGolden(idx) {
    var q = currentGolden; if (!q || q.done) return;
    var btn = el("gopt_" + idx), baseReward = Math.max(250, Math.round((totalCps() / currentFrenzyMult()) * 120));
    if (idx === q.ans) {
        q.done = true; if (btn) btn.classList.add("win");
        var isFirst = (q.attempt === 1), payout = isFirst ? baseReward : Math.round(baseReward * 0.5), mult = isFirst ? 3 : 2, secs = isFirst ? 18 : 12;
        gainCp(payout); if (q.cKey && game.confusions[q.cKey] > 0) game.confusions[q.cKey]--;
        var stIdx = CONFUSIONS[q.cKey] ? CONFUSIONS[q.cKey].stage : 0; game.objStats[stIdx].hits++; beep(isFirst ? 880 : 680, 160);
        el("goldenStatus").innerHTML = "<b style='color:#34d399;font-size:15px;'>" + (isFirst ? "⚡ CRITICAL HIT!" : "✨ RESCUE HIT!") + "</b> +" + fmt(payout) + " CP &amp; <b>" + mult + "× OVERCLOCK (" + secs + "s)</b>!<br><span style='color:#cbd5e1'>" + q.winText + "</span>";
        save(); setTimeout(function () { closeGolden(); activateFrenzy(mult, secs); toast((isFirst ? "⚡ CRITICAL HIT! +" : "✨ RESCUE HIT! +") + fmt(payout) + " CP · " + mult + "× FRENZY!"); }, 1150);
    } else {
        if (btn) { btn.classList.add("wrong"); btn.disabled = true; } beep(200, 120);
        if (q.attempt === 1) { q.attempt = 2; el("goldenStatus").innerHTML = "<b style='color:#fca5a5;'>Missed! (0 CP lost)</b> 💡 Hint: " + q.hint + "<br><i>1 rescue shot left for 50% CP + 2× Overclock!</i>"; }
        else { q.done = true; el("goldenStatus").innerHTML = "<b style='color:#fca5a5;'>Out of shots!</b> 💡 " + q.hint; setTimeout(closeGolden, 1700); }
    }
}
function closeGolden() { el("goldenModal").classList.add("hidden"); }
