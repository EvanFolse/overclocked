// =====================================================
// SAVE / LOAD / START UP
// =====================================================
function save() {
  try { localStorage.setItem("overclockedSave", JSON.stringify(game)); } catch (e) {}
}

function load() {
  try {
    var s = localStorage.getItem("overclockedSave");
    if (!s) { return; }
    var g = JSON.parse(s);
    var base = newGame();
    base.cp = g.cp || 0;
    base.earned = g.earned || 0;
    base.answers = g.answers || 0;
    base.right = g.right || 0;
    base.reduce = !!g.reduce;
    base.sound = (g.sound !== false);
    base.stars = g.stars || {};
    if (g.stages && g.stages.length == 5) { base.stages = g.stages; }
    for (var i = 0; i < PARTS.length; i++) {
      var k = PARTS[i].key;
      if (g.parts && g.parts[k]) {
        base.parts[k].on = !!g.parts[k].on;
        base.parts[k].level = g.parts[k].level || 1;
        base.parts[k].h = base.parts[k].on ? heightOf(base.parts[k].level) : 0;
      }
    }
    game = base;
  } catch (e) {}
}

function renderAll() {
  renderLeft();
  renderStats();
  renderHud();
  renderRight();
  drawChip();
}

// income: runs 10 times per second
setInterval(function () {
  gainCp(totalCps() / 10);
}, 100);

// the big CP number glides toward the real value
setInterval(function () {
  var diff = game.cp - shownCp;
  if (Math.abs(diff) < 1) { shownCp = game.cp; } else { shownCp += diff * 0.25; }
  el("cp").innerHTML = fmt(shownCp) + " CP";
  // refresh the upgrade list only when a button becomes affordable (or not)
  if (!G && !view && tab == "upgrades") {
    var key = "";
    for (var i = 0; i < PARTS.length; i++) {
      var p = game.parts[PARTS[i].key];
      if (p.on && p.level < 5 && game.cp >= upCost(PARTS[i].key)) { key += PARTS[i].key + ","; }
    }
    if (key != lastAfford) {
      lastAfford = key;
      renderRight();
    }
  }
}, 60);

setInterval(save, 5000);

load();
shownCp = game.cp;
applyMotion();
renderAll();
