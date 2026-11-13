// =====================================================
// 7. L1 CACHE: CACHE KEEPER
// =====================================================
GAMES.l1 = {
  icon: "⚡", title: "CACHE KEEPER", time: 45, stars: [70, 150, 230],
  rule: "The CPU asks for data. On a MISS, kick out the OLDEST slot: the one with the reddest bar!<br>Keys 1 · 2 · 3",
  takeaway: "A cache keeps recently used data close. When it is full, it throws out the least recently used (LRU) item.",
  start: function (g, arena) {
    var all = ["A", "B", "C", "D", "E", "F", "G"];
    var hot = ["A", "B", "C"];
    var slots = [{ a: "A", age: 0 }, { a: "B", age: 1 }, { a: "C", age: 2 }];
    var waiting = false, req = "", missAt = 0, count = 0;

    var asked = mk(arena, "div", "asked", "");
    mk(arena, "div", "glabel", "L1 CACHE (3 slots) · bar = how recently used");
    var slotsEl = mk(arena, "div", "cslots", "");
    var msg = mk(arena, "div", "cmsg", "");

    function ageColor(age) {
      var t = Math.min(1, age / 5);
      return "hsl(" + Math.round(130 - 130 * t) + ",70%,48%)";
    }
    function render() {
      slotsEl.innerHTML = "";
      for (var i = 0; i < slots.length; i++) { makeSlot(i); }
    }
    function makeSlot(i) {
      var s = slots[i];
      var b = mk(slotsEl, "button", "cslot" + (waiting ? " pick" : ""),
        s.a + "<div class='agebar'><div style='width:" + Math.max(12, 100 - s.age * 16) + "%;background:" + ageColor(s.age) + "'></div></div><small>" + (i + 1) + " · age " + s.age + "</small>");
      b.onclick = function () { evict(i, false); };
    }
    function ask() {
      count++;
      if (count % 7 == 0) {
        var others = all.filter(function (x) { return hot.indexOf(x) == -1; });
        hot[rand(0, 2)] = others[rand(0, others.length - 1)];
      }
      req = (Math.random() < 0.72) ? hot[rand(0, 2)] : all[rand(0, all.length - 1)];
      asked.innerHTML = "CPU wants: <b>" + req + "</b>";
      var idx = -1;
      for (var i = 0; i < slots.length; i++) { if (slots[i].a == req) { idx = i; } }
      if (idx != -1) {
        g.good(10, "HIT ⚡ no wait!");
        for (var k = 0; k < slots.length; k++) { slots[k].age++; }
        slots[idx].age = 0;
        msg.innerHTML = "";
        render();
        g.after(Math.max(900, 1900 - count * 25), ask);
      } else {
        waiting = true;
        missAt = Date.now();
        msg.innerHTML = "<b style='color:#d24b4b'>MISS!</b> Evict the oldest slot!";
        render();
      }
    }
    function evict(i, forced) {
      if (!waiting) { return; }
      var oldest = 0;
      for (var k = 0; k < slots.length; k++) { if (slots[k].age > oldest) { oldest = slots[k].age; } }
      if (forced) {
        g.bad("Too slow!");
      } else if (slots[i].age >= oldest) {
        g.good(10, "LRU! Great choice");
      } else {
        g.bad("That one was used recently!");
      }
      for (var j = 0; j < slots.length; j++) { slots[j].age++; }
      slots[i] = { a: req, age: 0 };
      waiting = false;
      msg.innerHTML = "";
      render();
      g.after(900, ask);
    }
    g.every(100, function () {
      if (waiting && Date.now() - missAt > 3000) { evict(rand(0, 2), true); }
    });
    g.onKey = function (k) {
      if (k == "1" || k == "2" || k == "3") { evict(Number(k) - 1, false); return true; }
      return false;
    };
    render();
    g.after(600, ask);
  }
};

