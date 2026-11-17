// =====================================================
// 8. L2 CACHE: MEMORY SORTER
// =====================================================
GAMES.l2 = {
  icon: "🗄️", title: "MEMORY SORTER", time: 35, stars: [70, 150, 240],
  rule: "Hot data (🔥) goes in tiny, fast memory. Cold data (❄️) goes in huge, slow storage.<br>Keys 1 to 5.",
  takeaway: "Memory is a hierarchy: the more often you need data, the closer and faster the place you keep it.",
  start: function (g, arena) {
    var places = [["REG", "tiny · fastest"], ["L1", "small · fast"], ["L2", "medium"], ["RAM", "big · slow"], ["SSD", "huge · slowest"]];
    var items = [
      ["loop counter", 0], ["running total", 0], ["array index", 0],
      ["current function", 1], ["hot array", 1], ["stack top", 1],
      ["recent photos", 2], ["open document", 2], ["game level", 2],
      ["browser tabs", 3], ["music player", 3], ["chat app", 3],
      ["old videos", 4], ["backup files", 4], ["installer file", 4]
    ];
    var patience = 3.4, cur = null, born = 0;

    var card = mk(arena, "div", "", "");
    var bar = mk(arena, "div", "pbar", "");
    var fill = mk(bar, "div", "pfill", "");
    var list = mk(arena, "div", "places", "");
    for (var i = 0; i < 5; i++) { makePlace(i); }

    function makePlace(n) {
      var b = mk(list, "button", "place", "<span>" + (n + 1) + " · " + places[n][0] + "</span><small>" + places[n][1] + "</small>");
      b.onclick = function () { pick(n); };
    }
    function flames(level) {
      if (level == 4) { return "❄️"; }
      var s = "";
      for (var i = 0; i < 4 - level; i++) { s += "🔥"; }
      return s;
    }
    function next() {
      cur = items[rand(0, items.length - 1)];
      card.innerHTML = "<div class='sortcard'>" + cur[0] + "<small>" + flames(cur[1]) + "</small></div>";
      born = Date.now();
    }
    function pick(n) {
      if (cur == null) { return; }
      if (n == cur[1]) {
        g.good(10);
        patience = Math.max(1.8, patience - 0.07);
      } else {
        g.bad(cur[0] + " belongs in " + places[cur[1]][0]);
      }
      next();
    }
    g.every(50, function () {
      var t = (Date.now() - born) / 1000;
      fill.style.width = Math.max(0, 100 - t / patience * 100) + "%";
      if (t >= patience) {
        g.bad("Too slow!");
        next();
      }
    });
    g.onKey = function (k) {
      if (k >= "1" && k <= "5") { pick(Number(k) - 1); return true; }
      return false;
    };
    next();
  }
};

