// golden.js: Golden Chip challenge and Overclock Frenzy
// ---------------------------------------------------------
function activateFrenzy(mult, seconds) {
    frenzyMult = mult; frenzyUntil = Date.now() + seconds * 1000; applyMotion(); renderHud();
    BOT.say("🔥 <b>" + mult + "× OVERCLOCK FRENZY!</b> All chip traces supercharged for " + seconds + "s!", "party", "good");
}
function updateFrenzyUi() {
    var rem = frenzyUntil - Date.now(), b = el("frenzyBanner");
    if (rem > 0) { if (!document.body.classList.contains("frenzy-on")) applyMotion(); b.classList.remove("hidden"); b.textContent = "🔥 " + frenzyMult + "× OVERCLOCK FRENZY · " + (rem / 1000).toFixed(1) + "s"; }
    else { if (document.body.classList.contains("frenzy-on")) { frenzyMult = 1; applyMotion(); renderHud(); } b.classList.add("hidden"); }
}
function modalsBusy() {
    var ids = ["welcomeScreen", "evolutionScreen", "stageTheater", "benchModal", "feedbackModal"];
    for (var i = 0; i < ids.length; i++)if (!el(ids[i]).classList.contains("hidden")) return true;
    return !!G || !!activeFault || !!activeGoldenRescue;
}
function spawnGoldenChip() {
    if (goldenActive || modalsBusy() || installedCount() < 2) return;
    goldenActive = true;
    el("goldenLayer").innerHTML = "<button id='goldenBtn' class='golden-chip-btn' onclick='startGoldenRescue()'><span class='golden-spin'>🪙</span><span>✨ GOLDEN CHIP!</span><span id='goldCd'>10s</span></button>";
    beep(660, 90);
    var left = 10; clearInterval(goldenTimer);
    goldenTimer = setInterval(function () {
        left--; var cd = el("goldCd"); if (cd) cd.textContent = left + "s";
        if (left <= 0 || !goldenActive) { clearInterval(goldenTimer); goldenActive = false; if (el("goldenLayer")) el("goldenLayer").innerHTML = ""; }
    }, 1000);
}
function startGoldenRescue() {
    clearInterval(goldenTimer); goldenActive = false; el("goldenLayer").innerHTML = "";
    var pool = GOLDEN_RESCUES.filter(function (r) { return game.parts[r.key] && game.parts[r.key].on; });
    if (pool.length === 0) return;
    var topC = topConfusionKey(), pick = pool[rand(0, pool.length - 1)];
    for (var i = 0; i < pool.length; i++)if (pool[i].cKey === topC) { pick = pool[i]; break; }
    activeGoldenRescue = { key: pick.key, badge: pick.badge, clue: pick.clue, cKey: pick.cKey, attempt: 1, left: 10 };
    BOT.say("🪙 <b>Golden Rescue!</b> Click the right 3D part on the chip!", "party", "good");
    refreshDiagUi();
    clearInterval(rescueTimer);
    rescueTimer = setInterval(function () {
        if (!activeGoldenRescue) { clearInterval(rescueTimer); return; }
        activeGoldenRescue.left--;
        var cd = el("rescueCd"); if (cd) cd.textContent = activeGoldenRescue.left + "s";
        if (activeGoldenRescue.left <= 0) { cancelGoldenRescue(true); }
    }, 1000);
}
function cancelGoldenRescue(timedOut) {
    clearInterval(rescueTimer); activeGoldenRescue = null; refreshDiagUi();
    if (timedOut) BOT.say("Golden rescue timed out—catch the next one!", "idle", "");
}
function handleGoldenPartClick(clickedKey) {
    var q = activeGoldenRescue; if (!q) return;
    var baseReward = Math.max(250, Math.round((totalCps() / currentFrenzyMult()) * 120));
    if (clickedKey === q.key) {
        var isFirst = (q.attempt === 1), payout = isFirst ? baseReward : Math.round(baseReward * 0.5), mult = isFirst ? 3 : 2, secs = isFirst ? 18 : 12;
        gainCp(payout); if (q.cKey && game.confusions[q.cKey] > 0) game.confusions[q.cKey]--;
        game.objStats[PART[q.key].stage - 1].hits++;
        clearInterval(rescueTimer); activeGoldenRescue = null; setHot(clickedKey); refreshDiagUi();
        activateFrenzy(mult, secs);
        toast((isFirst ? "⚡ 1ST-SHOT RESCUE! +" : "✨ RESCUE! +") + fmt(payout) + " CP · " + mult + "× FRENZY!");
        beep(880, 150); save();
    } else {
        beep(180, 120);
        if (q.attempt === 1) {
            q.attempt = 2; q.left = Math.max(q.left, 7);
            toast("❌ Not " + PART[clickedKey].short + "! 1 more shot for 2× Frenzy!");
            BOT.miss(q.cKey, "Not " + PART[clickedKey].short + "—check the clue: " + q.clue);
            refreshDiagUi();
        } else {
            toast("❌ Out of shots! Answer was " + PART[q.key].short);
            setHot(q.key);
            cancelGoldenRescue(false);
        }
    }
}

// =========================================================================
// BENCHMARK + LIVE 16x16 PIXEL RENDER TEST + DESIGN CONTRACTS
// =========================================================================
