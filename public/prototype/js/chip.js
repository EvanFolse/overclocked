// chip.js: Isometric 3D chip drawing, install animation, dismissible fault diagnosis
// Neon stylized educational CPU (visual redesign; interactions preserved)
// ---------------------------------------------------------
var OX = 360, OY = 95, K = 0.8;
function iso(x, y, z) { return [OX + (x - y) * 0.866 * K, OY + (x + y) * 0.5 * K - z * K]; }
function pts(l) { var s = ""; for (var i = 0; i < l.length; i++) { var p = iso(l[i][0], l[i][1], l[i][2]); s += p[0].toFixed(1) + "," + p[1].toFixed(1) + " "; } return s; }
function poly(l, f, e) { return '<polygon points="' + pts(l) + '" fill="' + f + '" ' + (e || "") + '/>'; }
function line3(a, b, c, e) { var p = iso(a[0], a[1], a[2]), q = iso(b[0], b[1], b[2]); return '<line class="' + c + '" x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '" ' + (e || "") + '/>'; }
function box(x, y, w, d, z0, h, t, l, r, e) { var z1 = z0 + h, s = ""; s += poly([[x, y + d, z1], [x + w, y + d, z1], [x + w, y + d, z0], [x, y + d, z0]], l, e); s += poly([[x + w, y, z1], [x + w, y + d, z1], [x + w, y + d, z0], [x + w, y, z0]], r, e); s += poly([[x, y, z1], [x + w, y, z1], [x + w, y + d, z1], [x, y + d, z1]], t, e); return s; }
function shade(hex, amt) { var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; function f(v) { return amt > 0 ? Math.round(v + (255 - v) * amt) : Math.round(v * (1 + amt)); } return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")"; }
function behind(a, b) { return (a.x + a.w <= b.x) || (a.y + a.d <= b.y); }
function sortBoxes(list) { var out = [], rest = list.slice(); while (rest.length > 0) { var pick = 0; for (var i = 0; i < rest.length; i++) { var bl = false; for (var j = 0; j < rest.length; j++) if (i != j && behind(rest[j], rest[i]) && !behind(rest[i], rest[j])) { bl = true; break; } if (!bl) { pick = i; break; } } out.push(rest[pick]); rest.splice(pick, 1); } return out; }

function topRect(x, y, w, d, z, fill, e) {
    return poly([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]], fill, e || 'stroke="rgba(255,255,255,0.28)" stroke-width="0.55"');
}
function topLine(x1, y1, x2, y2, z, stroke, w) {
    return line3([x1, y1, z], [x2, y2, z], "", 'stroke="' + stroke + '" stroke-width="' + (w || 1.25) + '" stroke-linecap="round"');
}
function topDot(x, y, z, r, fill) {
    var p = iso(x, y, z);
    return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r + '" fill="' + fill + '" stroke="rgba(255,255,255,0.45)" stroke-width="0.5"/>';
}
function topText(x, y, z, txt, size, fill) {
    var p = iso(x, y, z);
    return '<text x="' + p[0].toFixed(1) + '" y="' + p[1].toFixed(1) + '" text-anchor="middle" font-size="' + size + '" fill="' + fill + '" font-family="ui-monospace,Menlo,monospace" font-weight="800" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" paint-order="stroke">' + txt + '</text>';
}

// Neon educational surface motifs (stay inside footprint; labels drawn after).
function partDetails(key, x, y, w, d, z, col, lv) {
    var s = "", neon = shade(col, 0.55), mid = shade(col, 0.22), deep = shade(col, -0.32);
    var glow = shade(col, 0.7), ink = "rgba(255,255,255,0.72)", gold = "#f0c35a";
    var px = x + w * 0.09, py = y + d * 0.1, pw = w * 0.82, pd = d * 0.72;
    s += topRect(x + 1.5, y + 1.5, w - 3, d - 3, z + 0.12, mid, 'stroke="' + glow + '" stroke-width="0.7" stroke-opacity="0.55"');

    if (key === "cu") {
        var cx = x + w / 2, cy = y + d / 2, hub = Math.min(w, d) * 0.18;
        s += topRect(cx - hub, cy - hub, hub * 2, hub * 2, z + 0.4, deep);
        s += topRect(cx - hub * 0.55, cy - hub * 0.55, hub * 1.1, hub * 1.1, z + 0.55, neon);
        s += topDot(cx, cy, z + 0.7, 2.4, glow);
        var arms = [[0, -1], [0.85, -0.55], [1, 0.2], [0.55, 0.95], [-0.55, 0.95], [-1, 0.15], [-0.85, -0.55]];
        for (var a = 0; a < arms.length; a++) {
            var ax = cx + arms[a][0] * pw * 0.4, ay = cy + arms[a][1] * pd * 0.38;
            s += topLine(cx, cy, ax, ay, z + 0.58, gold, 1.15);
            s += topDot(ax, ay, z + 0.65, 1.55, neon);
        }
    } else if (key === "alu") {
        s += topRect(px, py, pw, pd, z + 0.32, deep);
        s += topText(x + w / 2, y + d * 0.42, z + 0.7, "+  −", 12, ink);
        s += topText(x + w / 2, y + d * 0.58, z + 0.7, "×  ÷", 11, ink);
        s += topLine(px, py + pd * 0.22, px + pw * 0.2, py + pd * 0.22, z + 0.5, gold, 1.2);
        s += topLine(px, py + pd * 0.78, px + pw * 0.2, py + pd * 0.78, z + 0.5, gold, 1.2);
        s += topLine(px + pw * 0.8, py + pd * 0.5, px + pw, py + pd * 0.5, z + 0.5, neon, 1.4);
    } else if (key === "regs") {
        var cols = 6, rows = 3, gw = pw / cols, gh = pd / rows;
        for (var ry = 0; ry < rows; ry++) for (var rx = 0; rx < cols; rx++) {
            var bx = px + rx * gw + gw * 0.28, by = py + ry * gh + 1.2, bw = gw * 0.42, bh = gh - 2.4;
            s += topRect(bx, by, bw, bh, z + 0.45, neon, 'stroke="' + glow + '" stroke-width="0.45"');
        }
    } else if (key === "clock") {
        var cx2 = x + w / 2, cy2 = y + d * 0.38;
        s += topDot(cx2, cy2, z + 0.65, Math.min(w, d) * 0.14, neon);
        s += topDot(cx2, cy2, z + 0.8, Math.min(w, d) * 0.06, glow);
        var wx0 = px, wy = py + pd * 0.78, step = pw / 8, amp = pd * 0.14;
        for (var wi = 0; wi < 8; wi++) {
            var xA = wx0 + wi * step, xB = wx0 + (wi + 1) * step, up = (wi % 2 === 0);
            var yHi = wy - amp, yLo = wy + amp * 0.35;
            s += topLine(xA, up ? yLo : yHi, xA, up ? yHi : yLo, z + 0.55, gold, 1.35);
            s += topLine(xA, up ? yHi : yLo, xB, up ? yHi : yLo, z + 0.55, gold, 1.35);
        }
        s += topLine(cx2, cy2, px + pw * 0.92, cy2, z + 0.55, neon, 1.1);
        s += topLine(cx2, cy2, px + pw * 0.08, py + pd * 0.08, z + 0.55, neon, 0.95);
    } else if (key === "pipe") {
        var stages = 5, sw = pw / stages;
        for (var si = 0; si < stages; si++) {
            s += topRect(px + si * sw + 1.2, py + pd * 0.12, sw - 2.4, pd * 0.76, z + 0.35, si % 2 ? neon : mid);
            if (si < stages - 1) {
                var mx = px + (si + 1) * sw, my = py + pd * 0.5;
                s += topText(mx, my + 1, z + 0.7, "›", 14, gold);
            }
        }
    } else if (key === "decoder") {
        // flowchart-style: bits → diamond → outs
        var bits = 6, bw = pw / bits;
        for (var bi = 0; bi < bits; bi++) s += topRect(px + bi * bw + 1, py, bw - 2, pd * 0.22, z + 0.4, (bi % 2) ? neon : deep);
        var dcx = x + w / 2, dcy = y + d * 0.52, hs = Math.min(pw, pd) * 0.16;
        s += poly([[dcx, dcy - hs, z + 0.5], [dcx + hs, dcy, z + 0.5], [dcx, dcy + hs, z + 0.5], [dcx - hs, dcy, z + 0.5]], neon, 'stroke="' + gold + '" stroke-width="0.7"');
        s += topLine(dcx, py + pd * 0.22, dcx, dcy - hs, z + 0.55, ink, 1.1);
        for (var bo = 0; bo < 3; bo++) {
            var ox = px + pw * (0.2 + bo * 0.3), oy = py + pd * 0.9;
            s += topLine(dcx, dcy + hs, ox, oy, z + 0.55, gold, 1);
            s += topDot(ox, oy, z + 0.62, 1.4, neon);
        }
    } else if (key === "l1" || key === "l2") {
        var gc = key === "l1" ? 5 : 7, gr = key === "l1" ? 4 : 5;
        var cw = pw / gc, ch = pd / gr;
        for (var gy = 0; gy < gr; gy++) {
            for (var gx = 0; gx < gc; gx++) {
                s += topRect(px + gx * cw + 0.7, py + gy * ch + 0.7, cw - 1.4, ch - 1.4, z + 0.38, ((gx + gy) % 2) ? neon : mid, 'stroke="' + glow + '" stroke-width="0.35"');
            }
            if (key === "l2" && gy > 0 && gy % 2 === 0) s += topLine(px, py + gy * ch, px + pw, py + gy * ch, z + 0.5, "rgba(0,0,0,0.2)", 0.85);
        }
        s += topLine(px + pw, py + pd * 0.2, x + w - 1.5, y + 2, z + 0.55, neon, 1.05);
    } else if (key === "fpu") {
        s += topRect(px, py, pw * 0.55, pd, z + 0.35, deep);
        var gc2 = 3, gr2 = 4, cw2 = (pw * 0.55) / gc2, ch2 = pd / gr2;
        for (var fy = 0; fy < gr2; fy++) for (var fx = 0; fx < gc2; fx++) {
            s += topRect(px + fx * cw2 + 0.7, py + fy * ch2 + 0.7, cw2 - 1.4, ch2 - 1.4, z + 0.48, neon);
        }
        // compact wave + mantissa cue (not wave-only)
        var wx = px + pw * 0.62, ww = pw * 0.34, wy = py + pd * 0.35;
        s += topLine(wx, wy, wx + ww * 0.25, wy - pd * 0.18, z + 0.55, gold, 1.2);
        s += topLine(wx + ww * 0.25, wy - pd * 0.18, wx + ww * 0.5, wy + pd * 0.18, z + 0.55, gold, 1.2);
        s += topLine(wx + ww * 0.5, wy + pd * 0.18, wx + ww * 0.75, wy - pd * 0.1, z + 0.55, gold, 1.2);
        s += topLine(wx + ww * 0.75, wy - pd * 0.1, wx + ww, wy + pd * 0.05, z + 0.55, gold, 1.2);
        s += topText(px + pw * 0.79, py + pd * 0.78, z + 0.7, "1.M", 9, ink);
    } else if (key === "cores") {
        var n = 4;
        if ((lv || 1) <= 1) n = 4;
        if ((lv || 1) >= 3) n = 9;
        if ((lv || 1) >= 4) n = 12;
        if ((lv || 1) >= 5) n = 16;
        var side = Math.ceil(Math.sqrt(n)), tw = pw / side, td = pd / side, ti = 0;
        for (var ty = 0; ty < side; ty++) for (var tx = 0; tx < side; tx++) {
            if (ti >= n) break;
            var tx0 = px + tx * tw + 1.6, ty0 = py + ty * td + 1.6;
            s += topRect(tx0, ty0, tw - 3.2, td - 3.2, z + 0.42, neon, 'stroke="' + glow + '" stroke-width="0.55"');
            s += topRect(tx0 + (tw - 3.2) * 0.3, ty0 + (td - 3.2) * 0.3, (tw - 3.2) * 0.4, (td - 3.2) * 0.4, z + 0.58, deep);
            ti++;
        }
    }
    return s;
}

function buildChipSvg(opts) {
    var inter = opts.interactive, onMap = opts.onMap, lvMap = opts.lvMap, uid = inter ? "" : "m_";
    var s = "<defs><filter id='" + uid + "soft' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='14'/></filter>";
    s += "<filter id='" + uid + "neon'><feGaussianBlur stdDeviation='1.1' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter>";
    for (var i = 0; i < PARTS.length; i++) {
        var c = PARTS[i].color;
        s += '<linearGradient id="' + uid + 'g_' + PARTS[i].key + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + shade(c, 0.58) + '"/><stop offset="0.55" stop-color="' + c + '"/><stop offset="1" stop-color="' + shade(c, -0.18) + '"/></linearGradient>';
    }
    s += '<linearGradient id="' + uid + 'gpcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fd4ad"/><stop offset="1" stop-color="#5bb884"/></linearGradient>';
    s += '<linearGradient id="' + uid + 'gslab" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f9fc"/><stop offset="1" stop-color="#cfd6e0"/></linearGradient>';
    s += '<linearGradient id="' + uid + 'gdie" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a3380"/><stop offset="1" stop-color="#12183f"/></linearGradient>';
    s += '<linearGradient id="' + uid + 'gedge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f9a70"/><stop offset="1" stop-color="#356a4c"/></linearGradient></defs>';

    s += poly([[-10, -10, -6], [480, -10, -6], [480, 480, -6], [-10, 480, -6]], "rgba(40,70,110,0.3)", 'filter="url(#' + uid + 'soft)"');
    var ps = 'stroke="#c9a227" stroke-width="0.7"', n, y0, x0;
    for (n = 0; n < 12; n++) {
        y0 = 14 + n * 36;
        s += poly([[-60, y0, 2], [-36, y0, 2], [-36, y0 + 13, 2], [-60, y0 + 13, 2]], "#e8b84a", ps);
        s += poly([[-57, y0 + 2, 4], [-39, y0 + 2, 4], [-39, y0 + 11, 4], [-57, y0 + 11, 4]], "#ffe08a", 'stroke="rgba(255,255,255,0.35)" stroke-width="0.45"');
        x0 = 14 + n * 36;
        s += poly([[x0, -60, 2], [x0 + 13, -60, 2], [x0 + 13, -36, 2], [x0, -36, 2]], "#e8b84a", ps);
        s += poly([[x0 + 2, -57, 4], [x0 + 11, -57, 4], [x0 + 11, -39, 4], [x0 + 2, -39, 4]], "#ffe08a", 'stroke="rgba(255,255,255,0.35)" stroke-width="0.45"');
    }
    s += box(-46, -46, 492, 492, -1.5, 3.5, "url(#" + uid + "gedge)", "#3f8f62", "#326f4d", 'stroke="rgba(0,0,0,0.18)" stroke-width="0.5"');
    s += box(-40, -40, 480, 480, 0, 8, "url(#" + uid + "gpcb)", "#4fa574", "#3f8f62", 'stroke="rgba(255,255,255,0.4)" stroke-width="0.85" stroke-linejoin="round"');
    for (n = 0; n < 12; n++) {
        y0 = 20 + n * 36;
        s += line3([-36, y0, 8], [-20, y0, 8], "", 'stroke="#6fc894" stroke-width="2"');
        s += line3([420, y0, 8], [436, y0, 8], "", 'stroke="#6fc894" stroke-width="2"');
        x0 = 20 + n * 36;
        s += line3([x0, -36, 8], [x0, -20, 8], "", 'stroke="#6fc894" stroke-width="2"');
        s += line3([x0, 420, 8], [x0, 436, 8], "", 'stroke="#6fc894" stroke-width="2"');
    }
    for (n = 0; n < 12; n++) {
        y0 = 14 + n * 36;
        s += poly([[436, y0, 2], [460, y0, 2], [460, y0 + 13, 2], [436, y0 + 13, 2]], "#f0c35a", ps);
        s += poly([[439, y0 + 2, 4], [457, y0 + 2, 4], [457, y0 + 11, 4], [439, y0 + 11, 4]], "#ffe59a", 'stroke="rgba(255,255,255,0.35)" stroke-width="0.45"');
        x0 = 14 + n * 36;
        s += poly([[x0, 436, 2], [x0 + 13, 436, 2], [x0 + 13, 460, 2], [x0, 460, 2]], "#f0c35a", ps);
        s += poly([[x0 + 2, 439, 4], [x0 + 11, 439, 4], [x0 + 11, 457, 4], [x0 + 2, 457, 4]], "#ffe59a", 'stroke="rgba(255,255,255,0.35)" stroke-width="0.45"');
    }
    s += box(-20, -20, 440, 440, 8, 6, "url(#" + uid + "gslab)", "#c6cdd7", "#aeb7c3", 'stroke="rgba(255,255,255,0.55)" stroke-width="0.85"');
    s += box(0, 0, 400, 400, 14, 4, "url(#" + uid + "gdie)", "#151b4a", "#0d1233", 'stroke="rgba(160,180,255,0.5)" stroke-width="1"');
    for (n = 1; n < 8; n++) {
        s += line3([n * 50, 0, 18], [n * 50, 400, 18], "", 'stroke="rgba(255,255,255,0.05)" stroke-width="1"');
        s += line3([0, n * 50, 18], [400, n * 50, 18], "", 'stroke="rgba(255,255,255,0.05)" stroke-width="1"');
    }
    // soft substrate etch (inactive)
    for (n = 0; n < 5; n++) {
        s += line3([24 + n * 70, 16, 18.15], [64 + n * 70, 16, 18.15], "", 'stroke="rgba(255,190,120,0.14)" stroke-width="1.6"');
        s += line3([16, 36 + n * 65, 18.15], [16, 68 + n * 65, 18.15], "", 'stroke="rgba(255,190,120,0.12)" stroke-width="1.5"');
    }

    var wires = [["clock", "cu"], ["cu", "regs"], ["cu", "alu"], ["cu", "decoder"], ["alu", "fpu"], ["regs", "pipe"], ["alu", "pipe"], ["pipe", "l1"], ["pipe", "cores"], ["l1", "l2"], ["cores", "l2"]];
    for (i = 0; i < wires.length; i++) {
        var a = PART[wires[i][0]], b = PART[wires[i][1]];
        var live = onMap[a.key] && onMap[b.key];
        s += line3([(a.slot[0] + a.slot[2] / 2) * 50, (a.slot[1] + a.slot[3] / 2) * 50, 18.4], [(b.slot[0] + b.slot[2] / 2) * 50, (b.slot[1] + b.slot[3] / 2) * 50, 18.4], "trace" + (live ? " live" : ""));
    }
    for (i = 0; i < PARTS.length; i++) {
        var P = PARTS[i]; if (onMap[P.key]) continue;
        var sx = P.slot[0] * 50 + 3, sy = P.slot[1] * 50 + 3, sw = P.slot[2] * 50 - 6, sd = P.slot[3] * 50 - 6;
        s += (inter ? '<g class="slotg" onclick="clickSlot(\'' + P.key + '\')"><title>' + P.name + ' (Stage ' + P.stage + ')</title>' : '<g>') + poly([[sx, sy, 18], [sx + sw, sy, 18], [sx + sw, sy + sd, 18], [sx, sy + sd, 18]], "rgba(255,255,255,0.05)", 'stroke="rgba(255,255,255,0.35)" stroke-width="1.2" stroke-dasharray="5 4"');
        var cc = iso(sx + sw / 2, sy + sd / 2, 18); s += '<text x="' + cc[0].toFixed(1) + '" y="' + (cc[1] + 4).toFixed(1) + '" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.5)" font-family="ui-monospace,Menlo,monospace">' + P.short + '</text></g>';
    }
    var list = [];
    for (i = 0; i < PARTS.length; i++) {
        var Q = PARTS[i];
        if (onMap[Q.key]) list.push({ key: Q.key, x: Q.slot[0] * 50 + 3, y: Q.slot[1] * 50 + 3, w: Q.slot[2] * 50 - 6, d: Q.slot[3] * 50 - 6, h: inter ? game.parts[Q.key].h : heightOf(lvMap[Q.key] || 1), lv: inter ? game.parts[Q.key].level : (lvMap[Q.key] || 1) });
    }
    list = sortBoxes(list);
    for (i = 0; i < list.length; i++) {
        var B = list[i], info = PART[B.key], col = info.color;
        var stroke = (inter && selected == B.key)
            ? 'stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"'
            : 'stroke="' + shade(col, 0.65) + '" stroke-width="1.05" stroke-linejoin="round" stroke-opacity="0.85"';
        s += (inter ? '<g class="partg' + (hot == B.key ? " hot" : "") + '" onclick="clickPart(\'' + B.key + '\')"><title>' + info.name + '</title>' : '<g>');
        s += box(B.x, B.y, B.w, B.d, 18, B.h, "url(#" + uid + "g_" + B.key + ")", shade(col, -0.22), shade(col, -0.4), stroke);
        s += partDetails(B.key, B.x, B.y, B.w, B.d, 18 + B.h, col, B.lv);
        var top = iso(B.x + B.w / 2, B.y + B.d / 2, 18 + B.h);
        var lab = 'font-family="ui-monospace,Menlo,monospace" text-anchor="middle" fill="#fff" stroke="rgba(0,0,0,0.45)" stroke-width="2.7" paint-order="stroke" font-weight="800"';
        var labY = (B.key === "regs" || B.key === "l1" || B.key === "l2" || B.key === "cores" || B.key === "pipe") ? (top[1] - 1) : (top[1] + 1);
        s += '<text x="' + top[0].toFixed(1) + '" y="' + labY.toFixed(1) + '" font-size="12" ' + lab + '>' + info.short + '</text>';
        if (inter) s += '<text x="' + top[0].toFixed(1) + '" y="' + (labY + 12).toFixed(1) + '" font-size="9" ' + lab + '>Lv ' + game.parts[B.key].level + '</text>';
        s += '</g>';
    }
    return s;
}

function drawChip() { var m = {}; for (var i = 0; i < PARTS.length; i++) m[PARTS[i].key] = game.parts[PARTS[i].key].on; el("chip").innerHTML = buildChipSvg({ interactive: true, onMap: m }); }
function kickAnim() { if (!animOn) { animOn = true; requestAnimationFrame(animStep); } }
function animStep() { var mv = false; for (var i = 0; i < PARTS.length; i++) { var p = game.parts[PARTS[i].key]; if (!p.on) continue; var t = heightOf(p.level), d = t - p.h; if (game.reduce || Math.abs(d) <= 0.4) p.h = t; else { p.h += d * 0.14; mv = true; } } drawChip(); if (mv) requestAnimationFrame(animStep); else animOn = false; }
function setHot(k) { hot = k; drawChip(); setTimeout(function () { if (hot == k) { hot = ""; drawChip(); } }, 2400); }
function installPart(k) { var p = game.parts[k]; if (p.on) return; p.on = true; p.level = 1; p.h = 0; kickAnim(); renderLeft(); renderStats(); renderHud(); refreshDiagUi(); }

function refreshDiagUi() {
    if (el("finaleBtn")) el("finaleBtn").classList.toggle("hidden", !allStagesPassed());
    // Fault Test lives in Tutor → Diagnose Chip; keep legacy hook hidden.
    var btnF = el("btnFault");
    if (btnF) btnF.classList.add("hidden");
    var fb = el("faultBanner"); if (!fb) return;
    if (activeFault) {
        fb.classList.remove("hidden");
        fb.innerHTML = "<span><b style='color:#b45309'>🚨 FAULT:</b> " + activeFault.symptom + "</span><span style='display:flex;gap:8px;align-items:center;'><span class='mono' style='color:#4a47c8;font-size:11px;font-weight:700;white-space:nowrap'>CLICK 3D PART</span><button class='ghost' style='padding:2px 7px;' onclick='dismissFault()'>✕</button></span>";
    } else fb.classList.add("hidden");
}

function dismissFault() {
    activeFault = null;
    refreshDiagUi();
    BOT.say("Fault alert dismissed—keep building or hit green on TIME IT!", "idle", "");
}

function runFaultTest() {
    if (installedCount() < 2) { toast("Build at least 2 CPU parts first!"); return; }
    if (activeFault) { BOT.say("🚨 Fault already active above the chip: <b>" + activeFault.symptom + "</b> — click the failing 3D part!", "alert", "warn"); beep(300, 90); return; }
    triggerFault();
}

function triggerFault() {
    if (activeFault) return;
    var pool = FAULTS.filter(function (f) { return game.parts[f.need] && game.parts[f.need].on; });
    if (pool.length < 2) return;
    activeFault = pool[rand(0, pool.length - 1)];
    activeFault.firstTry = true;
    refreshDiagUi();
    BOT.say("🚨 Fault alert! Read the symptom above the chip and click the failing 3D component.", "alert", "warn");
    beep(300, 120);
}
