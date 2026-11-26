// games/l2.js: Memory Sorter (no emoji/heat-label spoilers)
// ---------------------------------------------------------
GAMES.l2 = {
    icon: "🗄️",
    title: "MEMORY SORTER",
    time: 45,
    stars: [80, 170, 260],
    badPenalty: 8,
    menuIntro: true,
    menuIntroFit: true,
    about: "Our simulated PC: REG 256 B, L1 64 KB, L2 4 MB, RAM 16 GB, SSD 1 TB. Match each workload to a tier by size and how often it is used (keys 1–5). Real machines can keep copies in several levels; hardware manages caches. Learn speed vs capacity, not a permanent home for data.",
    rule: "",
    introKeyTitle: "MEMORY TIERS",
    introKey: "<div class='msort-tiers'>"
        + "<div class='msort-tier'><span class='msort-n'>1</span><div><b>REG</b> · 256 B · &lt;1 ns<small>Active counters &amp; ALU operands</small></div></div>"
        + "<div class='msort-tier'><span class='msort-n'>2</span><div><b>L1</b> · 64 KB · ~1 ns<small>Tight loops &amp; hot instructions</small></div></div>"
        + "<div class='msort-tier'><span class='msort-n'>3</span><div><b>L2</b> · 4 MB · ~4 ns<small>Working sets too big for L1</small></div></div>"
        + "<div class='msort-tier'><span class='msort-n'>4</span><div><b>RAM</b> · 16 GB · ~60 ns<small>Active programs &amp; live worlds</small></div></div>"
        + "<div class='msort-tier'><span class='msort-n'>5</span><div><b>SSD</b> · 1 TB · ~100 µs<small>Cold files &amp; backups</small></div></div>"
        + "</div>",
    keyTitle: "QUICK REFERENCE",
    key: "<div class='key-cols cols-5'>" +
        "<div class='key-col'><span class='key-num'>1</span><b>REG</b><small>256 B</small><div class='key-ex'>Fastest</div></div>" +
        "<div class='key-col'><span class='key-num'>2</span><b>L1</b><small>64 KB</small><div class='key-ex'>Very fast</div></div>" +
        "<div class='key-col'><span class='key-num'>3</span><b>L2</b><small>4 MB</small><div class='key-ex'>Still fast</div></div>" +
        "<div class='key-col'><span class='key-num'>4</span><b>RAM</b><small>16 GB</small><div class='key-ex'>Slower</div></div>" +
        "<div class='key-col'><span class='key-num'>5</span><b>SSD</b><small>1 TB</small><div class='key-ex'>Slowest</div></div>" +
        "</div>",
    start: function (g, arena) {
        // Capacities below are the specs of our simulated computer
        var places = [
            ["REG", "256 B · <1 ns"],
            ["L1", "64 KB · ~1 ns"],
            ["L2", "4 MB · ~4 ns"],
            ["RAM", "16 GB · ~60 ns"],
            ["SSD", "1 TB · ~100 µs"]
        ];
        // [title, subtitle, correctTierIndex, why]
        var items = [
            ["loop counter i", "8 B · read/written every cycle", 0, "Only a few bytes and used every cycle, so Registers (256 B) are the right fit."],
            ["running sum acc", "8 B · active ALU operand", 0, "An 8 B value the ALU needs constantly belongs in Registers (256 B)."],
            ["stack pointer SP", "8 B · updated every call", 0, "A tiny pointer touched on every call stays in Registers (256 B)."],
            ["12 KB tight inner-loop array", "12 KB · reused many times per second", 1, "12 KB fits in L1 (64 KB) and is reused heavily, so L1 keeps it close."],
            ["16 KB hot instruction loop", "16 KB · fetched continuously", 1, "16 KB of often-fetched code fits in L1 (64 KB), so L1 is the best match."],
            ["256 KB sprite atlas", "256 KB · misses L1, reused often", 2, "256 KB is larger than L1 (64 KB) but fits in L2 (4 MB), and it is reused often."],
            ["512 KB audio mix buffer", "512 KB · shared frame buffer", 2, "512 KB will not fit in L1 (64 KB), but L2 (4 MB) can hold this often-used buffer."],
            ["1 MB lookup index", "1 MB · often reused, too big for L1", 2, "1 MB is far above L1 (64 KB) yet well under L2 (4 MB), so L2 is the right tier."],
            ["4 GB open browser tabs", "4 GB · active running programs", 3, "4 GB of live programs needs RAM (16 GB), not the much smaller caches."],
            ["8 GB loaded game level", "8 GB · active world state", 3, "An 8 GB live world fits in RAM (16 GB) and is too large for L2 (4 MB)."],
            ["60 GB 4K video archive", "60 GB · stored offline file", 4, "60 GB exceeds RAM (16 GB) and is rarely needed, so SSD (1 TB) is appropriate."],
            ["200 GB OS backup image", "200 GB · rare cold read", 4, "A 200 GB backup is cold storage: too big for RAM (16 GB) and a natural SSD (1 TB) fit."]
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
                g.good(14, cur[3], "l2_tier");
                patience = Math.max(2.7, patience - 0.08);
            } else g.bad(places[cur[2]][0] + ": " + cur[3], "l2_tier");
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
