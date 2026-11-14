// theater.js: Humanoid ChipBot walk-in theater, donut chart, stage brief and debrief
// ---------------------------------------------------------
// =========================================================================
// HUMANOID CHIPBOT + CENTER-SCREEN WALK-IN THEATER + DONUT CHART
// =========================================================================
function humanoidBotSvg(mood, w, h) {
    var ant = mood === "alert" ? "#ef4444" : (mood === "party" ? "#f59e0b" : (mood === "happy" ? "#10b981" : "#38bdf8"));
    var core = mood === "alert" ? "#f87171" : (mood === "party" ? "#fbbf24" : "#34d399");
    var eyes = (mood === "happy" || mood === "party") ? '<path d="M38 29 Q42 24 46 29" stroke="#34d399" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M54 29 Q58 24 62 29" stroke="#34d399" stroke-width="2.8" fill="none" stroke-linecap="round"/>' : (mood === "alert") ? '<path d="M38 25 L45 32 M45 25 L38 32" stroke="#f87171" stroke-width="2.6" stroke-linecap="round"/><path d="M55 25 L62 32 M62 25 L55 32" stroke="#f87171" stroke-width="2.6" stroke-linecap="round"/>' : '<circle cx="42" cy="29" r="3" fill="#38bdf8"/><circle cx="58" cy="29" r="3" fill="#38bdf8"/>';
    var mouth = (mood === "alert") ? '<path d="M43 38 Q50 34 57 38" stroke="#f87171" stroke-width="2.4" fill="none"/>' : '<path d="M42 36 Q50 42 58 36" stroke="#34d399" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    return '<svg viewBox="0 0 100 132" width="' + (w || 110) + '" height="' + (h || 145) + '"><ellipse cx="50" cy="126" rx="24" ry="4.5" fill="rgba(0,0,0,0.42)"/><g class="h-leg-l"><rect x="37" y="86" width="10" height="29" rx="5" fill="#475569" stroke="#94a3b8" stroke-width="1.4"/><rect x="33" y="110" width="16" height="9" rx="4" fill="#1e293b" stroke="' + ant + '" stroke-width="1.8"/></g><g class="h-leg-r"><rect x="53" y="86" width="10" height="29" rx="5" fill="#475569" stroke="#94a3b8" stroke-width="1.4"/><rect x="51" y="110" width="16" height="9" rx="4" fill="#1e293b" stroke="' + ant + '" stroke-width="1.8"/></g><g class="h-arm-l"><rect x="16" y="51" width="10" height="28" rx="5" fill="#64748b" stroke="#cbd5e1" stroke-width="1.4"/><circle cx="21" cy="81" r="5.5" fill="#1e293b" stroke="' + ant + '" stroke-width="1.8"/></g><g class="h-arm-r"><rect x="74" y="51" width="10" height="28" rx="5" fill="#64748b" stroke="#cbd5e1" stroke-width="1.4"/><circle cx="79" cy="81" r="5.5" fill="#1e293b" stroke="' + ant + '" stroke-width="1.8"/></g><rect x="29" y="48" width="42" height="40" rx="10" fill="#1e293b" stroke="' + ant + '" stroke-width="2.4"/><rect x="39" y="56" width="22" height="19" rx="5" fill="#0f172a" stroke="' + core + '" stroke-width="1.8"/><circle class="h-core" cx="50" cy="65.5" r="5.5" fill="' + core + '"/><rect x="44" y="43" width="12" height="6" rx="2" fill="#64748b"/><line x1="50" y1="4" x2="50" y2="14" stroke="' + ant + '" stroke-width="2.8"/><circle cx="50" cy="4" r="3.8" fill="' + ant + '"/><rect x="29" y="13" width="42" height="33" rx="11" fill="#1e293b" stroke="' + ant + '" stroke-width="2.4"/><rect x="34" y="19" width="32" height="23" rx="6" fill="#0f172a"/>' + eyes + mouth + '</svg>';
}
function playTheaterWalk(mood, bannerHtml) {
    var theater = el("stageTheater"), walker = el("theaterWalker"), banner = el("theaterBanner");
    walker.innerHTML = humanoidBotSvg(mood, 112, 146); banner.innerHTML = bannerHtml; banner.className = "banner-panel"; theater.classList.remove("hidden");
    if (game.reduce) { walker.className = "humanoid-walker at-center arrived"; banner.classList.add("show"); return; }
    walker.className = "humanoid-walker walking";
    requestAnimationFrame(function () { requestAnimationFrame(function () { walker.className = "humanoid-walker walking at-center"; }); });
    setTimeout(function () { walker.className = "humanoid-walker at-center arrived"; banner.classList.add("show"); beep(600, 70); }, 1450);
}
function closeTheater() { el("stageTheater").classList.add("hidden"); }
function buildDonutSvg(slices, centerBig, centerSub) {
    var total = 0; for (var i = 0; i < slices.length; i++)total += slices[i].value;
    var r = 56, cx = 75, cy = 75, circ = 2 * Math.PI * r, body = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#e2e8f0" stroke-width="20"/>';
    if (total > 0) {
        var offset = 0;
        for (var j = 0; j < slices.length; j++) {
            var sl = slices[j]; if (sl.value <= 0) continue; var len = (sl.value / total) * circ;
            body += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + sl.color + '" stroke-width="20" stroke-dasharray="' + len.toFixed(2) + ' ' + circ.toFixed(2) + '" stroke-dashoffset="-' + offset.toFixed(2) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
            offset += len;
        }
    }
    return '<svg viewBox="0 0 150 150" width="150" height="150">' + body + '<text x="75" y="73" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="22" font-weight="900" fill="#1c2b3a">' + centerBig + '</text><text x="75" y="90" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="9.5" font-weight="700" fill="#6b7f92">' + centerSub + '</text></svg>';
}
function briefInnerHtml(i, isFirst) {
    var st = STAGES[i], extra = "";
    if (i === 2) extra = "<div class='brief-item'><b>SILICON DESIGN CHOICE (RISC vs CISC)</b><div class='arch-grid' style='margin-top:4px;'><button class='arch-opt" + (game.archChoices.isa === "risc" ? " on" : "") + "' onclick=\"setArchChoice('isa','risc');el('theaterBanner').innerHTML=briefInnerHtml(2," + (!!isFirst) + ")\"><b>RISC (Fixed 32b)</b><small>Simple fast decode (+15% Pipe/Dec CP/s)</small></button><button class='arch-opt" + (game.archChoices.isa === "cisc" ? " on" : "") + "' onclick=\"setArchChoice('isa','cisc');el('theaterBanner').innerHTML=briefInnerHtml(2," + (!!isFirst) + ")\"><b>CISC (Variable)</b><small>Compact code (0.85× IC, +25% Dec CP/s)</small></button></div></div>";
    else if (i === 4) extra = "<div class='brief-item'><b>SILICON DIE ALLOCATION (CPU vs GPU/NPU)</b><div class='arch-grid' style='margin-top:4px;'><button class='arch-opt" + (game.archChoices.accel === "cpu" ? " on" : "") + "' onclick=\"setArchChoice('accel','cpu');el('theaterBanner').innerHTML=briefInnerHtml(4," + (!!isFirst) + ")\"><b>CPU Latency Focus</b><small>Best for branchy OS &amp; serial code</small></button><button class='arch-opt" + (game.archChoices.accel === "gpu" ? " on" : "") + "' onclick=\"setArchChoice('accel','gpu');el('theaterBanner').innerHTML=briefInnerHtml(4," + (!!isFirst) + ")\"><b>GPU / NPU Vector Lanes</b><small>3.2× parallel compute throughput</small></button></div></div>";
    return "<div class='banner-head'><div><div class='tag'>" + (isFirst ? "NEW STAGE UNLOCKED · " : "") + "STAGE " + (i + 1) + " BRIEFING</div><h2>STAGE " + (i + 1) + ": " + st.name.toUpperCase() + "</h2></div><button class='ghost' style='background:#1e293b;color:#cbd5e1;border-color:#475569;' onclick='closeTheater()'>✕</button></div><div class='banner-body'><div class='stage-speech'>🤖 <b>ChipBot:</b> \"Welcome to <b>Stage " + (i + 1) + ": " + st.name + "</b>! Let's inspect what you'll mount onto silicon.\"</div><div class='brief-grid'><div class='brief-item'><b>WHAT THIS STAGE IS</b>" + st.what + "</div><div class='brief-item'><b>YOUR MISSION GOAL</b>" + st.goal + "</div><div class='brief-item'><b>LEARNING OUTCOME</b>" + st.outcome + "</div>" + extra + "</div><button class='bigbtn' style='width:100%' onclick='closeTheater()'>Let's Build! ▶</button></div>";
}
function openBrief(i, isFirst) { playTheaterWalk("happy", briefInnerHtml(i, isFirst)); BOT.say("Briefing Stage " + (i + 1) + ": " + STAGES[i].goal, "happy", ""); }

function openStageDebrief(stageIdx) {
    var st = STAGES[stageIdx], obj = game.objStats[stageIdx] || { hits: 0, misses: 0 }, stConfs = (game.stageConfusions && game.stageConfusions[stageIdx]) || {}, confEntries = [];
    for (var ck in stConfs) if (stConfs[ck] > 0 && CONFUSIONS[ck]) confEntries.push({ key: ck, count: stConfs[ck], info: CONFUSIONS[ck] });
    confEntries.sort(function (a, b) { return b.count - a.count; });
    var totalConfHits = 0; for (var c = 0; c < confEntries.length; c++)totalConfHits += confEntries[c].count;
    var cleanHits = Math.max(1, obj.hits), missRem = Math.max(0, obj.misses - totalConfHits), totalEv = obj.hits + obj.misses, masteryPct = totalEv > 0 ? Math.round((obj.hits / totalEv) * 100) : 100;
    var sliceCols = ["#ef4444", "#f59e0b", "#f97316", "#ec4899"], slices = [{ label: "Mastered Hits", value: cleanHits, color: "#10b981" }];
    for (var k = 0; k < Math.min(3, confEntries.length); k++)slices.push({ label: confEntries[k].info.title, value: confEntries[k].count, color: sliceCols[k] });
    if (missRem > 0) slices.push({ label: "Timing / Other Slips", value: missRem, color: "#94a3b8" });
    var legendHtml = slices.map(function (sl) { return "<div class='donut-leg-row'><span><span class='donut-dot' style='background:" + sl.color + "'></span>" + sl.label + "</span><b class='mono'>" + sl.value + "</b></div>"; }).join("");
    var rightHtml = "";
    if (confEntries.length > 0) {
        rightHtml = "<div class='conf-stack'>";
        for (var m = 0; m < Math.min(3, confEntries.length); m++) {
            var ce = confEntries[m];
            rightHtml += "<div class='conf-banner-card'><h4>⚠️ Weak Spot #" + (m + 1) + ": " + ce.info.title + " <span class='mono' style='font-size:11px'>(" + ce.count + "×)</span></h4><div class='cmp-grid' style='margin-top:4px;margin-bottom:6px;'><div class='cmp-box'><b>" + ce.info.a[0] + "</b>" + ce.info.a[1] + "</div><div class='cmp-box'><b>" + ce.info.b[0] + "</b>" + ce.info.b[1] + "</div></div><div style='font-size:12px;color:#78350f;'>💡 <b>Rule of thumb:</b> " + ce.info.hint2 + "</div></div>";
        }
        rightHtml += "</div>";
    } else {
        rightHtml = "<div class='part' style='background:#ecfdf5;border-color:#6ee7b7;'><h4 style='margin:0 0 6px;color:#065f46;'>✨ Zero Confusions Recorded!</h4><div style='font-size:13px;color:#065f46;line-height:1.45;'>Clean silicon execution across <b>" + st.name + "</b>! You demonstrated: " + st.outcome + "</div></div>";
    }
    var isLast = (stageIdx === 4 && allStagesPassed());
    var ctaHtml = isLast ? "<button class='bigbtn' style='width:100%;margin-top:14px;' onclick='closeDebriefBanner(true)'>🏆 View 5-Stage CPU Evolution &amp; Feedback →</button>" : "<button class='bigbtn' style='width:100%;margin-top:14px;' onclick='closeDebriefBanner(false," + (stageIdx + 1) + ")'>Continue to Stage " + (stageIdx + 2) + " ▶</button>";
    var bannerHtml = "<div class='banner-head'><div><div class='tag'>STAGE " + (stageIdx + 1) + " COMPLETE · DIAGNOSTIC BANNER</div><h2>" + st.model.toUpperCase() + " UNLOCKED</h2></div><button class='ghost' style='background:#1e293b;color:#cbd5e1;border-color:#475569;' onclick='closeTheater()'>✕</button></div><div class='banner-body'><div class='stage-speech'>🤖 <b>ChipBot:</b> \"<b>" + st.model + "</b> is online! " + (confEntries.length > 0 ? "Before you move on, check the red/amber slices where your silicon stalled:" : "Flawless accuracy! Your processor is ready for the next architectural leap.") + "\"</div><div class='debrief-cols'><div class='donut-card'><div class='label' style='margin-bottom:6px;'>STAGE " + (stageIdx + 1) + " MASTERY</div>" + buildDonutSvg(slices, masteryPct + "%", "ACCURACY") + "<div class='donut-legend'>" + legendHtml + "</div></div>" + rightHtml + "</div>" + ctaHtml + "</div>";
    playTheaterWalk(confEntries.length > 0 ? "happy" : "party", bannerHtml);
}
function closeDebriefBanner(goFinale, nextIdx) {
    closeTheater();
    if (goFinale) { openEvolution(false); return; }
    if (nextIdx !== undefined && game.stages[nextIdx] === "open" && !game.seenStages[nextIdx]) openHub(nextIdx);
}
