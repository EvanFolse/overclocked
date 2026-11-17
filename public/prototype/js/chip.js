// =====================================================
// 3D (isometric) CHIP DRAWING
// =====================================================
var OX = 360, OY = 95, K = 0.8;

function iso(x, y, z) {
  return [OX + (x - y) * 0.866 * K, OY + (x + y) * 0.5 * K - z * K];
}

function pts(list) {
  var s = "";
  for (var i = 0; i < list.length; i++) {
    var p = iso(list[i][0], list[i][1], list[i][2]);
    s += p[0].toFixed(1) + "," + p[1].toFixed(1) + " ";
  }
  return s;
}

function poly(list, fill, extra) {
  return '<polygon points="' + pts(list) + '" fill="' + fill + '" ' + (extra || "") + '/>';
}

function line3(a, b, cls, extra) {
  var p = iso(a[0], a[1], a[2]);
  var q = iso(b[0], b[1], b[2]);
  return '<line class="' + cls + '" x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '" ' + (extra || "") + '/>';
}

// a box has a left face, a right face and a top face
function box(x, y, w, d, z0, h, top, left, right, extra) {
  var z1 = z0 + h;
  var s = "";
  s += poly([[x, y + d, z1], [x + w, y + d, z1], [x + w, y + d, z0], [x, y + d, z0]], left, extra);
  s += poly([[x + w, y, z1], [x + w, y + d, z1], [x + w, y + d, z0], [x + w, y, z0]], right, extra);
  s += poly([[x, y, z1], [x + w, y, z1], [x + w, y + d, z1], [x, y + d, z1]], top, extra);
  return s;
}

// lighten (amt > 0) or darken (amt < 0) a hex color
function shade(hex, amt) {
  var n = parseInt(hex.slice(1), 16);
  var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  function f(v) {
    if (amt > 0) { return Math.round(v + (255 - v) * amt); }
    return Math.round(v * (1 + amt));
  }
  return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")";
}

// is box a behind box b (so it should be drawn first)?
function behind(a, b) {
  return (a.x + a.w <= b.x) || (a.y + a.d <= b.y);
}

function sortBoxes(list) {
  var out = [];
  var rest = list.slice();
  while (rest.length > 0) {
    var pick = 0;
    for (var i = 0; i < rest.length; i++) {
      var blocked = false;
      for (var j = 0; j < rest.length; j++) {
        if (i != j && behind(rest[j], rest[i]) && !behind(rest[i], rest[j])) { blocked = true; break; }
      }
      if (!blocked) { pick = i; break; }
    }
    out.push(rest[pick]);
    rest.splice(pick, 1);
  }
  return out;
}

function drawChip() {
  var s = "<defs>";
  s += '<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>';
  for (var i = 0; i < PARTS.length; i++) {
    var c = PARTS[i].color;
    s += '<linearGradient id="g_' + PARTS[i].key + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + shade(c, 0.5) + '"/><stop offset="1" stop-color="' + c + '"/></linearGradient>';
  }
  s += '<linearGradient id="gpcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9bdcb4"/><stop offset="1" stop-color="#6cc08f"/></linearGradient>';
  s += '<linearGradient id="gslab" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5f7fa"/><stop offset="1" stop-color="#d9dfe7"/></linearGradient>';
  s += '<linearGradient id="gdie" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#33409a"/><stop offset="1" stop-color="#1c2468"/></linearGradient>';
  s += "</defs>";

  // soft shadow on the "table"
  s += poly([[-10, -10, -6], [480, -10, -6], [480, 480, -6], [-10, 480, -6]], "rgba(40, 70, 110, 0.32)", 'filter="url(#soft)"');

  var pinStroke = 'stroke="#b88a1f" stroke-width="0.6"';
  var n, y0, x0;

  // back pins (drawn before the board so the board covers their ends)
  for (n = 0; n < 12; n++) {
    y0 = 14 + n * 36;
    s += poly([[-58, y0, 3], [-38, y0, 3], [-38, y0 + 12, 3], [-58, y0 + 12, 3]], "#e9bd4f", pinStroke);
    x0 = 14 + n * 36;
    s += poly([[x0, -58, 3], [x0 + 12, -58, 3], [x0 + 12, -38, 3], [x0, -38, 3]], "#e9bd4f", pinStroke);
  }

  // circuit board
  s += box(-40, -40, 480, 480, 0, 8, "url(#gpcb)", "#4fa574", "#3f8f62", 'stroke="rgba(255,255,255,0.35)" stroke-width="0.8" stroke-linejoin="round"');

  // copper traces on the board
  for (n = 0; n < 12; n++) {
    y0 = 20 + n * 36;
    s += line3([-36, y0, 8], [-20, y0, 8], "", 'stroke="#5fb583" stroke-width="1.8"');
    s += line3([420, y0, 8], [436, y0, 8], "", 'stroke="#5fb583" stroke-width="1.8"');
    x0 = 20 + n * 36;
    s += line3([x0, -36, 8], [x0, -20, 8], "", 'stroke="#5fb583" stroke-width="1.8"');
    s += line3([x0, 420, 8], [x0, 436, 8], "", 'stroke="#5fb583" stroke-width="1.8"');
  }

  // front pins
  for (n = 0; n < 12; n++) {
    y0 = 14 + n * 36;
    s += poly([[438, y0, 3], [458, y0, 3], [458, y0 + 12, 3], [438, y0 + 12, 3]], "#f3cd63", pinStroke);
    x0 = 14 + n * 36;
    s += poly([[x0, 438, 3], [x0 + 12, 438, 3], [x0 + 12, 458, 3], [x0, 458, 3]], "#f3cd63", pinStroke);
  }

  // package slab and silicon die
  s += box(-20, -20, 440, 440, 8, 6, "url(#gslab)", "#c6cdd7", "#aeb7c3", 'stroke="rgba(255,255,255,0.5)" stroke-width="0.8"');
  s += box(0, 0, 400, 400, 14, 4, "url(#gdie)", "#161c52", "#10153f", 'stroke="rgba(150,170,255,0.4)" stroke-width="0.8"');

  // faint grid on the die
  for (n = 1; n < 8; n++) {
    s += line3([n * 50, 0, 18], [n * 50, 400, 18], "", 'stroke="rgba(255,255,255,0.07)" stroke-width="1"');
    s += line3([0, n * 50, 18], [400, n * 50, 18], "", 'stroke="rgba(255,255,255,0.07)" stroke-width="1"');
  }

  // wires between parts
  var wires = [["clock", "cu"], ["cu", "regs"], ["cu", "alu"], ["cu", "decoder"], ["alu", "fpu"], ["regs", "pipe"], ["alu", "pipe"], ["pipe", "l1"], ["pipe", "cores"], ["l1", "l2"], ["cores", "l2"]];
  for (i = 0; i < wires.length; i++) {
    var a = PART[wires[i][0]];
    var b = PART[wires[i][1]];
    var ax = (a.slot[0] + a.slot[2] / 2) * 50, ay = (a.slot[1] + a.slot[3] / 2) * 50;
    var bx = (b.slot[0] + b.slot[2] / 2) * 50, by = (b.slot[1] + b.slot[3] / 2) * 50;
    var live = (game.parts[a.key].on && game.parts[b.key].on) ? " live" : "";
    s += line3([ax, ay, 18], [bx, by, 18], "trace" + live);
  }

  // empty slots (locked parts) as dashed outlines
  for (i = 0; i < PARTS.length; i++) {
    var P = PARTS[i];
    if (game.parts[P.key].on) { continue; }
    var sx = P.slot[0] * 50 + 3, sy = P.slot[1] * 50 + 3, sw = P.slot[2] * 50 - 6, sd = P.slot[3] * 50 - 6;
    var tip = P.name + " (unlocks in Stage " + P.stage + ")";
    s += '<g class="slotg" onclick="clickSlot(\'' + P.key + '\')"><title>' + tip + '</title>';
    s += poly([[sx, sy, 18], [sx + sw, sy, 18], [sx + sw, sy + sd, 18], [sx, sy + sd, 18]], "rgba(255,255,255,0.05)", 'stroke="rgba(255,255,255,0.35)" stroke-width="1.2" stroke-dasharray="5 4"');
    var cc = iso(sx + sw / 2, sy + sd / 2, 18);
    s += '<text x="' + cc[0].toFixed(1) + '" y="' + (cc[1] + 4).toFixed(1) + '" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.5)" font-family="ui-monospace,Menlo,monospace">' + P.short + '</text>';
    s += "</g>";
  }

  // installed parts as 3D boxes, back to front
  var list = [];
  for (i = 0; i < PARTS.length; i++) {
    var Q = PARTS[i];
    if (game.parts[Q.key].on) {
      list.push({ key: Q.key, x: Q.slot[0] * 50 + 3, y: Q.slot[1] * 50 + 3, w: Q.slot[2] * 50 - 6, d: Q.slot[3] * 50 - 6, h: game.parts[Q.key].h });
    }
  }
  list = sortBoxes(list);
  for (i = 0; i < list.length; i++) {
    var B = list[i];
    var info = PART[B.key];
    var col = info.color;
    var isSel = (selected == B.key);
    var stroke = isSel ? 'stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round"' : 'stroke="rgba(255,255,255,0.45)" stroke-width="0.8" stroke-linejoin="round"';
    var cls = "partg" + (hot == B.key ? " hot" : "");
    s += '<g class="' + cls + '" onclick="clickPart(\'' + B.key + '\')"><title>' + info.name + '</title>';
    s += box(B.x, B.y, B.w, B.d, 18, B.h, "url(#g_" + B.key + ")", shade(col, -0.25), shade(col, -0.42), stroke);
    var top = iso(B.x + B.w / 2, B.y + B.d / 2, 18 + B.h);
    var lab = 'font-family="ui-monospace,Menlo,monospace" text-anchor="middle" fill="#fff" stroke="rgba(0,0,0,0.35)" stroke-width="2.4" paint-order="stroke" font-weight="800"';
    s += '<text x="' + top[0].toFixed(1) + '" y="' + (top[1] + 2).toFixed(1) + '" font-size="13" ' + lab + '>' + info.short + '</text>';
    s += '<text x="' + top[0].toFixed(1) + '" y="' + (top[1] + 14).toFixed(1) + '" font-size="9" ' + lab + '>Lv ' + game.parts[B.key].level + '</text>';
    s += "</g>";
  }

  el("chip").innerHTML = s;
}

// parts grow taller when upgraded, and rise when installed
function kickAnim() {
  if (!animOn) {
    animOn = true;
    requestAnimationFrame(animStep);
  }
}

function animStep() {
  var moving = false;
  for (var i = 0; i < PARTS.length; i++) {
    var p = game.parts[PARTS[i].key];
    if (!p.on) { continue; }
    var target = heightOf(p.level);
    var d = target - p.h;
    if (game.reduce || Math.abs(d) <= 0.4) {
      p.h = target;
    } else {
      p.h += d * 0.14;
      moving = true;
    }
  }
  drawChip();
  if (moving) {
    requestAnimationFrame(animStep);
  } else {
    animOn = false;
  }
}

function setHot(key) {
  hot = key;
  drawChip();
  setTimeout(function () {
    if (hot == key) { hot = ""; drawChip(); }
  }, 2600);
}

function installPart(key) {
  var p = game.parts[key];
  if (p.on) { return; }
  p.on = true;
  p.level = 1;
  p.h = 0;
  kickAnim();
  renderLeft();
  renderStats();
  renderHud();
}

