// =====================================================
// 4. CLOCK: BEAT SYNC (rhythm)
// =====================================================
GAMES.clock = {
  icon: "⏱️", title: "BEAT SYNC", time: 30, stars: [150, 400, 750],
  rule: "Hit TICK (or press SPACE) the moment a beat lands in the ring. Every part of the CPU steps on the beat!",
  takeaway: "The clock gives every part the same beat. A faster clock means more steps every second.",
  start: function (g, arena) {
    var track = mk(arena, "div", "track", "");
    var zone = mk(track, "div", "zone", "");
    var W = track.clientWidth || 340;
    var zoneX = W * 0.2;
    zone.style.left = (zoneX - 24) + "px";
    var row = mk(arena, "div", "partsrow", "");
    var chips = [];
    var labels = ["CU", "ALU", "REG", "MEM"];
    for (var i = 0; i < 4; i++) { chips.push(mk(row, "span", "pchip", labels[i])); }
    var btn = mk(arena, "button", "bigbtn", "TICK!");
    var notes = [];
    var startAt = Date.now();
    var nextAt = startAt + 500;

    function spawn() {
      var dot = mk(track, "div", "note", "");
      var speed = W * (0.45 + (Date.now() - startAt) / 30000 * 0.3);
      notes.push({ dot: dot, t0: Date.now(), speed: speed });
    }
    function posOf(n, now) { return W - (now - n.t0) / 1000 * n.speed; }
    function lightUp() {
      for (var k = 0; k < chips.length; k++) { chips[k].classList.add("lit"); }
      g.after(160, function () {
        for (var k = 0; k < chips.length; k++) { chips[k].classList.remove("lit"); }
      });
    }
    function tap() {
      var now = Date.now();
      var best = -1;
      var bestD = 9999;
      for (var k = 0; k < notes.length; k++) {
        var d = Math.abs(posOf(notes[k], now) - zoneX);
        if (d < bestD) { bestD = d; best = k; }
      }
      if (best == -1 || bestD > 46) { g.bad("Too early!"); return; }
      track.removeChild(notes[best].dot);
      notes.splice(best, 1);
      if (bestD <= 13) {
        g.good(15, "PERFECT!");
        lightUp();
      } else if (bestD <= 30) {
        g.good(8, "Good");
        lightUp();
      } else {
        g.bad("Off the beat");
      }
    }
    btn.onclick = tap;
    track.onclick = tap;
    g.onKey = function (k) {
      if (k == " " || k == "Enter") { tap(); return true; }
      return false;
    };
    g.every(16, function () {
      var now = Date.now();
      if (now >= nextAt) {
        spawn();
        nextAt = now + Math.max(430, 760 - (now - startAt) / 30000 * 330);
      }
      for (var k = notes.length - 1; k >= 0; k--) {
        var x = posOf(notes[k], now);
        notes[k].dot.style.left = (x - 18) + "px";
        if (x < zoneX - 40) {
          track.removeChild(notes[k].dot);
          notes.splice(k, 1);
          g.bad("Missed a beat!");
        }
      }
    });
  }
};

