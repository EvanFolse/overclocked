// =====================================================
// GAME STATE
// =====================================================
var game = newGame();
var tab = "upgrades";
var learnOpen = "";
var selected = "";
var hot = "";
var G = null;      // the minigame being played (or null)
var view = null;   // the stage hub being shown (or null)
var shownCp = 0;
var animOn = false;
var lastAfford = "";
var resetArmed = false;

function newGame() {
  var g = { cp: 0, earned: 0, answers: 0, right: 0, reduce: false, sound: true, stars: {}, parts: {}, stages: ["open", "locked", "locked", "locked", "locked"] };
  for (var i = 0; i < PARTS.length; i++) {
    g.parts[PARTS[i].key] = { on: false, level: 1, h: 0 };
  }
  return g;
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) { arr.sort(function () { return Math.random() - 0.5; }); return arr; }
function fmt(n) { return Math.floor(n).toLocaleString(); }
function el(id) { return document.getElementById(id); }

function heightOf(level) { return 10 + level * 5; }
function upCost(key) { return Math.floor(PART[key].cost * Math.pow(1.9, game.parts[key].level - 1)); }

function lvl(key) { return game.parts[key].on ? game.parts[key].level : 0; }
function totalCps() {
  var t = 0;
  for (var i = 0; i < PARTS.length; i++) {
    var p = game.parts[PARTS[i].key];
    if (p.on) { t += PARTS[i].cps * p.level; }
  }
  return t;
}
function totalLevels() {
  var t = 0;
  for (var i = 0; i < PARTS.length; i++) {
    var p = game.parts[PARTS[i].key];
    if (p.on) { t += p.level; }
  }
  return t;
}
function clickPower() { return 1 + totalLevels(); }
function gainCp(n) { game.cp += n; game.earned += n; }

// stats shown under the chip
function bitsNow() { return lvl("alu") > 0 ? [4, 8, 16, 32, 64][lvl("alu") - 1] : 0; }
function clockMHz() { return lvl("clock") > 0 ? [5, 33, 200, 1500, 4500][lvl("clock") - 1] : 0; }
function coresNow() { return lvl("cores") > 0 ? [1, 2, 4, 8, 16][lvl("cores") - 1] : 1; }
function flopsNow() { return lvl("fpu") > 0 ? [0.5, 5, 50, 500, 5000][lvl("fpu") - 1] * coresNow() : 0; }
function instrNow() {
  var n = lvl("alu") > 0 ? [4, 16, 48, 120, 300][lvl("alu") - 1] : 0;
  if (lvl("decoder") > 0) { n += [10, 30, 80, 160, 300][lvl("decoder") - 1]; }
  return n;
}

