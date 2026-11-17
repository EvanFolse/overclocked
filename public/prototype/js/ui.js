// =====================================================
// LEFT SIDE: stages and tutor
// =====================================================
function renderLeft() {
  var h = "";
  for (var i = 0; i < STAGES.length; i++) {
    var st = game.stages[i];
    var sub = "Locked";
    if (st == "open") { sub = (i == 0 && !game.parts.cu.on) ? "Open · play to build!" : "Open · play minigames"; }
    if (st == "passed") { sub = "Complete ✓ · replay for CP"; }
    h += "<div class='stagecard " + st + "' onclick='openHub(" + i + ")'>";
    h += "<div class='t'>" + (i + 1) + " · " + STAGES[i].name + "</div><div class='s'>" + sub + "</div></div>";
  }
  el("stageList").innerHTML = h;
}

function toggleTutor() {
  var box = el("tutor");
  if (!box.classList.contains("hidden")) { box.classList.add("hidden"); return; }
  var h = "<div class='label'>TUTOR</div><p class='muted'>Pick a part and I will explain it in plain language.</p>";
  var any = false;
  for (var i = 0; i < PARTS.length; i++) {
    if (game.parts[PARTS[i].key].on) {
      any = true;
      h += "<button onclick=\"tutorSay('" + PARTS[i].key + "')\">" + PARTS[i].short + "</button>";
    }
  }
  if (!any) { h += "<p class='muted'>No parts yet. Pass Stage 1 to install your first parts!</p>"; }
  h += "<div id='tutorAns'></div>";
  box.innerHTML = h;
  box.classList.remove("hidden");
}

function tutorSay(key) {
  var p = PART[key];
  var h = "<p><b>" + p.name + "</b></p><p class='muted'>" + p.what + "</p><p class='muted'><b>Think of it like this:</b> " + p.analogy + "</p>";
  el("tutorAns").innerHTML = h;
  selected = key;
  drawChip();
}

// =====================================================
// CENTER: counters and stats
// =====================================================
function renderHud() {
  el("cps").innerHTML = "+" + totalCps().toFixed(1) + " CP/sec";
  el("build").innerHTML = "BUILD LEVEL " + totalLevels();
  el("clickVal").innerHTML = "+" + clickPower();
  var b = bitsNow();
  var era = "BARE SILICON";
  if (b > 0) { era = b + "-BIT PROCESSOR CLASS"; }
  el("era").innerHTML = era;
}

function renderStats() {
  var clock = "—";
  var m = clockMHz();
  if (m > 0) { clock = (m >= 1000) ? (m / 1000).toFixed(1) + " GHz" : m + " MHz"; }
  var flops = "—";
  var f = flopsNow();
  if (f > 0) { flops = (f >= 1000) ? (f / 1000).toFixed(1) + " GFLOPS" : f + " MFLOPS"; }
  var instr = instrNow() > 0 ? instrNow() : "—";
  var bits = bitsNow() > 0 ? bitsNow() + "-bit" : "—";
  var cards = [["CLOCK", clock], ["FLOPS", flops], ["INSTRUCTIONS", instr], ["BITS", bits], ["CORES", coresNow()]];
  var h = "";
  for (var i = 0; i < cards.length; i++) {
    h += "<div class='stat'><div class='k'>" + cards[i][0] + "</div><div class='v'>" + cards[i][1] + "</div></div>";
  }
  el("stats").innerHTML = h;
}

function runInstruction() {
  var v = clickPower();
  gainCp(v);
  var wrap = el("chipWrap");
  var f = document.createElement("div");
  f.className = "float";
  f.innerHTML = "+" + v;
  f.style.left = (38 + Math.random() * 24) + "%";
  f.style.top = (30 + Math.random() * 20) + "%";
  wrap.appendChild(f);
  setTimeout(function () { if (f.parentNode) { f.parentNode.removeChild(f); } }, 950);
}

function toast(msg) {
  var t = el("toast");
  t.innerHTML = msg;
  t.classList.add("show");
  setTimeout(function () { t.classList.remove("show"); }, 1800);
}

// clicking parts on the chip
function clickPart(key) {
  selected = key;
  if (!G && !view) {
    tab = "learning";
    learnOpen = key;
  }
  drawChip();
  renderRight();
}

function clickSlot(key) {
  toast("Locked: pass Stage " + PART[key].stage + " to install the " + PART[key].short);
}

// =====================================================
// RIGHT SIDE: tabs
// =====================================================
function setTab(t) {
  tab = t;
  if (G) { stopGameTimers(G); G = null; }
  view = null;
  renderRight();
}

function renderRight() {
  var tabs = ["upgrades", "learning", "progress", "settings"];
  for (var i = 0; i < tabs.length; i++) {
    el("tab_" + tabs[i]).className = (tabs[i] == tab && !G && !view) ? "on" : "";
  }
  el("tabs").style.display = (G || view) ? "none" : "flex";
  if (G) { return; }   // never redraw while a minigame is running
  if (view) { renderHub(); return; }
  if (tab == "upgrades") { renderUpgrades(); }
  if (tab == "learning") { renderLearning(); }
  if (tab == "progress") { renderProgress(); }
  if (tab == "settings") { renderSettings(); }
}

function renderUpgrades() {
  var h = "<h2 class='h'>UPGRADES</h2><p class='muted'>Spend CP to upgrade unlocked parts. Locked parts unlock by passing a stage round.</p>";
  var count = 0;
  for (var g = 1; g <= 5; g++) {
    var part = "";
    for (var i = 0; i < PARTS.length; i++) {
      var P = PARTS[i];
      if (P.stage != g || !game.parts[P.key].on) { continue; }
      count++;
      var p = game.parts[P.key];
      var next = (p.level < 5) ? "→ " + P.levels[p.level] : "Fully upgraded: " + P.levels[4];
      part += "<div class='part" + (selected == P.key ? " sel" : "") + "'><div class='top'><div><span class='swatch' style='background:" + P.color + "'></span><span class='nm'>" + P.name + "</span><span class='lv'>Lv " + p.level + "</span></div>";
      if (p.level < 5) {
        var cost = upCost(P.key);
        var can = game.cp >= cost ? " can" : "";
        part += "<button class='upg" + can + "' onclick=\"buyUpgrade('" + P.key + "')\">" + fmt(cost) + " CP</button>";
      } else {
        part += "<b class='mono' style='font-size:12px'>MAX</b>";
      }
      part += "</div><div class='muted'>" + P.desc + " +" + (P.cps * p.level) + " CP/sec</div><div class='nx'>" + next + "</div>";
      part += "<button class='btn' onclick=\"openGame('" + P.key + "','upgrades')\">▶ Play " + GAMES[P.key].title + " " + starsText(P.key) + "</button></div>";
    }
    if (part != "") { h += "<div class='label' style='margin-top:16px'>" + TAGS[g - 1] + "</div>" + part; }
  }
  if (count == 0) {
    h += "<div class='part'><b>No parts installed yet.</b><div class='muted'>Open Stage 1 on the left and play its minigames. Earn a star to build each part on your chip.</div></div>";
  }
  el("rbody").innerHTML = h;
}

function buyUpgrade(key) {
  var p = game.parts[key];
  var cost = upCost(key);
  if (game.cp < cost) { toast("Not enough CP yet. Click Execute or play a minigame!"); return; }
  game.cp -= cost;
  p.level++;
  kickAnim();
  renderHud();
  renderStats();
  renderRight();
}

function renderLearning() {
  var h = "<h2 class='h'>LEARNING</h2><p class='muted'>Plain-language notes on every part. Click a part on the chip to jump here.</p>";
  for (var i = 0; i < PARTS.length; i++) {
    var P = PARTS[i];
    var p = game.parts[P.key];
    h += "<div class='part" + (learnOpen == P.key ? " sel" : "") + "' style='cursor:pointer' onclick=\"openLearn('" + P.key + "')\">";
    if (!p.on) {
      h += "<span class='swatch' style='background:#c5ced8'></span><span class='nm' style='color:#8a99a8'>🔒 " + P.name + "</span><div class='muted'>Pass Stage " + P.stage + " to unlock.</div></div>";
      continue;
    }
    h += "<span class='swatch' style='background:" + P.color + "'></span><span class='nm'>" + P.name + "</span><span class='lv'>Lv " + p.level + "</span>";
    if (learnOpen == P.key) {
      h += "<p class='muted'>" + P.what + "</p><p class='muted'><b>Analogy:</b> " + P.analogy + "</p>";
      h += "<div class='nx'>Right now: " + P.levels[p.level - 1] + "</div>";
      if (p.level < 5) { h += "<div class='nx'>Next upgrade: " + P.levels[p.level] + "</div>"; }
    } else {
      h += "<div class='muted'>" + P.desc + "</div>";
    }
    h += "</div>";
  }
  el("rbody").innerHTML = h;
}

function openLearn(key) {
  learnOpen = (learnOpen == key) ? "" : key;
  if (game.parts[key].on) { selected = key; drawChip(); }
  renderRight();
}

function renderProgress() {
  var passed = 0, installed = 0;
  for (var i = 0; i < 5; i++) { if (game.stages[i] == "passed") { passed++; } }
  for (var j = 0; j < PARTS.length; j++) { if (game.parts[PARTS[j].key].on) { installed++; } }
  var starTotal = 0;
  for (var sk in game.stars) { starTotal += game.stars[sk]; }
  var next = "Max out your upgrades!";
  for (var k = 0; k < 5; k++) {
    if (game.stages[k] == "open") { next = "Play Stage " + (k + 1) + ": " + STAGES[k].name; break; }
  }
  var h = "<h2 class='h'>PROGRESS</h2>";
  h += "<div class='part'><b>Stages passed</b> " + passed + " / 5<div class='bar'><div style='width:" + (passed * 20) + "%'></div></div>";
  h += "<b>Parts installed</b> " + installed + " / " + PARTS.length + "<div class='bar'><div style='width:" + (installed * 100 / PARTS.length) + "%'></div></div>";
  h += "<b>Minigame stars</b> " + starTotal + " / " + (PARTS.length * 3) + "<div class='bar'><div style='width:" + (starTotal * 100 / (PARTS.length * 3)) + "%'></div></div></div>";
  h += "<div class='part'><b>Total CP earned</b><div class='mono' style='font-size:20px;color:#1f9d73'>" + fmt(game.earned) + "</div></div>";
  h += "<div class='part'><b>Next goal</b><div class='muted'>" + next + "</div></div>";
  el("rbody").innerHTML = h;
}

function renderSettings() {
  var h = "<h2 class='h'>SETTINGS</h2>";
  h += "<div class='part'><b>Reduce motion</b><div class='muted'>Turns off the floating chip, glowing wires and rising animations.</div>";
  h += "<button class='btn' onclick='toggleReduce()'>" + (game.reduce ? "Motion is OFF (click to turn on)" : "Motion is ON (click to turn off)") + "</button></div>";
  h += "<div class='part'><b>Sound effects</b><div class='muted'>Beeps for hits and misses in the minigames.</div>";
  h += "<button class='btn' onclick='toggleSound()'>" + (game.sound ? "Sound is ON (click to turn off)" : "Sound is OFF (click to turn on)") + "</button></div>";
  h += "<div class='part'><b>Save</b><div class='muted'>Your progress saves automatically in this browser.</div></div>";
  h += "<div class='part'><b>Reset everything</b><div class='muted'>Deletes your chip, CP and stage progress.</div><button class='btn' style='background:#c94a4a' onclick='resetGame()'>" + (resetArmed ? "Click again to DELETE everything" : "Reset game") + "</button></div>";
  el("rbody").innerHTML = h;
}

function toggleReduce() {
  game.reduce = !game.reduce;
  applyMotion();
  renderRight();
}

function applyMotion() {
  document.body.className = game.reduce ? "reduce" : "";
}

function resetGame() {
  // two-click confirm (no popup, so it works everywhere)
  if (!resetArmed) {
    resetArmed = true;
    renderRight();
    setTimeout(function () { resetArmed = false; if (!G && !view && tab == "settings") { renderRight(); } }, 4000);
    return;
  }
  resetArmed = false;
  try { localStorage.removeItem("overclockedSave"); } catch (e) {}
  if (G) { stopGameTimers(G); }
  G = null;
  view = null;
  game = newGame();
  selected = "";
  hot = "";
  tab = "upgrades";
  learnOpen = "";
  shownCp = 0;
  applyMotion();
  renderAll();
}

