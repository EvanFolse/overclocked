// games/cores.js: one minigame = GAMES.cores
// ---------------------------------------------------------
GAMES.cores = {
    icon: "🧩", title: "CORE SCHEDULER", time: 35, stars: [80, 160, 240], badPenalty: 6, rule: "Tap an idle core to dispatch parallel tasks (IMG, MAT, VEC).<br>🔒 SERIAL locks need ALL 4 cores idle first (Amdahl's Law)!", takeaway: "More cores multiply parallel throughput, but serial bottlenecks still stall the whole chip (Amdahl's Law).",
    start: function (g, arena) {
        var cores = [], queue = [], serialUntil = 0, parLabels = ["IMG", "MAT", "VEC", "RAY"]; for (var i = 0; i < 4; i++)cores.push({ until: 0, serial: false });
        mk(arena, "div", "glabel", "WORKLOAD QUEUE (next task is outlined)"); var qEl = mk(arena, "div", "cq", ""); mk(arena, "div", "glabel", "CORES: tap one to dispatch"); var lanesEl = mk(arena, "div", "lanes", ""), laneBtns = [], fills = [], texts = [];
        for (var n = 0; n < 4; n++)(function (idx) { var b = mk(lanesEl, "button", "lane idle", "<span class='cn'>CORE " + (idx + 1) + "</span> <span class='lt'>idle 💤</span>"); fills.push(mk(mk(b, "div", "lbar", ""), "div", "lfill", "")); texts.push(b.querySelector(".lt")); laneBtns.push(b); b.onclick = function () { dispatch(idx); }; })(n);
        function makeTask() { var isSer = Math.random() < 0.2; return { label: isSer ? "🔒 SERIAL" : parLabels[rand(0, parLabels.length - 1)], len: rand(2, 4), serial: isSer }; }
        function renderQueue() { qEl.innerHTML = ""; for (var i = 0; i < queue.length; i++) { var t = queue[i]; mk(qEl, "div", "task" + (t.serial ? " serial" : "") + (i == 0 ? " first" : ""), t.label + " " + t.len + "s"); } }
        function dispatch(n) { var now = Date.now(); if (queue.length == 0) { g.say("No tasks waiting", ""); return; } if (now < serialUntil) { g.bad("🔒 A serial task holds the lock!", "cores_serial"); return; } if (cores[n].until > now) { g.bad("Core " + (n + 1) + " is busy!", "cores_serial"); return; } var t = queue[0]; if (t.serial) { for (var k = 0; k < 4; k++)if (cores[k].until > now) { g.bad("🔒 Serial task needs ALL cores idle!", "cores_serial"); return; } serialUntil = now + t.len * 1000; } queue.shift(); cores[n].until = now + t.len * 1000; cores[n].len = t.len; cores[n].serial = t.serial; cores[n].label = t.label; renderQueue(); beep(500, 50); }
        queue.push(makeTask()); queue.push(makeTask()); renderQueue();
        g.every(1100, function () { if (queue.length >= 6) { queue.shift(); g.bad("Queue overflow—task dropped!", "cores_serial"); } queue.push(makeTask()); renderQueue(); });
        g.every(80, function () { var now = Date.now(); for (var k = 0; k < 4; k++) { var c = cores[k]; if (c.until > 0 && now >= c.until) { g.good(c.serial ? 15 : 10, "", "cores_serial"); c.until = 0; } if (c.until > 0) { fills[k].style.width = (100 - (c.until - now) / (c.len * 1000) * 100) + "%"; texts[k].innerHTML = c.serial ? "🔒 serial bottleneck" : "running " + (c.label || "task") + " ⚙️"; laneBtns[k].className = "lane"; } else { fills[k].style.width = "0%"; texts[k].innerHTML = "idle 💤"; laneBtns[k].className = "lane idle"; } } });
    }
};
