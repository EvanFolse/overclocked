// games/l2.js: one minigame = GAMES.l2
// ---------------------------------------------------------
GAMES.l2 = {
    icon: "🗄️", title: "MEMORY SORTER", time: 45, stars: [70, 150, 240], badPenalty: 8, rule: "Match each workload to the best memory tier using <b>access frequency</b> &amp; <b>data size</b>!<br>Keys 1 to 5.", takeaway: "The Memory Hierarchy trades capacity for speed: tiny &amp; hot stays in Registers/L1; huge &amp; cold lives in RAM/SSD.",
    start: function (g, arena) {
        var places = [["REG", "Bytes · <1 ns"], ["L1", "~32 KB · ~1 ns"], ["L2", "~512 KB · ~4 ns"], ["RAM", "~16 GB · ~60 ns"], ["SSD", "~1 TB · ~100 us"]];
        var items = [["Tight loop index i", "Read/written every single clock cycle (8 bytes)", 0], ["Running sum accumulator", "Modified by every ADD instruction", 0], ["Active 8 KB inner-loop array", "Hot spatial locality inside core", 1], ["Current function stack top", "Repeatedly accessed tiny working set", 1], ["Shared 256 KB sprite sheet", "Too big for L1, still needed soon", 2], ["Audio buffer between cores", "Medium size, low latency backup", 2], ["30 open browser tabs (4 GB)", "Active working apps, exceeds MB caches", 3], ["Loaded 2 GB game world state", "Needs gigabytes while program runs", 3], ["Last year's 4K video archive", "Massive cold files, survives power off", 4], ["50 GB OS installer backup", "Rarely accessed long-term storage", 4]];
        var patience = 5.5, cur = null, born = 0, card = mk(arena, "div", "", ""), bar = mk(arena, "div", "pbar", ""), fill = mk(bar, "div", "pfill", ""), list = mk(arena, "div", "places", "");
        for (var i = 0; i < 5; i++)(function (n) { mk(list, "button", "place", "<span>" + (n + 1) + " · " + places[n][0] + "</span><small>" + places[n][1] + "</small>").onclick = function () { pick(n); }; })(i);
        function next() { cur = items[rand(0, items.length - 1)]; card.innerHTML = "<div class='sortcard'>" + cur[0] + "<small>" + cur[1] + "</small></div>"; born = Date.now(); }
        function pick(n) { if (!cur) return; if (n == cur[2]) { g.good(12, "", "l2_tier"); patience = Math.max(3.0, patience - 0.08); } else g.bad(cur[0] + " -> " + places[cur[2]][0] + " (" + places[cur[2]][1] + ")", "l2_tier"); next(); }
        g.every(50, function () { var t = (Date.now() - born) / 1000; fill.style.width = Math.max(0, 100 - t / patience * 100) + "%"; if (t >= patience) { g.bad("Too slow!", "l2_tier"); next(); } });
        g.onKey = function (k) { if (k >= "1" && k <= "5") { pick(Number(k) - 1); return true; } return false; }; next();
    }
};
