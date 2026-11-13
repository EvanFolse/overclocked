// =====================================================
// 6. DECODER: CRACK THE OPCODE
// =====================================================
GAMES.decoder = {
  icon: "🔐", title: "CRACK THE OPCODE", time: 45, stars: [60, 140, 220],
  rule: "DECODE: turn bits into an instruction. ENCODE: flip bits to build the instruction. The key is on screen!",
  takeaway: "An instruction is just bits: a few pick the operation and a few pick each register. The decoder reads them.",
  start: function (g, arena) {
    var ops = ["ADD", "SUB", "AND", "OR"];
    var regsN = ["R0", "R1", "R2", "R3"];
    mk(arena, "div", "legend", "<b>OP</b> 00 ADD · 01 SUB · 10 AND · 11 OR<br><b>REG</b> 00 R0 · 01 R1 · 10 R2 · 11 R3");
    var body = mk(arena, "div", "dbody", "");
    var round = 0, mode = "decode", op = 0, a = 0, b = 0;
    var bits = [], sel = [0, 0, 0];

    function bitsFrom() {
      return [(op >> 1) & 1, op & 1, (a >> 1) & 1, a & 1, (b >> 1) & 1, b & 1];
    }
    function newRound() {
      round++;
      mode = (round % 2 == 1) ? "decode" : "encode";
      op = rand(0, 3);
      a = rand(0, 3);
      b = rand(0, 3);
      if (mode == "decode") {
        bits = bitsFrom();
        sel = [0, 0, 0];
      } else {
        bits = [0, 0, 0, 0, 0, 0];
      }
      draw();
    }
    function draw() {
      body.innerHTML = "";
      mk(body, "div", "glabel", mode == "decode" ? "DECODE THESE BITS" : "ENCODE THIS INSTRUCTION");
      if (mode == "encode") { mk(body, "div", "want", ops[op] + " " + regsN[a] + ", " + regsN[b]); }
      var tiles = mk(body, "div", "tiles", "");
      for (var i = 0; i < 6; i++) { makeTile(tiles, i); }
      if (mode == "decode") {
        var cyc = mk(body, "div", "cyc", "");
        makeCycle(cyc, 0, ops);
        makeCycle(cyc, 1, regsN);
        makeCycle(cyc, 2, regsN);
      }
      var go = mk(body, "button", "bigbtn", mode == "decode" ? "DECODE ✔" : "ENCODE ✔");
      go.onclick = check;
    }
    function makeTile(parent, i) {
      var t = mk(parent, "button", "bit g" + Math.floor(i / 2) + ((i == 1 || i == 3) ? " gap" : "") + (bits[i] ? " on" : ""), String(bits[i]));
      if (mode == "encode") {
        t.onclick = function () { bits[i] = 1 - bits[i]; draw(); };
      } else {
        t.style.cursor = "default";
      }
    }
    function makeCycle(parent, idx, labels) {
      var bt = mk(parent, "button", "cycbtn", labels[sel[idx]]);
      bt.onclick = function () {
        sel[idx] = (sel[idx] + 1) % 4;
        bt.innerHTML = labels[sel[idx]];
        beep(400, 40);
      };
    }
    function check() {
      var ok;
      if (mode == "decode") {
        ok = (sel[0] == op && sel[1] == a && sel[2] == b);
      } else {
        var want = bitsFrom();
        ok = (want.join("") == bits.join(""));
      }
      if (ok) {
        g.good(mode == "decode" ? 12 : 15, "Cracked!");
        newRound();
      } else {
        g.bad("Not quite. Check the key!");
      }
    }
    newRound();
  }
};

