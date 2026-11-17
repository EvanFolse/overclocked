// games/l2.js: one minigame = GAMES.l2
// ---------------------------------------------------------
GAMES.l2 = {
    icon: "🗄️", title: "MEMORY SORTER", time: 40, stars: [70, 150, 240], badPenalty: 8, rule: "Match each data card by <b>size</b> &amp; <b>heat</b> (Keys 1–5).",
    start: function (g, arena) {
        var places = [["REG", "Bytes · <1 ns"], ["L1", "~32 KB · ~1 ns"], ["L2", "~512 KB · ~4 ns"], ["RAM", "~16 GB · ~60 ns"], ["SSD", "~1 TB · ~100 µs"]];
        var items = [
            ["loop counter i", "8 B · ⚡ Every Cycle", 0],
            ["running sum x", "8 B · ⚡ Every Cycle", 0],
            ["8 KB active array", "8 KB · 🔥 Hot Loop", 1],
            ["function stack top", "16 KB · 🔥 Hot Loop", 1],
            ["256 KB sprite sheet", "256 KB · 🟡 Warm", 2],
            ["audio mix buffer", "512 KB · 🟡 Warm", 2],
            ["30 browser tabs", "4 GB · 🔵 Active App", 3],
            ["game level world", "8 GB · 🔵 Active App", 3],
            ["4K video archive", "50 GB · ❄️ Cold File", 4],
            ["OS backup image", "100 GB · ❄️ Cold File", 4]
        ];
        var patience = 4.6, cur = null, born = 0, card = mk(arena, "div", "", ""), bar = mk(arena, "div", "pbar", ""), fill = mk(bar, "div", "pfill", ""), list = mk(arena, "div", "places", "");
        for (var i = 0; i < 5; i++)(function (n) { mk(list, "button", "place", "<span>" + (n + 1) + " · " + places[n][0] + "</span><small>" + places[n][1] + "</small>").onclick = function () { pick(n); }; })(i);
        function next() { cur = items[rand(0, items.length - 1)]; card.innerHTML = "<div class='sortcard'>" + cur[0] + "<br><span class='pill'>" + cur[1] + "</span></div>"; born = Date.now(); }
        function pick(n) { if (!cur) return; if (n == cur[2]) { g.good(12, "", "l2_tier"); patience = Math.max(2.6, patience - 0.08); } else g.bad(cur[0] + " → " + places[cur[2]][0], "l2_tier"); next(); }
        g.every(50, function () { var t = (Date.now() - born) / 1000; fill.style.width = Math.max(0, 100 - t / patience * 100) + "%"; if (t >= patience) { g.bad("Too slow!", "l2_tier"); next(); } });
        g.onKey = function (k) { if (k >= "1" && k <= "5") { pick(Number(k) - 1); return true; } return false; }; next();
    }
};
