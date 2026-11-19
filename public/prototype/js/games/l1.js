// games/l1.js: 2-Way / 3-Way Set-Associative Cache (Address Index + True Trace LRU, no spoilers)
// ---------------------------------------------------------
GAMES.l1 = {
    icon: "⚡",
    title: "CACHE KEEPER",
    time: 50,
    stars: [80, 170, 260],
    badPenalty: 8,
    rule: "Map each hex address to <b>Set = Addr mod 2</b> (Even→Set 0, Odd→Set 1). On a MISS, click the <b>empty</b> or <b>oldest-used</b> way in that Set!",
    start: function (g, arena) {
        var ways = (lvl("l1") >= 3) ? 3 : 2;
        var addrs = [0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9];
        var sets = [[], []], trace = [], tick = 0, waiting = false, req = 0, missAt = 0, count = 0, hits = 0, misses = 0;
        for (var s = 0; s < 2; s++) for (var w = 0; w < ways; w++) sets[s].push({ addr: null, lastUsed: 0 });
        // Pre-warm Set 0 & Set 1 with initial addresses
        sets[0][0] = { addr: 0x2, lastUsed: 1 }; sets[0][1] = { addr: 0x4, lastUsed: 2 };
        sets[1][0] = { addr: 0x1, lastUsed: 1 }; sets[1][1] = { addr: 0x3, lastUsed: 3 };
        trace = [0x2, 0x1, 0x4, 0x3]; tick = 4;

        var asked = mk(arena, "div", "asked", "");
        var traceEl = mk(arena, "div", "mono", "");
        traceEl.style.cssText = "font-size:11px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:5px 10px;width:100%;text-align:center;";
        var msg = mk(arena, "div", "cmsg", "");
        var setsWrap = mk(arena, "div", "", "");
        setsWrap.style.cssText = "display:flex;flex-direction:column;gap:8px;width:100%;";

        function hex(a) { return "0x" + a.toString(16).toUpperCase(); }
        function setOf(a) { return a & 1; }
        function render() {
            traceEl.innerHTML = "RECENT TRACE (old → new): " + trace.slice(-6).map(function (a) { return "<b>" + hex(a) + "</b>"; }).join(" · ");
            setsWrap.innerHTML = "";
            for (var si = 0; si < 2; si++) {
                var box = mk(setsWrap, "div", "", "");
                box.style.cssText = "background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:12px;padding:8px;";
                mk(box, "div", "glabel", "SET " + si + " (" + (si === 0 ? "Even addrs: 0x0,0x2,0x4..." : "Odd addrs: 0x1,0x3,0x5...") + ")");
                var row = mk(box, "div", "cslots", "");
                for (var wi = 0; wi < ways; wi++)(function (sIdx, wIdx) {
                    var sl = sets[sIdx][wIdx];
                    var btn = mk(row, "button", "cslot" + (waiting ? " pick" : ""), (sl.addr === null ? "—<small>empty</small>" : hex(sl.addr) + "<small>Way " + wIdx + "</small>"));
                    btn.style.fontSize = "19px";
                    btn.style.padding = "9px 4px";
                    btn.onclick = function () { pickSlot(sIdx, wIdx, false); };
                })(si, wi);
            }
            var tot = hits + misses, rate = tot ? Math.round((hits / tot) * 100) : 0;
            g.info("Ways: " + ways + " · Hits " + hits + " · Miss " + misses + " (" + rate + "%)");
        }
        function ask() {
            count++;
            var hotPool = [0x1, 0x2, 0x3, 0x4, 0x5, 0x6];
            req = (Math.random() < 0.72) ? hotPool[rand(0, hotPool.length - 1)] : addrs[rand(0, addrs.length - 1)];
            var sIdx = setOf(req);
            asked.innerHTML = "CPU requests: <b>" + hex(req) + "</b>";
            var found = -1;
            for (var w = 0; w < ways; w++) if (sets[sIdx][w].addr === req) found = w;
            if (found !== -1) {
                hits++; tick++;
                sets[sIdx][found].lastUsed = tick;
                trace.push(req);
                g.good(12, "HIT ⚡ Set " + sIdx + " Way " + found, "l1_lru");
                msg.innerHTML = "";
                render();
                g.after(Math.max(950, 1750 - count * 22), ask);
            } else {
                misses++; waiting = true; missAt = Date.now();
                msg.innerHTML = "<b style='color:#d24b4b'>MISS!</b> Place " + hex(req) + " into the right Set (empty or LRU way)!";
                render();
            }
        }
        function pickSlot(sIdx, wIdx, forced) {
            if (!waiting) return;
            var needSet = setOf(req);
            if (!forced && sIdx !== needSet) {
                g.bad("Wrong Set! " + hex(req) + " mod 2 = Set " + needSet, "l1_lru");
                return;
            }
            var targetSet = sets[needSet], emptyIdx = -1, lruIdx = 0;
            for (var w = 0; w < ways; w++) {
                if (targetSet[w].addr === null && emptyIdx === -1) emptyIdx = w;
                if (targetSet[w].lastUsed < targetSet[lruIdx].lastUsed) lruIdx = w;
            }
            var bestIdx = (emptyIdx !== -1) ? emptyIdx : lruIdx;
            if (forced) {
                g.bad("Too slow! Missed Set " + needSet + " deadline", "l1_lru");
                wIdx = bestIdx;
            } else if (wIdx === bestIdx || targetSet[wIdx].lastUsed === targetSet[bestIdx].lastUsed) {
                g.good(14, "Mapped Set " + needSet + " & evicted LRU!", "l1_lru");
            } else {
                g.bad("Not LRU in Set " + needSet + "! Check Recent Trace.", "l1_lru");
            }
            tick++;
            targetSet[wIdx] = { addr: req, lastUsed: tick };
            trace.push(req);
            waiting = false; msg.innerHTML = ""; render();
            g.after(850, ask);
        }
        g.every(100, function () { if (waiting && Date.now() - missAt > 4200) pickSlot(setOf(req), 0, true); });
        render();
        g.after(600, ask);
    }
};
