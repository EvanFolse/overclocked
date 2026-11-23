// games/clock.js: one minigame = GAMES.clock
// ---------------------------------------------------------
GAMES.clock = {
    icon: "⏱️", title: "CLOCK SYNC", time: 30, stars: [150, 400, 750], badPenalty: 10,
    about: "Learn the <b>clock</b>: the shared beat for CU, ALU, REG, and MEM. Each pulse is an <b>example clock edge</b>. Hit it only when signals have settled.",
    rule: "Hit TICK (or SPACE) inside the green setup ring to latch CU, ALU, REG & MEM together!",
    key: "<div class='key-cols'>" +
        "<div class='key-col'><span class='key-num'>Window</span><b>GREEN</b><small>Setup ready</small><div class='key-ex'>Safe to latch<br>CU ALU REG MEM</div></div>" +
        "<div class='key-col'><span class='key-num'>Action</span><b>TICK</b><small>Or press SPACE</small><div class='key-ex'>Clock edge<br>captures all</div></div>" +
        "<div class='key-col'><span class='key-num'>Miss</span><b>EARLY/LATE</b><small>Out of sync</small><div class='key-ex'>Signals not<br>settled yet</div></div>" +
        "</div>",
    start: function (g, arena) {
        var track = mk(arena, "div", "track", ""), zone = mk(track, "div", "zone", ""), W = track.clientWidth || 340, zoneX = W * 0.2; zone.style.left = (zoneX - 24) + "px";
        var row = mk(arena, "div", "partsrow", ""), chips = [], labels = ["CU", "ALU", "REG", "MEM"]; for (var i = 0; i < 4; i++)chips.push(mk(row, "span", "pchip", labels[i]));
        var btn = mk(arena, "button", "bigbtn", "TICK EDGE!"), notes = [], startAt = Date.now(), nextAt = startAt + 500; g.info("Hit inside green ring");
        function spawn() { notes.push({ dot: mk(track, "div", "note", ""), t0: Date.now(), speed: W * (0.44 + (Date.now() - startAt) / 30000 * 0.28) }); }
        function posOf(n, now) { return W - (now - n.t0) / 1000 * n.speed; }
        function lightUp() { for (var k = 0; k < chips.length; k++)chips[k].classList.add("lit"); g.after(160, function () { for (var k = 0; k < chips.length; k++)chips[k].classList.remove("lit"); }); }
        function tap() {
            var now = Date.now(), best = -1, bestD = 9999; for (var k = 0; k < notes.length; k++) { var d = Math.abs(posOf(notes[k], now) - zoneX); if (d < bestD) { bestD = d; best = k; } }
            if (best == -1 || bestD > 46) { g.bad("Too early!", "clock_edge"); return; }
            track.removeChild(notes[best].dot); notes.splice(best, 1);
            if (bestD <= 14) { g.good(15, "LOCKED IN SYNC!", "clock_edge"); lightUp(); } else if (bestD <= 31) { g.good(8, "Synced", "clock_edge"); lightUp(); } else g.bad("Setup time miss!", "clock_edge");
        }
        btn.onclick = tap; track.onclick = tap; g.onKey = function (k) { if (k == " " || k == "Enter") { tap(); return true; } return false; };
        g.every(16, function () { var now = Date.now(); if (now >= nextAt) { spawn(); nextAt = now + Math.max(440, 760 - (now - startAt) / 30000 * 320); } for (var k = notes.length - 1; k >= 0; k--) { var x = posOf(notes[k], now); notes[k].dot.style.left = (x - 18) + "px"; if (x < zoneX - 40) { track.removeChild(notes[k].dot); notes.splice(k, 1); g.bad("Missed clock edge!", "clock_edge"); } } });
    }
};
