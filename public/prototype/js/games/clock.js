// games/clock.js: one minigame = GAMES.clock
// ---------------------------------------------------------
GAMES.clock = {
    icon: "⏱️", title: "CLOCK SYNC", time: 30, stars: [150, 400, 750], badPenalty: 10, rule: "Hit TICK (or press SPACE) inside the green setup window so CU, ALU, REG & MEM latch together on the rising clock edge!", takeaway: "The clock period must be long enough for the slowest critical-path unit to finish before the next tick.",
    start: function (g, arena) {
        var track = mk(arena, "div", "track", ""), zone = mk(track, "div", "zone", ""), W = track.clientWidth || 340, zoneX = W * 0.2; zone.style.left = (zoneX - 24) + "px";
        var row = mk(arena, "div", "partsrow", ""), chips = [], labels = ["CU", "ALU", "REG", "MEM"]; for (var i = 0; i < 4; i++)chips.push(mk(row, "span", "pchip", labels[i]));
        var btn = mk(arena, "button", "bigbtn", "TICK EDGE!"), notes = [], startAt = Date.now(), nextAt = startAt + 500; g.info("Setup window · sync all units");
        function spawn() { notes.push({ dot: mk(track, "div", "note", ""), t0: Date.now(), speed: W * (0.44 + (Date.now() - startAt) / 30000 * 0.28) }); }
        function posOf(n, now) { return W - (now - n.t0) / 1000 * n.speed; }
        function lightUp() { for (var k = 0; k < chips.length; k++)chips[k].classList.add("lit"); g.after(160, function () { for (var k = 0; k < chips.length; k++)chips[k].classList.remove("lit"); }); }
        function tap() {
            var now = Date.now(), best = -1, bestD = 9999; for (var k = 0; k < notes.length; k++) { var d = Math.abs(posOf(notes[k], now) - zoneX); if (d < bestD) { bestD = d; best = k; } }
            if (best == -1 || bestD > 46) { g.bad("Too early! Critical path not settled", "clock_edge"); return; }
            track.removeChild(notes[best].dot); notes.splice(best, 1);
            if (bestD <= 14) { g.good(15, "LOCKED IN SYNC!", "clock_edge"); lightUp(); } else if (bestD <= 31) { g.good(8, "Synced", "clock_edge"); lightUp(); } else g.bad("Setup time violation!", "clock_edge");
        }
        btn.onclick = tap; track.onclick = tap; g.onKey = function (k) { if (k == " " || k == "Enter") { tap(); return true; } return false; };
        g.every(16, function () { var now = Date.now(); if (now >= nextAt) { spawn(); nextAt = now + Math.max(440, 760 - (now - startAt) / 30000 * 320); } for (var k = notes.length - 1; k >= 0; k--) { var x = posOf(notes[k], now); notes[k].dot.style.left = (x - 18) + "px"; if (x < zoneX - 40) { track.removeChild(notes[k].dot); notes.splice(k, 1); g.bad("Missed clock edge!", "clock_edge"); } } });
    }
};
