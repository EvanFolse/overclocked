// games/cu.js: one minigame = GAMES.cu
// ---------------------------------------------------------
GAMES.cu = {
    icon: "🎛️", title: "DISPATCHER", time: 30, stars: [60, 140, 230], badPenalty: 10,
    about: "Learn the <b>Control Unit</b>: it does not do the work itself. It reads each command and routes it. Below are <b>example instructions</b> and where a CU would send them.",
    rule: "Route each instruction to the unit that does the work (Keys 1 · 2 · 3).",
    key: "<div class='key-cols'>" +
        "<div class='key-col'><span class='key-num'>Key 1</span><b>ALU</b><small>Math &amp; logic</small><div class='key-ex'>ADD · SUB · AND<br>OR · CMP · INC</div></div>" +
        "<div class='key-col'><span class='key-num'>Key 2</span><b>REGISTERS</b><small>Move values</small><div class='key-ex'>MOV · SWAP<br>COPY</div></div>" +
        "<div class='key-col'><span class='key-num'>Key 3</span><b>MEMORY</b><small>Get or save RAM</small><div class='key-ex'>LOAD<br>STORE</div></div>" +
        "</div>",
    start: function (g, arena) {
        var list = [["ADD R1, R2", 0], ["SUB R3, R1", 0], ["AND R2, R3", 0], ["OR R1, R4", 0], ["CMP R1, R2", 0], ["INC R3", 0], ["MOV R1, R2", 1], ["MOV R3, R4", 1], ["SWAP R1, R2", 1], ["COPY R2, R4", 1], ["LOAD R1, [40]", 2], ["STORE [44], R2", 2], ["LOAD R3, [8]", 2], ["STORE [12], R1", 2]];
        var names = [["⚙️ ALU", "math & logic"], ["🗂️ REGISTERS", "copy between slots"], ["📦 MEMORY", "load & store RAM"]], targets = ["alu", "regs", ""], patience = 3.6, cur = null, born = 0;
        var card = mk(arena, "div", "dcard", ""), bar = mk(arena, "div", "pbar", ""), fill = mk(bar, "div", "pfill", ""), row = mk(arena, "div", "dest", "");
        for (var i = 0; i < 3; i++)(function (n) { mk(row, "button", "destbtn", "<b>" + (n + 1) + " · " + names[n][0] + "</b><small>" + names[n][1] + "</small>").onclick = function () { pick(n); }; })(i);
        function next() { cur = list[rand(0, list.length - 1)]; card.innerHTML = "<div class='dpop'>" + cur[0] + "</div>"; born = Date.now(); }
        function pick(n) { if (!cur) return; if (n == cur[1]) { g.good(10, "", "cu_dispatch"); if (targets[n] != "") setHot(targets[n]); patience = Math.max(1.8, patience - 0.06); } else g.bad(cur[0].split(" ")[0] + " → " + names[cur[1]][0], "cu_dispatch"); next(); }
        g.every(50, function () { var t = (Date.now() - born) / 1000; fill.style.width = Math.max(0, 100 - t / patience * 100) + "%"; if (t >= patience) { g.bad("Too slow!", "cu_dispatch"); next(); } });
        g.onKey = function (k) { if (k == "1" || k == "2" || k == "3") { pick(Number(k) - 1); return true; } return false; }; next();
    }
};
