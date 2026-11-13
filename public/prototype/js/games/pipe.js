// =====================================================
// 5. PIPELINE: ASSEMBLY LINE
// =====================================================
GAMES.pipe = {
  icon: "🏭", title: "ASSEMBLY LINE", time: 40, stars: [100, 230, 380],
  rule: "Instructions flow through 5 stages. When a hazard freezes the line, tap the matching fix FAST!<br>Keys: 1 · 2",
  takeaway: "A pipeline finishes one instruction every tick, but hazards stall it unless the CPU forwards data or predicts branches.",
  start: function (g, arena) {
    var names = ["Fetch", "Decode", "Execute", "Memory", "Write"];
    var colors = ["#ff6b6b", "#3aa0ff", "#22c55e", "#f5b301", "#a855f7", "#14b8a6", "#ec4899", "#ff8a3d"];
    var pipe = [0, 0, 0, 0, 0];
    var nextId = 1, hazard = "", hazardAt = 0, stalls = 0, finished = 0, tickMs = 850;

    var line = mk(arena, "div", "pipe", "");
    var cells = [];
    for (var i = 0; i < 5; i++) {
      var c = mk(line, "div", "pcell", "<small>" + names[i] + "</small>");
      cells.push(mk(c, "div", "pslot", ""));
    }
    var info = mk(arena, "div", "pinfo", "");
    var fixRow = mk(arena, "div", "fixrow", "");
    var b1 = mk(fixRow, "button", "fixbtn", "🔁 FORWARD DATA<small>1</small>");
    var b2 = mk(fixRow, "button", "fixbtn", "🔮 PREDICT BRANCH<small>2</small>");
    b1.onclick = function () { fix("data"); };
    b2.onclick = function () { fix("branch"); };

    function draw() {
      for (var k = 0; k < 5; k++) {
        if (pipe[k] != 0) {
          cells[k].innerHTML = "<span class='blk" + ((hazard != "" && k == 1) ? " haz" : "") + "' style='background:" + colors[pipe[k] % 8] + "'>I" + pipe[k] + "</span>";
        } else {
          cells[k].innerHTML = "";
        }
      }
      if (hazard == "data") {
        info.innerHTML = "<b style='color:#d24b4b'>⚠ DATA HAZARD</b><br>An instruction is waiting for a result!";
      } else if (hazard == "branch") {
        info.innerHTML = "<b style='color:#d24b4b'>⚠ BRANCH HAZARD</b><br>Which way will the program go?";
      } else {
        info.innerHTML = "Flowing smoothly...";
      }
      g.info("done " + finished + " · stalls " + stalls);
    }
    function fix(type) {
      if (hazard == "") { g.bad("No hazard right now!"); return; }
      if (type == hazard) {
        var fast = (Date.now() - hazardAt) < 1500;
        g.good(fast ? 10 : 5, fast ? "Fixed fast!" : "Fixed");
        hazard = "";
        draw();
      } else {
        g.bad("Wrong fix for this hazard!");
      }
    }
    function tick() {
      if (hazard != "") {
        stalls++;
        draw();
        g.after(tickMs, tick);
        return;
      }
      if (pipe[4] != 0) {
        finished++;
        g.good(10);
      }
      pipe.pop();
      pipe.unshift(nextId);
      nextId++;
      if (nextId > 5 && pipe[1] != 0 && Math.random() < 0.25) {
        hazard = (Math.random() < 0.5) ? "data" : "branch";
        hazardAt = Date.now();
      }
      tickMs = Math.max(480, tickMs - 6);
      draw();
      g.after(tickMs, tick);
    }
    g.onKey = function (k) {
      if (k == "1") { fix("data"); return true; }
      if (k == "2") { fix("branch"); return true; }
      return false;
    };
    draw();
    g.after(tickMs, tick);
  }
};

