// =====================================================
// 9. FPU: FLOAT THE POINT
// =====================================================
GAMES.fpu = {
  icon: "🎯", title: "FLOAT THE POINT", time: 40, stars: [48, 110, 180],
  rule: "The exponent tells the decimal point how far to FLOAT. Tap the gap where the point belongs!",
  takeaway: "Floating-point numbers store digits plus an exponent. The exponent says how far the decimal point floats.",
  start: function (g, arena) {
    var big = mk(arena, "div", "sci", "");
    mk(arena, "div", "glabel", "TAP THE GAP FOR THE DECIMAL POINT");
    var tiles = mk(arena, "div", "digits", "");
    var solved = 0, answer = 0, digits = "";

    function zeros(n) {
      var s = "";
      for (var i = 0; i < n; i++) { s += "0"; }
      return s;
    }
    function newPuzzle() {
      var d1 = rand(1, 9);
      var d2 = rand(0, 9);
      var lim = (solved < 3) ? 3 : 4;
      var e = rand(-lim, lim);
      if (solved < 2 && e == 0) { e = 2; }
      var mant = d1 + "" + d2;
      if (e >= 1) {
        digits = mant + zeros(e - 1);
        answer = digits.length;
      } else if (e == 0) {
        digits = mant;
        answer = 1;
      } else {
        digits = zeros(-e) + mant;
        answer = 1;
      }
      big.innerHTML = d1 + "." + d2 + " × 10<sup>" + e + "</sup>";
      draw();
    }
    function draw() {
      tiles.innerHTML = "";
      for (var i = 0; i <= digits.length; i++) {
        makeGap(i);
        if (i < digits.length) { mk(tiles, "span", "dig", digits.charAt(i)); }
      }
    }
    function makeGap(i) {
      var b = mk(tiles, "button", "gapbtn", "·");
      b.onclick = function () { pick(i); };
    }
    function pick(i) {
      if (i == answer) {
        var out = digits.slice(0, answer) + (answer < digits.length ? "." + digits.slice(answer) : "");
        g.good(12, "= " + out);
        solved++;
        newPuzzle();
      } else {
        g.bad("Positive exponent floats the point RIGHT, negative floats it LEFT");
      }
    }
    newPuzzle();
  }
};

