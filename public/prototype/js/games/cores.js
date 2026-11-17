// =====================================================
// 10. MULTI-CORE: CORE SCHEDULER
// =====================================================
GAMES.cores = {
  icon: "🧩", title: "CORE SCHEDULER", time: 35, stars: [80, 160, 240],
  rule: "Tap a core to give it the next task. Keep every core busy!<br>🔒 tasks need ALL cores idle first.",
  takeaway: "More cores do more work at once, but only if there are independent tasks to hand out. Serial work can't be split.",
  start: function (g, arena) {
    var cores = [];
    var queue = [];
    var serialUntil = 0;
    for (var i = 0; i < 4; i++) { cores.push({ until: 0, serial: false }); }

    mk(arena, "div", "glabel", "TASK QUEUE (next task is outlined)");
    var qEl = mk(arena, "div", "cq", "");
    mk(arena, "div", "glabel", "CORES: tap one to dispatch");
    var lanesEl = mk(arena, "div", "lanes", "");
    var laneBtns = [];
    var fills = [];
    var texts = [];
    for (var n = 0; n < 4; n++) { makeLane(n); }

    function makeLane(n) {
      var b = mk(lanesEl, "button", "lane idle", "<span class='cn'>CORE " + (n + 1) + "</span> <span class='lt'>idle 💤</span>");
      var bar = mk(b, "div", "lbar", "");
      fills.push(mk(bar, "div", "lfill", ""));
      texts.push(b.querySelector(".lt"));
      laneBtns.push(b);
      b.onclick = function () { dispatch(n); };
    }
    function makeTask() {
      return { len: rand(2, 4), serial: Math.random() < 0.18 };
    }
    function renderQueue() {
      qEl.innerHTML = "";
      for (var i = 0; i < queue.length; i++) {
        var t = queue[i];
        mk(qEl, "div", "task" + (t.serial ? " serial" : "") + (i == 0 ? " first" : ""), (t.serial ? "🔒 " : "") + t.len + "s");
      }
    }
    function dispatch(n) {
      var now = Date.now();
      if (queue.length == 0) { g.say("No tasks waiting", ""); return; }
      if (now < serialUntil) { g.bad("🔒 A serial task is running!"); return; }
      if (cores[n].until > now) { g.bad("That core is busy!"); return; }
      var t = queue[0];
      if (t.serial) {
        for (var k = 0; k < 4; k++) {
          if (cores[k].until > now) { g.bad("🔒 Needs ALL cores idle!"); return; }
        }
        serialUntil = now + t.len * 1000;
      }
      queue.shift();
      cores[n].until = now + t.len * 1000;
      cores[n].len = t.len;
      cores[n].serial = t.serial;
      renderQueue();
      beep(500, 50);
    }
    queue.push(makeTask());
    queue.push(makeTask());
    renderQueue();
    g.every(1100, function () {
      if (queue.length >= 6) {
        queue.shift();
        g.bad("Queue full, a task was dropped!");
      }
      queue.push(makeTask());
      renderQueue();
    });
    g.every(80, function () {
      var now = Date.now();
      for (var k = 0; k < 4; k++) {
        var c = cores[k];
        if (c.until > 0 && now >= c.until) {
          g.good(c.serial ? 15 : 10);
          c.until = 0;
        }
        if (c.until > 0) {
          fills[k].style.width = (100 - (c.until - now) / (c.len * 1000) * 100) + "%";
          texts[k].innerHTML = c.serial ? "🔒 serial task" : "working ⚙️";
          laneBtns[k].className = "lane";
        } else {
          fills[k].style.width = "0%";
          texts[k].innerHTML = "idle 💤";
          laneBtns[k].className = "lane idle";
        }
      }
    });
  }
};

