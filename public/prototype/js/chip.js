// chip.js: Isometric 3D chip drawing, install animation, fault diagnosis
// ---------------------------------------------------------
var OX = 360, OY = 95, K = 0.8;
function iso(x, y, z) { return [OX + (x - y) * 0.866 * K, OY + (x + y) * 0.5 * K - z * K]; }
function pts(l) { var s = ""; for (var i = 0; i < l.length; i++) { var p = iso(l[i][0], l[i][1], l[i][2]); s += p[0].toFixed(1) + "," + p[1].toFixed(1) + " "; } return s; }
function poly(l, f, e) { return '<polygon points="' + pts(l) + '" fill="' + f + '" ' + (e || "") + '/>'; }
function line3(a, b, c, e) { var p = iso(a[0], a[1], a[2]), q = iso(b[0], b[1], b[2]); return '<line class="' + c + '" x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '" ' + (e || "") + '/>'; }
function box(x, y, w, d, z0, h, t, l, r, e) { var z1 = z0 + h, s = ""; s += poly([[x, y + d, z1], [x + w, y + d, z1], [x + w, y + d, z0], [x, y + d, z0]], l, e); s += poly([[x + w, y, z1], [x + w, y + d, z1], [x + w, y + d, z0], [x + w, y, z0]], r, e); s += poly([[x, y, z1], [x + w, y, z1], [x + w, y + d, z1], [x, y + d, z1]], t, e); return s; }
function shade(hex, amt) { var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; function f(v) { return amt > 0 ? Math.round(v + (255 - v) * amt) : Math.round(v * (1 + amt)); } return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")"; }
function behind(a, b) { return (a.x + a.w <= b.x) || (a.y + a.d <= b.y); }
function sortBoxes(list) { var out = [], rest = list.slice(); while (rest.length > 0) { var pick = 0; for (var i = 0; i < rest.length; i++) { var bl = false; for (var j = 0; j < rest.length; j++)if (i != j && behind(rest[j], rest[i]) && !behind(rest[i], rest[j])) { bl = true; break; } if (!bl) { pick = i; break; } } out.push(rest[pick]); rest.splice(pick, 1); } return out; }
function buildChipSvg(opts) {
    var inter = opts.interactive, onMap = opts.onMap, lvMap = opts.lvMap, uid = inter ? "" : "m_";
    var s = "<defs><filter id='" + uid + "soft' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='14'/></filter>";
    for (var i = 0; i < PARTS.length; i++) { var c = PARTS[i].color; s += '<linearGradient id="' + uid + 'g_' + PARTS[i].key + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + shade(c, 0.5) + '"/><stop offset="1" stop-color="' + c + '"/></linearGradient>'; }
    s += '<linearGradient id="' + uid + 'gpcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9bdcb4"/><stop offset="1" stop-color="#6cc08f"/></linearGradient><linearGradient id="' + uid + 'gslab" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f5f7fa"/><stop offset="1" stop-color="#d9dfe7"/></linearGradient><linearGradient id="' + uid + 'gdie" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#33409a"/><stop offset="1" stop-color="#1c2468"/></linearGradient></defs>';
    s += poly([[-10, -10, -6], [480, -10, -6], [480, 480, -6], [-10, 480, -6]], "rgba(40,70,110,0.32)", 'filter="url(#' + uid + 'soft)"');
    var ps = 'stroke="#b88a1f" stroke-width="0.6"', n, y0, x0;
    for (n = 0; n < 12; n++) { y0 = 14 + n * 36; s += poly([[-58, y0, 3], [-38, y0, 3], [-38, y0 + 12, 3], [-58, y0 + 12, 3]], "#e9bd4f", ps); x0 = 14 + n * 36; s += poly([[x0, -58, 3], [x0 + 12, -58, 3], [x0 + 12, -38, 3], [x0, -38, 3]], "#e9bd4f", ps); }
    s += box(-40, -40, 480, 480, 0, 8, "url(#" + uid + "gpcb)", "#4fa574", "#3f8f62", 'stroke="rgba(255,255,255,0.35)" stroke-width="0.8" stroke-linejoin="round"');
    for (n = 0; n < 12; n++) { y0 = 20 + n * 36; s += line3([-36, y0, 8], [-20, y0, 8], "", 'stroke="#5fb583" stroke-width="1.8"'); s += line3([420, y0, 8], [436, y0, 8], "", 'stroke="#5fb583" stroke-width="1.8"'); x0 = 20 + n * 36; s += line3([x0, -36, 8], [x0, -20, 8], "", 'stroke="#5fb583" stroke-width="1.8"'); s += line3([x0, 420, 8], [x0, 436, 8], "", 'stroke="#5fb583" stroke-width="1.8"'); }
    for (n = 0; n < 12; n++) { y0 = 14 + n * 36; s += poly([[438, y0, 3], [458, y0, 3], [458, y0 + 12, 3], [438, y0 + 12, 3]], "#f3cd63", ps); x0 = 14 + n * 36; s += poly([[x0, 438, 3], [x0 + 12, 438, 3], [x0 + 12, 458, 3], [x0, 458, 3]], "#f3cd63", ps); }
    s += box(-20, -20, 440, 440, 8, 6, "url(#" + uid + "gslab)", "#c6cdd7", "#aeb7c3", 'stroke="rgba(255,255,255,0.5)" stroke-width="0.8"');
    s += box(0, 0, 400, 400, 14, 4, "url(#" + uid + "gdie)", "#161c52", "#10153f", 'stroke="rgba(150,170,255,0.4)" stroke-width="0.8"');
    for (n = 1; n < 8; n++) { s += line3([n * 50, 0, 18], [n * 50, 400, 18], "", 'stroke="rgba(255,255,255,0.07)" stroke-width="1"'); s += line3([0, n * 50, 18], [400, n * 50, 18], "", 'stroke="rgba(255,255,255,0.07)" stroke-width="1"'); }
    var wires = [["clock", "cu"], ["cu", "regs"], ["cu", "alu"], ["cu", "decoder"], ["alu", "fpu"], ["regs", "pipe"], ["alu", "pipe"], ["pipe", "l1"], ["pipe", "cores"], ["l1", "l2"], ["cores", "l2"]];
    for (i = 0; i < wires.length; i++) { var a = PART[wires[i][0]], b = PART[wires[i][1]]; s += line3([(a.slot[0] + a.slot[2] / 2) * 50, (a.slot[1] + a.slot[3] / 2) * 50, 18], [(b.slot[0] + b.slot[2] / 2) * 50, (b.slot[1] + b.slot[3] / 2) * 50, 18], "trace" + ((onMap[a.key] && onMap[b.key]) ? " live" : "")); }
    for (i = 0; i < PARTS.length; i++) {
        var P = PARTS[i]; if (onMap[P.key]) continue;
        var sx = P.slot[0] * 50 + 3, sy = P.slot[1] * 50 + 3, sw = P.slot[2] * 50 - 6, sd = P.slot[3] * 50 - 6;
        s += (inter ? '<g class="slotg" onclick="clickSlot(\'' + P.key + '\')"><title>' + P.name + ' (Stage ' + P.stage + ')</title>' : '<g>') + poly([[sx, sy, 18], [sx + sw, sy, 18], [sx + sw, sy + sd, 18], [sx, sy + sd, 18]], "rgba(255,255,255,0.05)", 'stroke="rgba(255,255,255,0.35)" stroke-width="1.2" stroke-dasharray="5 4"');
        var cc = iso(sx + sw / 2, sy + sd / 2, 18); s += '<text x="' + cc[0].toFixed(1) + '" y="' + (cc[1] + 4).toFixed(1) + '" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.5)" font-family="ui-monospace,Menlo,monospace">' + P.short + '</text></g>';
    }
    var list = [];
    for (i = 0; i < PARTS.length; i++) { var Q = PARTS[i]; if (onMap[Q.key]) list.push({ key: Q.key, x: Q.slot[0] * 50 + 3, y: Q.slot[1] * 50 + 3, w: Q.slot[2] * 50 - 6, d: Q.slot[3] * 50 - 6, h: inter ? game.parts[Q.key].h : heightOf(lvMap[Q.key] || 1) }); }
    list = sortBoxes(list);
    for (i = 0; i < list.length; i++) {
        var B = list[i], info = PART[B.key], col = info.color, stroke = (inter && selected == B.key) ? 'stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round"' : 'stroke="rgba(255,255,255,0.45)" stroke-width="0.8" stroke-linejoin="round"';
        s += (inter ? '<g class="partg' + (hot == B.key ? " hot" : "") + '" onclick="clickPart(\'' + B.key + '\')"><title>' + info.name + '</title>' : '<g>') + box(B.x, B.y, B.w, B.d, 18, B.h, "url(#" + uid + "g_" + B.key + ")", shade(col, -0.25), shade(col, -0.42), stroke);
        var top = iso(B.x + B.w / 2, B.y + B.d / 2, 18 + B.h), lab = 'font-family="ui-monospace,Menlo,monospace" text-anchor="middle" fill="#fff" stroke="rgba(0,0,0,0.35)" stroke-width="2.4" paint-order="stroke" font-weight="800"';
        s += '<text x="' + top[0].toFixed(1) + '" y="' + (top[1] + 2).toFixed(1) + '" font-size="13" ' + lab + '>' + info.short + '</text>';
        if (inter) s += '<text x="' + top[0].toFixed(1) + '" y="' + (top[1] + 14).toFixed(1) + '" font-size="9" ' + lab + '>Lv ' + game.parts[B.key].level + '</text>';
        s += '</g>';
    }
    return s;
}
function drawChip() { var m = {}; for (var i = 0; i < PARTS.length; i++)m[PARTS[i].key] = game.parts[PARTS[i].key].on; el("chip").innerHTML = buildChipSvg({ interactive: true, onMap: m }); }
function kickAnim() { if (!animOn) { animOn = true; requestAnimationFrame(animStep); } }
function animStep() { var mv = false; for (var i = 0; i < PARTS.length; i++) { var p = game.parts[PARTS[i].key]; if (!p.on) continue; var t = heightOf(p.level), d = t - p.h; if (game.reduce || Math.abs(d) <= 0.4) p.h = t; else { p.h += d * 0.14; mv = true; } } drawChip(); if (mv) requestAnimationFrame(animStep); else animOn = false; }
function setHot(k) { hot = k; drawChip(); setTimeout(function () { if (hot == k) { hot = ""; drawChip(); } }, 2600); }
function installPart(k) { var p = game.parts[k]; if (p.on) return; p.on = true; p.level = 1; p.h = 0; kickAnim(); renderLeft(); renderStats(); renderHud(); refreshDiagUi(); if (installedCount() === 2) setTimeout(spawnGoldenChip, 8000); }
function refreshDiagUi() {
    var ready = FAULTS.filter(function (f) { return game.parts[f.need] && game.parts[f.need].on; });
    el("diagBtn").classList.toggle("hidden", !(ready.length >= 2 && !activeFault));
    el("finaleBtn").classList.toggle("hidden", !allStagesPassed());
    var box = el("faultBanner");
    if (activeFault) { box.classList.remove("hidden"); box.innerHTML = "<span><b style='color:#b45309'>🚨 WHAT'S BROKEN?</b> " + activeFault.symptom + "</span><span class='mono' style='color:#4a47c8;font-size:11px;font-weight:700;white-space:nowrap'>CLICK 3D PART</span>"; }
    else box.classList.add("hidden");
}
function triggerFault() {
    var pool = FAULTS.filter(function (f) { return game.parts[f.need] && game.parts[f.need].on; }); if (pool.length < 2) { toast("Build at least 2 parts first!"); return; }
    activeFault = pool[rand(0, pool.length - 1)]; activeFault.firstTry = true; refreshDiagUi();
    BOT.say("🚨 Fault alert! Read the symptom above the chip and click the failing 3D component.", "alert", "warn"); beep(300, 120);
}
