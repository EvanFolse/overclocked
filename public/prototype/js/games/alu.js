// games/alu.js: BIT FLIP with Unsigned CARRY(16) and Lv2+ Signed Two's-Complement V flag
// ---------------------------------------------------------
GAMES.alu = {
    icon: "🧮",
    title: "BIT FLIP",
    time: 55,
    stars: [60, 140, 220],
    badPenalty: 6,
    rule: "Flip lamps to match the result, then hit RUN!<br><b>Unsigned ADD ≥ 16</b> lights <b>CARRY(16)</b>. <b>Lv2+ Signed ADD</b> checks <b>V (Overflow)</b>!",
    start: function (g, arena) {
        var hints = {
            AND: "1 only where BOTH are 1",
            OR: "1 where EITHER is 1",
            XOR: "1 where they DIFFER",
            ADD: "Unsigned 8-4-2-1 sum (CARRY=16 if ≥ 16)",
            SADD: "Signed 4-bit (−8..+7): set V=1 if two same-sign inputs flip sign!"
        };
        var solved = 0, op = "AND", A = 0, B = 0, target = 0, targetV = 0, bits = [0, 0, 0, 0, 0];
        var badge = mk(arena, "div", "opbadge", ""), hint = mk(arena, "div", "ophint", ""), rowA = mk(arena, "div", "bitrow", ""), rowB = mk(arena, "div", "bitrow", "");
        mk(arena, "div", "bitline", "");
        var rowR = mk(arena, "div", "bitrow", ""), wRow = mk(arena, "div", "weights", "");
        var run = mk(arena, "button", "bigbtn", "▶ RUN"), lamps = [];
        mk(rowR, "span", "rl", "?");
        for (var i = 0; i < 5; i++)(function (n) {
            var b = mk(rowR, "button", "lamp" + (n === 0 ? " ovf" : ""), "0");
            b.onclick = function () { bits[n] = 1 - bits[n]; showLamps(); beep(400, 40); };
            lamps.push(b);
        })(i);
        function showLamps() {
            for (var k = 0; k < 5; k++) {
                lamps[k].className = "lamp" + (k === 0 ? " ovf" : "") + (bits[k] ? " on" : "");
                lamps[k].innerHTML = bits[k];
            }
        }
        function toSigned4(n) { return (n & 8) ? n - 16 : n; }
        function staticRow(row, label, val, signed) {
            var h = "<span class='rl'>" + label + "</span><span style='width:48px;text-align:center;font-size:11px;color:#9aa9b8;' class='mono'>—</span>";
            for (var k = 3; k >= 0; k--) { var on = (val >> k) & 1; h += "<button class='lamp static" + (on ? " on" : "") + "'>" + on + "</button>"; }
            row.innerHTML = h + "<span class='rn'>= " + (signed ? toSigned4(val) : val) + "</span>";
        }
        function newPuzzle() {
            var hasSigned = (lvl("alu") >= 2 || solved >= 4);
            var pool = hasSigned ? ["AND", "OR", "XOR", "ADD", "SADD"] : (solved >= 2 ? ["AND", "OR", "XOR", "ADD"] : ["AND", "OR"]);
            op = pool[rand(0, pool.length - 1)];
            targetV = 0;
            if (op === "SADD") {
                A = rand(0, 15); B = rand(0, 15);
                var sa = toSigned4(A), sb = toSigned4(B), sum = sa + sb;
                target = (A + B) & 15;
                targetV = (sum < -8 || sum > 7) ? 1 : 0;
                wRow.innerHTML = "<span style='color:#b91c1c;font-weight:700;'>V(OVF)</span><span>−8</span><span>4</span><span>2</span><span>1</span>";
                badge.innerHTML = "SIGNED A + B (4-bit 2's comp)";
            } else {
                if (op === "ADD" && solved >= 3 && Math.random() < 0.65) { A = rand(8, 15); B = rand(8, 15); }
                else { do { A = rand(1, 15); B = rand(1, 15); } while (op == "ADD" && A + B > 15); }
                target = op == "AND" ? (A & B) : op == "OR" ? (A | B) : op == "XOR" ? (A ^ B) : (A + B);
                wRow.innerHTML = "<span style='color:#b91c1c;font-weight:700;'>CARRY(16)</span><span>8</span><span>4</span><span>2</span><span>1</span>";
                badge.innerHTML = "A " + op + " B";
            }
            bits = [0, 0, 0, 0, 0];
            hint.innerHTML = hints[op];
            staticRow(rowA, "A", A, op === "SADD");
            staticRow(rowB, "B", B, op === "SADD");
            showLamps();
        }
        run.onclick = function () {
            if (op === "SADD") {
                var low4 = bits[1] * 8 + bits[2] * 4 + bits[3] * 2 + bits[4];
                if (bits[0] === targetV && low4 === target) {
                    g.good(20, "✔ Signed 4-bit" + (targetV ? " + V=1!" : "!"), "alu_overflow");
                    solved++; newPuzzle();
                } else {
                    g.bad(bits[0] !== targetV ? "Check V (Signed Overflow): same sign + flipped result!" : "Check lower 4 bits!", "alu_overflow");
                    if (bits[0] !== targetV) lamps[0].classList.add("wrongbit");
                    for (var k = 1; k < 5; k++) if (((target >> (4 - k)) & 1) !== bits[k]) lamps[k].classList.add("wrongbit");
                    g.after(700, showLamps);
                }
                return;
            }
            var val = bits[0] * 16 + bits[1] * 8 + bits[2] * 4 + bits[3] * 2 + bits[4], isCarry = (target >= 16), cKey = isCarry ? "alu_overflow" : "alu_logic";
            if (val == target) { g.good(isCarry ? 18 : (op == "ADD" ? 15 : 10), (isCarry ? "CARRY caught! " : "✔ ") + A + " " + op + " " + B + " = " + target, cKey); solved++; newPuzzle(); }
            else { g.bad(isCarry ? "Unsigned 4-bit max is 15! Flip red CARRY(16)!" : "Check red lamps!", cKey); for (var k = 0; k < 5; k++) if (((target >> (4 - k)) & 1) != bits[k]) lamps[k].classList.add("wrongbit"); g.after(700, showLamps); }
        };
        newPuzzle();
    }
};
