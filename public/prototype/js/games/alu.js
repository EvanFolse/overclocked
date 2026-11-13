// =====================================================
// 2. ALU: BIT FLIP
// =====================================================
GAMES.alu = {
  icon: "🧮", title: "BIT FLIP", time: 45, stars: [50, 120, 200],
  rule: "Flip the bottom lamps to make the result of the operation, then hit RUN!",
  takeaway: "The ALU works in binary. Every lamp is a bit worth 8, 4, 2 or 1.",
  start: function (g, arena) {
    var hints = { AND: "1 only where BOTH are 1", OR: "1 where EITHER is 1", XOR: "1 where they DIFFER", ADD: "add the numbers in binary" };
    var solved = 0, op = "AND", A = 0, B = 0, target = 0;
    var bits = [0, 0, 0, 0];

    var badge = mk(arena, "div", "opbadge", "");
    var hint = mk(arena, "div", "ophint", "");
    var rowA = mk(arena, "div", "bitrow", "");
    var rowB = mk(arena, "div", "bitrow", "");
    mk(arena, "div", "bitline", "");
    var rowR = mk(arena, "div", "bitrow", "");
    var weights = mk(arena, "div", "weights", "<span>8</span><span>4</span><span>2</span><span>1</span>");
    var run = mk(arena, "button", "bigbtn", "▶ RUN");
    var lamps = [];

    mk(rowR, "span", "rl", "?");
    for (var i = 0; i < 4; i++) { makeLamp(i); }
    function makeLamp(n) {
      var b = mk(rowR, "button", "lamp", "0");
      b.onclick = function () { bits[n] = 1 - bits[n]; showLamps(); beep(400, 40); };
      lamps.push(b);
    }
    function showLamps() {
      for (var k = 0; k < 4; k++) {
        lamps[k].className = "lamp" + (bits[k] ? " on" : "");
        lamps[k].innerHTML = bits[k];
      }
    }
    function staticRow(row, label, val) {
      var h = "<span class='rl'>" + label + "</span>";
      for (var k = 3; k >= 0; k--) {
        var on = (val >> k) & 1;
        h += "<button class='lamp static" + (on ? " on" : "") + "'>" + on + "</button>";
      }
      row.innerHTML = h + "<span class='rn'>= " + val + "</span>";
    }
    function newPuzzle() {
      var pool = ["AND", "OR"];
      if (solved >= 2) { pool = ["AND", "OR", "XOR"]; }
      if (solved >= 5) { pool = ["AND", "OR", "XOR", "ADD"]; }
      op = pool[rand(0, pool.length - 1)];
      do {
        A = rand(1, 15);
        B = rand(1, 15);
      } while (op == "ADD" && A + B > 15);
      if (op == "AND") { target = A & B; }
      if (op == "OR") { target = A | B; }
      if (op == "XOR") { target = A ^ B; }
      if (op == "ADD") { target = A + B; }
      bits = [0, 0, 0, 0];
      badge.innerHTML = "A " + op + " B";
      hint.innerHTML = hints[op];
      staticRow(rowA, "A", A);
      staticRow(rowB, "B", B);
      showLamps();
    }
    run.onclick = function () {
      var val = bits[0] * 8 + bits[1] * 4 + bits[2] * 2 + bits[3];
      if (val == target) {
        g.good(op == "ADD" ? 15 : 10, "Correct! " + A + " " + op + " " + B + " = " + target);
        solved++;
        newPuzzle();
      } else {
        g.bad("Check the red lamps!");
        for (var k = 0; k < 4; k++) {
          var want = (target >> (3 - k)) & 1;
          if (want != bits[k]) { lamps[k].classList.add("wrongbit"); }
        }
        g.after(700, showLamps);
      }
    };
    newPuzzle();
  }
};

