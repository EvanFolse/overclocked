// =====================================================
// MINIGAME ENGINE
// Every part has a minigame. The engine gives each one an intro screen,
// a timer, a score, a combo meter, sound, stars and a results screen.
// =====================================================
var GAMES = {};
var audioCtx = null;

// a quick beep for hits and misses
function beep(freq, ms) {
  if (!game.sound) { return; }
  try {
    if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    var o = audioCtx.createOscillator();
    var vol = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    vol.gain.value = 0.05;
    o.connect(vol);
    vol.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + ms / 1000);
  } catch (e) {}
}

// make an element, put it inside a parent, and return it
function mk(parent, tag, cls, html) {
  var e = document.createElement(tag);
  if (cls) { e.className = cls; }
  if (html !== undefined) { e.innerHTML = html; }
  parent.appendChild(e);
  return e;
}

function starsText(key) {
  var n = game.stars[key] || 0;
  var s = "";
  for (var i = 0; i < 3; i++) { s += (i < n) ? "★" : "☆"; }
  return s;
}

function stopGameTimers(g) {
  if (!g) { return; }
  for (var i = 0; i < g.ids.length; i++) {
    clearInterval(g.ids[i]);
    clearTimeout(g.ids[i]);
  }
  g.ids = [];
  g.running = false;
}

function toggleSound() {
  game.sound = !game.sound;
  renderRight();
}

// ---------- stage hub (list of the minigames in a stage) ----------
function openHub(i) {
  if (game.stages[i] == "locked") { toast("Build every part in the previous stage to unlock this one."); return; }
  if (G) { stopGameTimers(G); G = null; }
  view = { type: "hub", stage: i };
  renderRight();
}

function closeHub() {
  view = null;
  renderRight();
}

function renderHub() {
  var i = view.stage;
  var st = STAGES[i];
  var h = "<div class='rhead'><span>STAGE " + (i + 1) + " · " + st.name.toUpperCase() + "</span><button class='ghost' onclick='closeHub()'>✕</button></div>";
  h += "<p class='muted' style='margin-top:14px'>" + st.blurb + "</p>";
  for (var j = 0; j < st.parts.length; j++) {
    var key = st.parts[j];
    var P = PART[key];
    var on = game.parts[key].on;
    h += "<div class='part'><div class='top'><div><span class='swatch' style='background:" + P.color + "'></span><span class='nm'>" + GAMES[key].icon + " " + GAMES[key].title + "</span></div><span class='mono'>" + starsText(key) + "</span></div>";
    h += "<div class='muted'>" + (on ? P.name + " is built. Play to earn CP!" : "Earn ★ to build the " + P.name + ".") + "</div>";
    h += "<button class='btn' onclick=\"openGame('" + key + "','hub')\">▶ " + (on ? "Play" : "Play to build") + "</button></div>";
  }
  el("rbody").innerHTML = h;
}

// ---------- starting a game ----------
function openGame(key, back) {
  if (G) { stopGameTimers(G); }
  var def = GAMES[key];
  G = { key: key, def: def, back: back, score: 0, combo: 0, best: 0, left: def.time, running: false, ended: false, ids: [], onKey: null };
  makeApi(G);
  el("tabs").style.display = "none";
  var h = "<div class='rhead'><span>" + def.icon + " " + def.title + "</span><button class='ghost' onclick='quitGame()'>✕ Quit</button></div>";
  h += "<div class='gbar'><div id='gTime'></div></div>";
  h += "<div class='gstats'><span>SCORE <b id='gScore'>0</b></span><span id='gCombo'></span><span id='gInfo'></span></div>";
  h += "<div id='arena' class='arena'></div>";
  el("rbody").innerHTML = h;
  G.arena = el("arena");
  showIntro();
}

function quitGame() {
  if (G) {
    stopGameTimers(G);
    if (G.back == "upgrades") { view = null; tab = "upgrades"; }
  }
  G = null;
  renderRight();
}

function showIntro() {
  var g = G;
  var def = g.def;
  var P = PART[g.key];
  var ov = mk(g.arena, "div", "overlay", "");
  var line = game.parts[g.key].on ? "Earn CP and stars!" : "Earn ★ to build the <b>" + P.name + "</b>!";
  ov.innerHTML = "<div class='bigicon'>" + def.icon + "</div><div class='otitle'>" + def.title + "</div><div class='orule'>" + def.rule + "</div>" +
    "<div class='ostars'>★ " + def.stars[0] + " &nbsp; ★★ " + def.stars[1] + " &nbsp; ★★★ " + def.stars[2] + "</div><div>" + line + "</div>";
  var pb = mk(ov, "button", "bigbtn", "▶ PLAY");
  pb.onclick = beginPlay;
}

function beginPlay() {
  var g = G;
  g.arena.innerHTML = "";
  g.score = 0;
  g.combo = 0;
  g.best = 0;
  g.left = g.def.time;
  g.running = true;
  g.ended = false;
  hudUpdate(g);
  if (g.def.time > 0) {
    g.every(100, function () {
      g.left -= 0.1;
      g.setBar(g.left / g.def.time);
      if (g.left <= 0) { endGame(); }
    });
  } else {
    g.setBar(0);
  }
  g.def.start(g, g.arena);
}

function hudUpdate(g) {
  if (!el("gScore")) { return; }
  el("gScore").innerHTML = g.score;
  var t = "";
  if (g.combo >= 2) { t = "🔥 COMBO " + g.combo + (g.mult() > 1 ? " · x" + g.mult() : ""); }
  el("gCombo").innerHTML = t;
}

// functions every minigame can use
function makeApi(g) {
  // repeat something while the game runs
  g.every = function (ms, fn) {
    var id = setInterval(function () { if (G === g && g.running) { fn(); } }, ms);
    g.ids.push(id);
    return id;
  };
  // do something once, later
  g.after = function (ms, fn) {
    var id = setTimeout(function () { if (G === g && g.running) { fn(); } }, ms);
    g.ids.push(id);
    return id;
  };
  // combo multiplier: x1, x1.5, x2 ... up to x3
  g.mult = function () { return 1 + Math.min(4, Math.floor(g.combo / 4)) * 0.5; };
  g.pop = function (text) {
    if (!g.arena) { return; }
    var p = mk(g.arena, "div", "gpop", text);
    p.style.left = (35 + Math.random() * 30) + "%";
    p.style.top = (38 + Math.random() * 16) + "%";
    setTimeout(function () { if (p.parentNode) { p.parentNode.removeChild(p); } }, 800);
  };
  g.say = function (html, cls) {
    if (!g.arena) { return; }
    var old = g.arena.querySelector(".gtoast");
    if (old) { old.parentNode.removeChild(old); }
    var t = mk(g.arena, "div", "gtoast " + (cls || ""), html);
    setTimeout(function () { if (t.parentNode) { t.parentNode.removeChild(t); } }, 1100);
  };
  // a good move
  g.good = function (points, msg) {
    g.combo++;
    if (g.combo > g.best) { g.best = g.combo; }
    var pts = Math.round(points * g.mult());
    g.score += pts;
    g.pop("+" + pts);
    beep(520 + Math.min(g.combo, 12) * 35, 90);
    if (msg) { g.say(msg, "good"); }
    hudUpdate(g);
  };
  // a mistake: combo resets and the screen shakes
  g.bad = function (msg) {
    g.combo = 0;
    beep(170, 150);
    g.arena.classList.add("shake");
    setTimeout(function () { g.arena.classList.remove("shake"); }, 300);
    if (msg) { g.say(msg, "bad"); }
    hudUpdate(g);
  };
  g.setBar = function (f) {
    var bar = el("gTime");
    if (bar) { bar.style.width = Math.max(0, Math.min(1, f)) * 100 + "%"; }
  };
  g.info = function (text) {
    if (el("gInfo")) { el("gInfo").innerHTML = text; }
  };
  g.finish = function () { endGame(); };
}

// keyboard shortcuts for the running game
document.addEventListener("keydown", function (e) {
  if (G && G.running && G.onKey) {
    if (G.onKey(e.key)) { e.preventDefault(); }
  }
});

// ---------- when a game ends ----------
function endGame() {
  var g = G;
  if (!g || g.ended) { return; }
  g.ended = true;
  stopGameTimers(g);
  g.setBar(0);

  var stars = 0;
  for (var i = 0; i < 3; i++) {
    if (g.score >= g.def.stars[i]) { stars = i + 1; }
  }
  var key = g.key;
  var P = PART[key];
  var wasOn = game.parts[key].on;
  var level = wasOn ? game.parts[key].level : 1;
  var pay = Math.round(P.cost * 0.3 * stars * (1 + 0.15 * (level - 1)));
  if (game.stars[key] === undefined || stars > game.stars[key]) { game.stars[key] = stars; }
  gainCp(pay);

  var installed = false;
  if (stars >= 1 && !wasOn) {
    installPart(key);
    setHot(key);
    installed = true;
  }
  var stageMsg = checkStages();
  renderHud();

  var starTxt = "";
  for (var s = 0; s < 3; s++) { starTxt += (s < stars) ? "⭐" : "☆"; }
  var ov = mk(g.arena, "div", "overlay", "");
  var html = "<div class='stars'>" + starTxt + "</div><div class='otitle'>" + (stars > 0 ? "NICE!" : "TRY AGAIN") + "</div>";
  html += "<div>Score <b>" + g.score + "</b> · best combo <b>" + g.best + "</b></div><div class='gain'>+" + fmt(pay) + " CP</div>";
  if (installed) { html += "<div class='inst'>🎉 " + P.name + " built! Watch it rise on the chip.</div>"; }
  if (stageMsg != "") { html += "<div class='inst'>🏁 " + stageMsg + "</div>"; }
  if (stars == 0 && !wasOn) { html += "<div class='muted'>Reach ★ " + g.def.stars[0] + " to build this part.</div>"; }
  html += "<div class='muted' style='max-width:300px'>" + g.def.takeaway + "</div>";
  ov.innerHTML = html;
  var again = mk(ov, "button", "bigbtn", "↻ Play again");
  again.onclick = function () { openGame(key, g.back); };
  var back = mk(ov, "button", "ghost", "Back");
  back.onclick = quitGame;
}

// a stage is complete when every part in it is built
function checkStages() {
  var msg = "";
  for (var i = 0; i < STAGES.length; i++) {
    if (game.stages[i] != "open") { continue; }
    var all = true;
    for (var j = 0; j < STAGES[i].parts.length; j++) {
      if (!game.parts[STAGES[i].parts[j]].on) { all = false; }
    }
    if (all) {
      game.stages[i] = "passed";
      if (i + 1 < STAGES.length && game.stages[i + 1] == "locked") { game.stages[i + 1] = "open"; }
      var bonus = (i + 1) * 150;
      gainCp(bonus);
      msg += "Stage " + (i + 1) + " complete! +" + bonus + " CP. ";
    }
  }
  renderLeft();
  return msg;
}

