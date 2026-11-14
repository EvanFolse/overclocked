// games/alu.js: one minigame = GAMES.alu
// ---------------------------------------------------------
GAMES.alu = {
    icon: "🧮", title: "BIT FLIP", time: 50, stars: [50, 120, 200], badPenalty: 6, rule: "Flip the bottom lamps to match the operation, then hit RUN!<br>If <b>A + B &ge; 16</b>, light the red <b>OVF (16)</b> lamp!", takeaway: "The ALU works in binary—and finite 4-bit width overflows past 15, motivating 32/64-bit datapaths!",
    start: function (g, arena) {
        var hints = { AND: "1 only where BOTH are 1", OR: "1 where EITHER is 1", XOR: "1 where they DIFFER", ADD: "add binary (use OVF=16 if sum >= 16!)" }, solved = 0, op = "AND", A = 0, B = 0, target = 0, bits = [0, 0, 0, 0, 0];
        var badge = mk(arena, "div", "opbadge", ""), hint = mk(arena, "div", "ophint", ""), rowA = mk(arena, "div", "bitrow", ""), rowB = mk(arena, "div", "bitrow", ""); mk(arena, "div", "bitline", "");
        var rowR = mk(arena, "div", "bitrow", ""); mk(arena, "div", "weights", "<span style='color:#b91c1c;font-weight:700;'>OVF(16)</span><span>8</span><span>4</span><span>2</span><span>1</span>");
        var run = mk(arena, "button", "bigbtn", "▶ RUN"), lamps = []; mk(rowR, "span", "rl", "?");
        for (var i = 0; i < 5; i++)(function (n) { var b = mk(rowR, "button", "lamp" + (n === 0 ? " ovf" : ""), "0"); b.onclick = function () { bits[n] = 1 - bits[n]; showLamps(); beep(400, 40); }; lamps.push(b); })(i);
        function showLamps() { for (var k = 0; k < 5; k++) { lamps[k].className = "lamp" + (k === 0 ? " ovf" : "") + (bits[k] ? " on" : ""); lamps[k].innerHTML = bits[k]; } }
        function staticRow(row, label, val) { var h = "<span class='rl'>" + label + "</span><span style='width:48px;text-align:center;font-size:11px;color:#9aa9b8;' class='mono'>—</span>"; for (var k = 3; k >= 0; k--) { var on = (val >> k) & 1; h += "<button class='lamp static" + (on ? " on" : "") + "'>" + on + "</button>"; } row.innerHTML = h + "<span class='rn'>= " + val + "</span>"; }
        function newPuzzle() {
            var pool = solved >= 4 ? ["AND", "OR", "XOR", "ADD", "ADD"] : (solved >= 2 ? ["AND", "OR", "XOR"] : ["AND", "OR"]); op = pool[rand(0, pool.length - 1)];
            if (op === "ADD" && solved >= 5 && Math.random() < 0.65) { A = rand(8, 15); B = rand(8, 15); } else { do { A = rand(1, 15); B = rand(1, 15); } while (op == "ADD" && A + B > 15); }
            target = op == "AND" ? (A & B) : op == "OR" ? (A | B) : op == "XOR" ? (A ^ B) : (A + B); bits = [0, 0, 0, 0, 0];
            badge.innerHTML = "A " + op + " B" + (target >= 16 ? " (4-BIT OVERFLOW!)" : ""); hint.innerHTML = hints[op]; staticRow(rowA, "A", A); staticRow(rowB, "B", B); showLamps();
        }
        run.onclick = function () {
            var val = bits[0] * 16 + bits[1] * 8 + bits[2] * 4 + bits[3] * 2 + bits[4], isOvf = (target >= 16), cKey = isOvf ? "alu_overflow" : "alu_logic";
            if (val == target) { g.good(isOvf ? 18 : (op == "ADD" ? 15 : 10), (isOvf ? "OVERFLOW caught! " : "Correct! ") + A + " " + op + " " + B + " = " + target, cKey); solved++; newPuzzle(); }
            else { g.bad(isOvf ? "4 bits overflow past 15! Check OVF(16)!" : "Check the red lamps!", cKey); for (var k = 0; k < 5; k++)if (((target >> (4 - k)) & 1) != bits[k]) lamps[k].classList.add("wrongbit"); g.after(700, showLamps); }
        }; newPuzzle();
    }
};
