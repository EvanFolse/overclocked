// games/cores.js: Core Scheduler with live Amdahl Speedup readout & core-level scaling
// ---------------------------------------------------------
GAMES.cores = {
    icon: "🧩",
    title: "CORE SCHEDULER",
    time: 35,
    stars: [90, 180, 270],
    badPenalty: 6,
    menuIntro: true,
    about: "Multi-core chips run independent work in parallel, but some tasks cannot be split. Dispatch image and math jobs to idle cores. A SERIAL job needs every core free, then blocks them all. That serial fraction caps speedup (Amdahl's Law).",
    rule: "",
    introKeyTitle: "WORKLOAD TYPES",
    introKey: ""
        + accCard("🖼️", "IMG", "Parallel image job", "",
            keyDef("Do", "Send it to any idle core")
            + keyDef("Why", "Independent work can run beside other jobs"))
        + accCard("🧮", "MAT / VEC / RAY", "Parallel math jobs", "",
            keyDef("Do", "Dispatch to any idle core")
            + keyDef("Why", "Same idea: split across free cores"))
        + accCard("🔒", "SERIAL", "Cannot be split", "",
            keyDef("Need", "All cores must be idle first")
            + keyDef("Effect", "Then it occupies every core")
            + keyDef("Amdahl", "More serial time lowers max speedup")),
    keyTitle: "QUICK REFERENCE",
    key: "<div class='key-cols'>" +
        "<div class='key-col'><span class='key-num'>Parallel</span><b>IMG</b><small>Image job</small><div class='key-ex'>Any idle<br>core</div></div>" +
        "<div class='key-col'><span class='key-num'>Parallel</span><b>MAT / VEC</b><small>Math jobs</small><div class='key-ex'>Any idle<br>core</div></div>" +
        "<div class='key-col'><span class='key-num'>Amdahl</span><b>SERIAL</b><small>Cannot split</small><div class='key-ex'>All cores free<br>then blocks all</div></div>" +
        "</div>",
    start: function (g, arena) {
        var coreCount = (lvl("cores") >= 2) ? 4 : 3;
        var cores = [], queue = [], serialUntil = 0, parLabels = ["IMG", "MAT", "VEC", "RAY"], parTime = 0, serTime = 0;
        for (var i = 0; i < coreCount; i++) cores.push({ until: 0, serial: false });
        mk(arena, "div", "glabel", "WORKLOAD QUEUE (next outlined)");
        var qEl = mk(arena, "div", "cq", "");
        var amdahlEl = mk(arena, "div", "mono", "");
        amdahlEl.style.cssText = "font-size:11px;color:#0369a1;background:#e0f2fe;border-radius:8px;padding:4px 10px;width:100%;text-align:center;";
        mk(arena, "div", "glabel", "CORES (" + coreCount + " active): tap one to dispatch");
        var lanesEl = mk(arena, "div", "lanes", ""), laneBtns = [], fills = [], texts = [];
        for (var n = 0; n < coreCount; n++)(function (idx) {
            var b = mk(lanesEl, "button", "lane idle", "<span class='cn'>CORE " + (idx + 1) + "</span> <span class='lt'>idle 💤</span>");
            fills.push(mk(mk(b, "div", "lbar", ""), "div", "lfill", ""));
            texts.push(b.querySelector(".lt")); laneBtns.push(b); b.onclick = function () { dispatch(idx); };
        })(n);
        function updateAmdahl() {
            var tot = parTime + serTime;
            var fSer = tot > 0 ? (serTime / tot) : 0.20;
            var spd = 1 / (fSer + (1 - fSer) / coreCount);
            amdahlEl.innerHTML = "Amdahl Speedup (" + coreCount + "C, Serial " + Math.round(fSer * 100) + "%): <b>" + spd.toFixed(2) + "×</b> (max " + (1 / Math.max(0.05, fSer)).toFixed(1) + "×)";
        }
        function makeTask() { var isSer = Math.random() < 0.22; return { label: isSer ? "🔒 SERIAL" : parLabels[rand(0, parLabels.length - 1)], len: rand(2, 4), serial: isSer }; }
        function renderQueue() { qEl.innerHTML = ""; for (var i = 0; i < queue.length; i++) { var t = queue[i]; mk(qEl, "div", "task" + (t.serial ? " serial" : "") + (i == 0 ? " first" : ""), t.label + " " + t.len + "s"); } }
        function dispatch(n) {
            var now = Date.now();
            if (queue.length == 0) { g.say("Queue empty", ""); return; }
            if (now < serialUntil) { g.bad("🔒 Serial lock active!", "cores_serial"); return; }
            if (cores[n].until > now) { g.bad("Core " + (n + 1) + " busy!", "cores_serial"); return; }
            var t = queue[0];
            if (t.serial) {
                for (var k = 0; k < coreCount; k++) if (cores[k].until > now) { g.bad("🔒 Wait for ALL cores idle!", "cores_serial"); return; }
                serialUntil = now + t.len * 1000; serTime += t.len;
            } else parTime += t.len;
            queue.shift();
            cores[n].until = now + t.len * 1000; cores[n].len = t.len; cores[n].serial = t.serial; cores[n].label = t.label;
            updateAmdahl(); renderQueue(); beep(500, 50);
        }
        queue.push(makeTask()); queue.push(makeTask()); updateAmdahl(); renderQueue();
        g.every(1100, function () { if (queue.length >= 6) { queue.shift(); g.bad("Queue overflow!", "cores_serial"); } queue.push(makeTask()); renderQueue(); });
        g.every(80, function () {
            var now = Date.now();
            for (var k = 0; k < coreCount; k++) {
                var c = cores[k];
                if (c.until > 0 && now >= c.until) { g.good(c.serial ? 18 : 11, "", "cores_serial"); c.until = 0; }
                if (c.until > 0) { fills[k].style.width = (100 - (c.until - now) / (c.len * 1000) * 100) + "%"; texts[k].innerHTML = c.serial ? "🔒 serial lock" : "running " + (c.label || "task") + " ⚙️"; laneBtns[k].className = "lane"; }
                else { fills[k].style.width = "0%"; texts[k].innerHTML = "idle 💤"; laneBtns[k].className = "lane idle"; }
            }
        });
    }
};
