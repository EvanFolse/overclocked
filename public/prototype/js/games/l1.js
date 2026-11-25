// games/l1.js: 2-Way / 3-Way Set-Associative Cache (Address Index + True Trace LRU, no spoilers)
// ---------------------------------------------------------
GAMES.l1 = {
    icon: "⚡",
    title: "CACHE KEEPER",
    time: 55,
    stars: [55, 115, 175],
    badPenalty: 8,
    menuIntro: true,
    about: "L1 cache is a tiny, ultra-fast desk beside the core. Each hex address is a memory request. If that block is already cached it's a hit; on a miss, place it in the right set using empty space first, then the least recently used block.",
    rule: "",
    introKeyTitle: "CACHE RULES",
    introKey: ""
        + accCard("✅", "Hit", "Already in the set", "",
            keyDef("Meaning", "The address is already stored in that set")
            + keyDef("Do", "Confirm the hit. No eviction needed"))
        + accCard("❌", "Miss", "Must bring it in", "",
            keyDef("Meaning", "That address is not in the set yet")
            + keyDef("Do", "Click an empty way, or the oldest (least recently used) way if full"))
        + accCard("🗂️", "Set", "Which shelf to use", "",
            keyDef("Rule", "Set = address mod 2")
            + keyDef("Even", "Goes to Set 0")
            + keyDef("Odd", "Goes to Set 1")),
    keyTitle: "QUICK REFERENCE",
    key: "<div class='key-cols'>" +
        "<div class='key-col'><span class='key-num'>Result</span><b>HIT</b><small>Already there</small><div class='key-ex'>Data found<br>in that set</div></div>" +
        "<div class='key-col'><span class='key-num'>Result</span><b>MISS</b><small>Must load in</small><div class='key-ex'>Empty way first<br>else oldest least recently used</div></div>" +
        "<div class='key-col'><span class='key-num'>Index</span><b>SET</b><small>Addr mod 2</small><div class='key-ex'>Even → Set 0<br>Odd → Set 1</div></div>" +
        "</div>",
    start: function (g, arena) {
        var ways = (lvl("l1") >= 3) ? 3 : 2;
        var addrs = [0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9];
        var sets = [[], []], trace = [], tick = 0, waiting = false, busy = false, req = 0, missAt = 0, resolved = 0, hits = 0, misses = 0;
        for (var s = 0; s < 2; s++) for (var w = 0; w < ways; w++) sets[s].push({ addr: null, lastUsed: 0 });
        // Pre-warm Set 0 & Set 1 with initial addresses
        sets[0][0] = { addr: 0x2, lastUsed: 1 }; sets[0][1] = { addr: 0x4, lastUsed: 2 };
        sets[1][0] = { addr: 0x1, lastUsed: 1 }; sets[1][1] = { addr: 0x3, lastUsed: 3 };
        trace = [0x2, 0x1, 0x4, 0x3]; tick = 4;

        var asked = mk(arena, "div", "asked", "");
        var traceEl = mk(arena, "div", "mono", "");
        traceEl.style.cssText = "font-size:11px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:5px 10px;width:100%;text-align:center;flex:0 0 auto;";
        var msg = mk(arena, "div", "cmsg", "");
        var setsWrap = mk(arena, "div", "", "");
        setsWrap.style.cssText = "display:flex;flex-direction:column;gap:10px;width:100%;flex:1 1 auto;min-height:0;";

        function hex(a) { return "0x" + a.toString(16).toUpperCase(); }
        function setOf(a) { return a & 1; }
        function setMsg(html, kind) {
            msg.className = "cmsg" + (kind ? " " + kind : "");
            msg.innerHTML = html || "";
        }
        // First 5 outcomes stay spacious; after that ~12% faster so the round still builds pace
        function pace(ms) { return Math.round(ms * (resolved > 5 ? 0.88 : 1)); }
        function scheduleAsk(baseMs) {
            busy = true;
            g.after(pace(baseMs), function () {
                busy = false;
                setMsg("", "");
                ask();
            });
        }
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
            if (waiting || busy) return;
            var hotPool = [0x1, 0x2, 0x3, 0x4, 0x5, 0x6];
            req = (Math.random() < 0.72) ? hotPool[rand(0, hotPool.length - 1)] : addrs[rand(0, addrs.length - 1)];
            var sIdx = setOf(req);
            asked.innerHTML = "CPU requests: <b>" + hex(req) + "</b>";
            var found = -1;
            for (var w = 0; w < ways; w++) if (sets[sIdx][w].addr === req) found = w;
            if (found !== -1) {
                hits++; tick++; resolved++;
                sets[sIdx][found].lastUsed = tick;
                trace.push(req);
                // Score/pop only — in-flow banner carries the hit text so it does not cover the request
                g.good(12, "", "l1_lru");
                setMsg("<b>HIT!</b> " + hex(req) + " already in Set " + sIdx + " Way " + found, "hit");
                render();
                scheduleAsk(2100);
            } else {
                misses++; waiting = true; missAt = Date.now();
                setMsg("<b>MISS!</b> Place " + hex(req) + " into the right Set (empty or least recently used way)!", "miss");
                render();
            }
        }
        function pickSlot(sIdx, wIdx, forced) {
            if (!waiting || busy) return;
            var needSet = setOf(req);
            if (!forced && sIdx !== needSet) {
                g.bad("Wrong Set! " + hex(req) + " mod 2 = Set " + needSet, "l1_lru");
                setMsg("<b>Wrong Set!</b> " + hex(req) + " belongs in Set " + needSet, "miss");
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
                setMsg("<b>TIME!</b> Auto-placed into Set " + needSet, "warn");
            } else if (wIdx === bestIdx || targetSet[wIdx].lastUsed === targetSet[bestIdx].lastUsed) {
                g.good(14, "", "l1_lru");
                setMsg("<b>PLACED!</b> " + hex(req) + " → Set " + needSet + " (least recently used / empty way)", "ok");
            } else {
                g.bad("Not the least recently used in Set " + needSet + "! Check Recent Trace.", "l1_lru");
                setMsg("<b>Wrong way.</b> Needed empty or least recently used in Set " + needSet, "miss");
            }
            tick++;
            resolved++;
            targetSet[wIdx] = { addr: req, lastUsed: tick };
            trace.push(req);
            waiting = false;
            render();
            scheduleAsk(2100);
        }
        g.every(100, function () { if (waiting && !busy && Date.now() - missAt > pace(6000)) pickSlot(setOf(req), 0, true); });
        render();
        setMsg("Waiting for the first CPU request…", "");
        g.after(900, ask);
    }
};
