// games/regs.js: one minigame = GAMES.regs
// ---------------------------------------------------------
GAMES.regs = {
    icon: "🗂️", title: "KEEP IT CLOSE", time: 0, stars: [50, 100, 150], badPenalty: 8, rule: "Instructions need their variables IN a register. Tap a variable, then a register slot, to load it before the timer ends!", takeaway: "Registers hold what the CPU needs right now. If data isn't in a register, the CPU stalls waiting on slower memory.",
    start: function (g, arena) {
        var names = ["a", "b", "c", "d", "e", "f", "g"], colors = ["#ff6b6b", "#3aa0ff", "#22c55e", "#f5b301", "#a855f7", "#14b8a6", "#ec4899"], hotSet = ["a", "b", "c", "d"], total = 12, done = 0, dur = 5.2, born = Date.now(), regs = ["a", "b", "", ""], sel = "", queue = [], timerFill = null;
        mk(arena, "div", "glabel", "NEXT INSTRUCTIONS"); var queueEl = mk(arena, "div", "queue", ""); mk(arena, "div", "glabel", "REGISTERS (fast, tiny)"); var regsEl = mk(arena, "div", "regrow", ""); mk(arena, "div", "glabel", "RAM (slow, big): tap a variable"); var ramEl = mk(arena, "div", "ramrow", "");
        function chip(n) { return "<span class='vchip' style='background:" + colors[names.indexOf(n)] + "'>" + n + "</span>"; }
        function newInstr() { var pool = Math.random() < 0.8 ? hotSet : names, x = pool[rand(0, pool.length - 1)], y = pool[rand(0, pool.length - 1)]; while (y == x) y = pool[rand(0, pool.length - 1)]; return { op: ["ADD", "SUB", "MUL", "AND"][rand(0, 3)], x: x, y: y }; }
        function render() {
            queueEl.innerHTML = ""; for (var i = 0; i < queue.length; i++) { var q = queue[i], c = mk(queueEl, "div", "qcard" + (i == 0 ? " now" : ""), (i == 0 ? "<small>NOW</small>" : "") + q.op + "<br>" + chip(q.x) + " " + chip(q.y)); if (i == 0) timerFill = mk(mk(c, "div", "qbar", ""), "div", "qfill", ""); }
            regsEl.innerHTML = ""; for (var r = 0; r < 4; r++)(function (idx) { mk(regsEl, "button", "rslot" + (regs[idx] != "" ? " full" : ""), "<small>R" + (idx + 1) + "</small>" + (regs[idx] != "" ? chip(regs[idx]) : "—")).onclick = function () { if (sel == "") { g.say("Tap a variable first!", ""); return; } regs[idx] = sel; sel = ""; beep(440, 60); render(); }; })(r);
            ramEl.innerHTML = ""; for (var v = 0; v < names.length; v++)(function (n) { var inReg = regs.indexOf(n) != -1; mk(ramEl, "button", "vcard" + (sel == n ? " sel" : "") + (inReg ? " dim" : ""), chip(n)).onclick = function () { if (inReg) { g.say(n + " is already in a register", ""); return; } sel = (sel == n) ? "" : n; render(); }; })(names[v]);
        }
        function execute() {
            var q = queue.shift(); if (regs.indexOf(q.x) != -1 && regs.indexOf(q.y) != -1) g.good(12, "✔ Ran in 1 tick!", "regs_stall"); else g.bad("STALL! Waited on slow RAM", "regs_stall");
            done++; g.setBar(done / total); g.info(done + " / " + total); if (done >= total) { g.finish(); return; }
            queue.push(newInstr()); if (done % 4 == 0) { var cold = names.filter(function (n) { return hotSet.indexOf(n) == -1; }); hotSet[rand(0, 3)] = cold[rand(0, cold.length - 1)]; } dur = Math.max(3.5, dur - 0.1); born = Date.now(); render();
        }
        for (var i = 0; i < 3; i++)queue.push(newInstr()); g.info("0 / " + total); render();
        g.every(50, function () { var t = (Date.now() - born) / 1000; if (timerFill) timerFill.style.width = Math.max(0, 100 - t / dur * 100) + "%"; if (t >= dur) execute(); });
    }
};
