// games/decoder.js: one minigame = GAMES.decoder
// ---------------------------------------------------------
GAMES.decoder = {
    icon: "🔐", title: "CRACK THE OPCODE", time: 45, stars: [60, 140, 220], badPenalty: 6, rule: "DECODE: turn bits into an instruction. ENCODE: flip bits to build the instruction. The key is on screen!", takeaway: "An instruction is just bits: a few pick the operation and a few pick each register. The decoder reads them.",
    start: function (g, arena) {
        var ops = ["ADD", "SUB", "AND", "OR"], regsN = ["R0", "R1", "R2", "R3"]; mk(arena, "div", "legend", "<b>OP</b> 00 ADD · 01 SUB · 10 AND · 11 OR<br><b>REG</b> 00 R0 · 01 R1 · 10 R2 · 11 R3");
        var body = mk(arena, "div", "dbody", ""), round = 0, mode = "decode", op = 0, a = 0, b = 0, bits = [], sel = [0, 0, 0];
        function bitsFrom() { return [(op >> 1) & 1, op & 1, (a >> 1) & 1, a & 1, (b >> 1) & 1, b & 1]; }
        function newRound() { round++; mode = (round % 2 == 1) ? "decode" : "encode"; op = rand(0, 3); a = rand(0, 3); b = rand(0, 3); if (mode == "decode") { bits = bitsFrom(); sel = [0, 0, 0]; } else bits = [0, 0, 0, 0, 0, 0]; draw(); }
        function draw() {
            body.innerHTML = ""; mk(body, "div", "glabel", mode == "decode" ? "DECODE THESE BITS" : "ENCODE THIS INSTRUCTION"); if (mode == "encode") mk(body, "div", "want", ops[op] + " " + regsN[a] + ", " + regsN[b]);
            var tiles = mk(body, "div", "tiles", ""); for (var i = 0; i < 6; i++)(function (idx) { var t = mk(tiles, "button", "bit g" + Math.floor(idx / 2) + ((idx == 1 || idx == 3) ? " gap" : "") + (bits[idx] ? " on" : ""), String(bits[idx])); if (mode == "encode") t.onclick = function () { bits[idx] = 1 - bits[idx]; draw(); }; else t.style.cursor = "default"; })(i);
            if (mode == "decode") { var cyc = mk(body, "div", "cyc", "");[[0, ops], [1, regsN], [2, regsN]].forEach(function (p) { var bt = mk(cyc, "button", "cycbtn", p[1][sel[p[0]]]); bt.onclick = function () { sel[p[0]] = (sel[p[0]] + 1) % 4; bt.innerHTML = p[1][sel[p[0]]]; beep(400, 40); }; }); }
            mk(body, "button", "bigbtn", mode == "decode" ? "DECODE ✔" : "ENCODE ✔").onclick = check;
        }
        function check() { var ok = mode == "decode" ? (sel[0] == op && sel[1] == a && sel[2] == b) : (bitsFrom().join("") == bits.join("")); if (ok) { g.good(mode == "decode" ? 12 : 15, "Cracked!", "decoder_bits"); newRound(); } else g.bad("Not quite. Check the key!", "decoder_bits"); }
        newRound();
    }
};
