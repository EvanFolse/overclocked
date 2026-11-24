// games/decoder.js: one minigame = GAMES.decoder
// ---------------------------------------------------------
GAMES.decoder = {
    icon: "🔐", title: "CRACK THE OPCODE", time: 45, stars: [60, 140, 220], badPenalty: 6,
    menuIntro: true,
    about: "The instruction decoder turns raw bits into a command the CPU can run. You'll read or build a simple 6-bit instruction: 2 bits for the operation, then 2 bits for each register.",
    rule: "",
    introKeyTitle: "BIT FIELDS",
    introKey: ""
        + accCard("⚙️", "OP", "What to do", "2b",
            keyDef("00", "ADD")
            + keyDef("01", "SUB")
            + keyDef("10", "AND")
            + keyDef("11", "OR")
            + keyDef("Play", "Decode: read bits → pick the op. Encode: set bits to match the target."))
        + accCard("🅰️", "REG A", "First register", "2b",
            keyDef("00", "R0")
            + keyDef("01", "R1")
            + keyDef("10", "R2")
            + keyDef("11", "R3"))
        + accCard("🅱️", "REG B", "Second register", "2b",
            keyDef("00", "R0")
            + keyDef("01", "R1")
            + keyDef("10", "R2")
            + keyDef("11", "R3")),
    keyTitle: "QUICK REFERENCE",
    key: "<div class='key-cols'>" +
        "<div class='key-col'><span class='key-num'>Field 1</span><b>OP</b><small>What to do</small><div class='key-ex'>00 ADD · 01 SUB<br>10 AND · 11 OR</div></div>" +
        "<div class='key-col'><span class='key-num'>Field 2</span><b>REG A</b><small>First register</small><div class='key-ex'>00 R0 · 01 R1<br>10 R2 · 11 R3</div></div>" +
        "<div class='key-col'><span class='key-num'>Field 3</span><b>REG B</b><small>Second register</small><div class='key-ex'>00 R0 · 01 R1<br>10 R2 · 11 R3</div></div>" +
        "</div>",
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
        function check() { var ok = mode == "decode" ? (sel[0] == op && sel[1] == a && sel[2] == b) : (bitsFrom().join("") == bits.join("")); if (ok) { g.good(mode == "decode" ? 12 : 15, "Cracked!", "decoder_bits"); newRound(); } else g.bad("Check the key!", "decoder_bits"); }
        newRound();
    }
};
