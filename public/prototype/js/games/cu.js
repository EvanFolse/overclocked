// games/cu.js: one minigame = GAMES.cu
// ---------------------------------------------------------
GAMES.cu = {
    icon: "🎛️", title: "DISPATCHER", time: 30, stars: [60, 140, 230], badPenalty: 10, rule: "Send each instruction to the part that does the work!<br>Tap a button or press 1 · 2 · 3.", takeaway: "The Control Unit does no math itself. It decodes each instruction and sends it to the right part.",
    start: function (g, arena) {
        var list = [["ADD R1, R2", 0], ["SUB R3, R1", 0], ["AND R2, R3", 0], ["OR R1, R4", 0], ["CMP R1, R2", 0], ["INC R3", 0], ["MOV R1, R2", 1], ["MOV R3, R4", 1], ["SWAP R1, R2", 1], ["COPY R2, R4", 1], ["LOAD R1, [40]", 2], ["STORE [44], R2", 2], ["LOAD R3, [8]", 2], ["STORE [12], R1", 2]];
        var names = [["⚙️ ALU", "math & logic"], ["🗂️ REGISTERS", "copy values around"], ["📦 MEMORY", "load & store"]], targets = ["alu", "regs", ""], patience = 3.6, cur = null, born = 0;
        var card = mk(arena, "div", "dcard", ""), bar = mk(arena, "div", "pbar", ""), fill = mk(bar, "div", "pfill", ""), row = mk(arena, "div", "dest", "");
        for (var i = 0; i < 3; i++)(function (n) { mk(row, "button", "destbtn", "<b>" + (n + 1) + " · " + names[n][0] + "</b><small>" + names[n][1] + "</small>").onclick = function () { pick(n); }; })(i);
        function next() { cur = list[rand(0, list.length - 1)]; card.innerHTML = "<div class='dpop'>" + cur[0] + "</div>"; born = Date.now(); }
        function pick(n) { if (!cur) return; if (n == cur[1]) { g.good(10, "", "cu_dispatch"); if (targets[n] != "") setHot(targets[n]); patience = Math.max(1.8, patience - 0.06); } else g.bad(cur[0].split(" ")[0] + " goes to " + names[cur[1]][0], "cu_dispatch"); next(); }
        g.every(50, function () { var t = (Date.now() - born) / 1000; fill.style.width = Math.max(0, 100 - t / patience * 100) + "%"; if (t >= patience) { g.bad("Too slow!", "cu_dispatch"); next(); } });
        g.onKey = function (k) { if (k == "1" || k == "2" || k == "3") { pick(Number(k) - 1); return true; } return false; }; next();
    }
};
