// games/l2.js: Memory Sorter (no emoji/heat-label spoilers)
// ---------------------------------------------------------
GAMES.l2 = {
    icon: "🗄️",
    title: "MEMORY SORTER",
    time: 45,
    stars: [80, 170, 260],
    badPenalty: 8,
    menuIntro: true,
    about: "Memory is a ladder from tiny-and-fast to huge-and-slow. Each card is a workload. Place it by size and how often it is used: hot data stays close, cold archives can live farther away. Keys 1-5 pick the tier.",
    rule: "",
    introKeyTitle: "MEMORY TIERS",
    introKey: ""
        + accCard("1️⃣", "REG", "Tiny · fastest", "1",
            keyDef("Size", "Bytes")
            + keyDef("Speed", "Under 1 ns")
            + keyDef("Use", "Active counters and ALU operands"))
        + accCard("2️⃣", "L1", "Small · very fast", "2",
            keyDef("Size", "Kilobytes")
            + keyDef("Speed", "About 1 ns")
            + keyDef("Use", "Tight loops and hot instructions"))
        + accCard("3️⃣", "L2", "Medium · still fast", "3",
            keyDef("Size", "Hundreds of KB to MB")
            + keyDef("Speed", "About 4 ns")
            + keyDef("Use", "Working sets that miss L1"))
        + accCard("4️⃣", "RAM", "Large · slower", "4",
            keyDef("Size", "Gigabytes")
            + keyDef("Speed", "About 60 ns")
            + keyDef("Use", "Active programs and game worlds"))
        + accCard("5️⃣", "SSD", "Huge · slowest", "5",
            keyDef("Size", "Terabytes")
            + keyDef("Speed", "About 100 µs")
            + keyDef("Use", "Cold files and backups")),
    keyTitle: "QUICK REFERENCE",
    key: "<div class='key-cols cols-5'>" +
        "<div class='key-col'><span class='key-num'>1</span><b>REG</b><small>Tiny</small><div class='key-ex'>Fastest</div></div>" +
        "<div class='key-col'><span class='key-num'>2</span><b>L1</b><small>Small</small><div class='key-ex'>Very fast</div></div>" +
        "<div class='key-col'><span class='key-num'>3</span><b>L2</b><small>Medium</small><div class='key-ex'>Still fast</div></div>" +
        "<div class='key-col'><span class='key-num'>4</span><b>RAM</b><small>Large</small><div class='key-ex'>Slower</div></div>" +
        "<div class='key-col'><span class='key-num'>5</span><b>SSD</b><small>Huge</small><div class='key-ex'>Slowest</div></div>" +
        "</div>",
    start: function (g, arena) {
        var places = [
            ["REG", "Bytes · <1 ns"],
            ["L1", "KB · ~1 ns"],
            ["L2", "Hundreds KB–MB · ~4 ns"],
            ["RAM", "GB · ~60 ns"],
            ["SSD", "TB · ~100 µs"]
        ];
        var items = [
            ["loop counter i", "8 bytes · read/written every cycle", 0],
            ["running sum acc", "8 bytes · active ALU operand", 0],
            ["stack pointer SP", "8 bytes · updated every call", 0],
            ["12 KB tight inner-loop array", "12 KB · reused 1000×/sec", 1],
            ["16 KB hot instruction loop", "16 KB · fetched continuously", 1],
            ["256 KB sprite atlas", "256 KB · misses L1, reused often", 2],
            ["512 KB audio mix buffer", "512 KB · shared frame buffer", 2],
            ["1 MB lookup index", "1 MB · warm working table", 2],
            ["4 GB open browser tabs", "4 GB · active running programs", 3],
            ["8 GB loaded game level", "8 GB · active world state", 3],
            ["60 GB 4K video archive", "60 GB · stored offline file", 4],
            ["200 GB OS backup image", "200 GB · rare cold read", 4]
        ];
        var patience = 4.8, cur = null, born = 0, card = mk(arena, "div", "", ""), bar = mk(arena, "div", "pbar", ""), fill = mk(bar, "div", "pfill", ""), list = mk(arena, "div", "places", "");
        for (var i = 0; i < 5; i++)(function (n) {
            mk(list, "button", "place", "<span>" + (n + 1) + " · " + places[n][0] + "</span><small>" + places[n][1] + "</small>").onclick = function () { pick(n); };
        })(i);
        function next() {
            cur = items[rand(0, items.length - 1)];
            card.innerHTML = "<div class='sortcard'>" + cur[0] + "<br><span class='pill'>" + cur[1] + "</span></div>";
            born = Date.now();
        }
        function pick(n) {
            if (!cur) return;
            if (n == cur[2]) {
                g.good(14, "", "l2_tier");
                patience = Math.max(2.7, patience - 0.08);
            } else g.bad(cur[0] + " → " + places[cur[2]][0], "l2_tier");
            next();
        }
        g.every(50, function () {
            var t = (Date.now() - born) / 1000;
            fill.style.width = Math.max(0, 100 - t / patience * 100) + "%";
            if (t >= patience) { g.bad("Too slow!", "l2_tier"); next(); }
        });
        g.onKey = function (k) { if (k >= "1" && k <= "5") { pick(Number(k) - 1); return true; } return false; };
        next();
    }
};
