// chip.js: Isometric SVG CPU — layered hardware geometry (neon educational chip)
// Interactions, install/upgrade height anim, fault click, TRACE, demos preserved.
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

function edge(col, sel, hotMark) {
    if (hotMark) return 'stroke="#fffef0" stroke-width="3.4" stroke-linejoin="round" stroke-opacity="1"';
    if (sel) return 'stroke="#ffffff" stroke-width="2.8" stroke-linejoin="round"';
    return 'stroke="' + shade(col, 0.62) + '" stroke-width="0.85" stroke-linejoin="round" stroke-opacity="0.9"';
}
function boxC(x, y, w, d, z0, h, col, e) {
    if (w < 0.6 || d < 0.6 || h < 0.15) return "";
    return box(x, y, w, d, z0, h, shade(col, 0.22), shade(col, -0.28), shade(col, -0.45), e || edge(col, false));
}
function boxLit(x, y, w, d, z0, h, col, amt, e) {
    if (w < 0.6 || d < 0.6 || h < 0.15) return "";
    return box(x, y, w, d, z0, h, shade(col, amt), shade(col, amt - 0.4), shade(col, amt - 0.55), e || edge(col, false));
}
function topFace(x, y, w, d, z, fill, e) {
    return poly([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]], fill, e || "");
}
function topDot(x, y, z, r, fill) {
    var p = iso(x, y, z);
    return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r + '" fill="' + fill + '" stroke="rgba(255,255,255,0.4)" stroke-width="0.45"/>';
}
function topLine(a, b, stroke, w) {
    return line3(a, b, "", 'stroke="' + stroke + '" stroke-width="' + (w || 1.1) + '" stroke-linecap="round"');
}
function contactShadow(x, y, w, d, z0, filterId) {
    var m = 3.5;
    return poly([[x - m, y - m, z0 - 0.2], [x + w + m, y - m, z0 - 0.2], [x + w + m * 0.6, y + d + m, z0 - 0.2], [x - m * 0.4, y + d + m, z0 - 0.2]], "rgba(0,0,0,0.28)", 'filter="url(#' + (filterId || "softPad") + ')"');
}
function chamferFoot(x, y, w, d, cut) {
    var c = Math.min(cut, w * 0.45, d * 0.45);
    return [[x + c, y], [x + w - c, y], [x + w, y + c], [x + w, y + d - c], [x + w - c, y + d], [x + c, y + d], [x, y + d - c], [x, y + c]];
}
function octFoot(cx, cy, r) {
    var out = [], i;
    for (i = 0; i < 8; i++) {
        var a = -Math.PI / 8 + i * (Math.PI / 4);
        out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return out;
}
function faceAvgDepth(face) {
    var sx = 0, sy = 0, sz = 0, n = face.p.length, i;
    for (i = 0; i < n; i++) { sx += face.p[i][0]; sy += face.p[i][1]; sz += face.p[i][2]; }
    return (sx + sy) / n - sz * 0.2;
}
function extrude(foot, z0, h, topC, leftC, rightC, e) {
    if (h < 0.15 || foot.length < 3) return "";
    var z1 = z0 + h, faces = [], i, n = foot.length;
    for (i = 0; i < n; i++) {
        var A = foot[i], B = foot[(i + 1) % n];
        var dx = B[0] - A[0], dy = B[1] - A[1];
        var fc = (dx - dy) >= 0 ? rightC : leftC;
        faces.push({ p: [[A[0], A[1], z1], [B[0], B[1], z1], [B[0], B[1], z0], [A[0], A[1], z0]], c: fc });
    }
    var top = [];
    for (i = 0; i < n; i++) top.push([foot[i][0], foot[i][1], z1]);
    faces.push({ p: top, c: topC });
    faces.sort(function (a, b) { return faceAvgDepth(a) - faceAvgDepth(b); });
    var s = "";
    for (i = 0; i < faces.length; i++) s += poly(faces[i].p, faces[i].c, e || "");
    return s;
}
function rim(x, y, w, d, z, col) {
    return topFace(x + 1.2, y + 1.2, w - 2.4, d - 2.4, z + 0.05, shade(col, 0.4), 'stroke="' + shade(col, 0.7) + '" stroke-width="0.55" stroke-opacity="0.65"');
}
function grooveY(x, y, w, z, col) {
    return topFace(x, y - 0.7, w, 1.4, z + 0.02, shade(col, -0.45));
}
function grooveX(x, y, d, z, col) {
    return topFace(x - 0.7, y, 1.4, d, z + 0.02, shade(col, -0.45));
}
function terminal(x, y, z, col) {
    return boxLit(x - 1.3, y - 1.3, 2.6, 2.6, z, 1.8, col, 0.55) + topDot(x, y, z + 2.1, 1.15, shade(col, 0.75));
}
function goldTrace(a, b, z) {
    return topLine([a[0], a[1], z], [b[0], b[1], z], "#f0c35a", 1.15);
}
function drawSortedBoxes(pieces, col, selEdge) {
    var list = sortBoxes(pieces), s = "", i;
    for (i = 0; i < list.length; i++) {
        var P = list[i];
        s += boxC(P.x, P.y, P.w, P.d, P.z0, P.h, P.col || col, P.e || selEdge);
    }
    return s;
}

function railH(x0, x1, y, z, h, col, e) {
    var lo = Math.min(x0, x1), hi = Math.max(x0, x1);
    return boxLit(lo, y - 1.1, Math.max(2, hi - lo), 2.2, z, h, col, 0.35, e);
}
function railV(x, y0, y1, z, h, col, e) {
    var lo = Math.min(y0, y1), hi = Math.max(y0, y1);
    return boxLit(x - 1.1, lo, 2.2, Math.max(2, hi - lo), z, h, col, 0.35, e);
}

// ---- Per-part layered hardware (geometry, not flat stickers) ----
function partHardware(key, x, y, w, d, z0, h, col, lv, isSel, filterId, isHot) {
    var s = "", H = Math.max(h, 0.4), base = z0;
    // Favor tall raised structures over a single slab so depth reads at chip scale
    var bodyH = Math.max(2.0, H * 0.38), raise = Math.max(2.4, H * 0.72);
    var zBody = base, e = edge(col, isSel, isHot);
    var neon = shade(col, 0.55), gold = "#f0c35a";
    s += contactShadow(x, y, w, d, base, filterId);
    if (isHot) {
        // Exaggerated path/demo halo so the active unit is unmistakable
        s += topFace(x - 5, y - 5, w + 10, d + 10, base - 0.15, "rgba(255, 250, 200, 0.22)", 'stroke="#fffef0" stroke-width="3.2" stroke-opacity="0.95"');
        s += topFace(x - 2, y - 2, w + 4, d + 4, base - 0.05, "rgba(125, 211, 252, 0.18)", 'stroke="#67e8f9" stroke-width="2.2" stroke-opacity="0.9"');
    }

    if (key === "clock") {
        // Dominant octagonal oscillator tower (most recognizable silhouette)
        var cx = x + w / 2, cy = y + d * 0.42;
        var pad = Math.min(w, d) * 0.92;
        s += extrude(chamferFoot(cx - pad / 2, cy - pad / 2, pad, pad, pad * 0.28), zBody, bodyH * 0.55, shade(col, -0.08), shade(col, -0.35), shade(col, -0.5), e);
        var zMid = zBody + bodyH * 0.55;
        var r0 = Math.min(w, d) * 0.46, r1 = r0 * 0.7, r2 = r0 * 0.36;
        s += extrude(octFoot(cx, cy, r0), zMid, raise * 0.85, shade(col, 0.2), shade(col, -0.2), shade(col, -0.38), e);
        var zRing = zMid + raise * 0.85;
        s += extrude(octFoot(cx, cy, r1), zRing, raise * 0.45, shade(col, 0.4), shade(col, -0.05), shade(col, -0.22), e);
        var zDome = zRing + raise * 0.45;
        s += extrude(octFoot(cx, cy, r2), zDome, raise * 0.55, neon, shade(col, 0.1), shade(col, -0.12), e);
        s += topDot(cx, cy, zDome + raise * 0.55 + 1, Math.max(2.6, r2 * 0.65), shade(col, 0.82));
        // square-wave timing fins on apron
        var waveY = y + d * 0.78, waveX0 = x + w * 0.1, waveW = w * 0.8, steps = 7, sw = waveW / steps, wi;
        for (wi = 0; wi < steps; wi++) {
            var up = (wi % 2 === 0);
            s += boxLit(waveX0 + wi * sw + 0.5, waveY, sw - 1, d * 0.16, zMid, up ? raise * 0.7 : raise * 0.22, col, up ? 0.5 : 0.05, e);
        }
        s += terminal(x + w * 0.1, y + d * 0.14, zMid, col);
        s += terminal(x + w * 0.9, y + d * 0.14, zMid, col);
        s += goldTrace([cx, cy], [x + w * 0.9, y + d * 0.14], zDome);
    } else if (key === "cu") {
        // Heavily chamfered pad + tall central die + cardinal gold rails to terminals
        var cCut = Math.min(w, d) * 0.34;
        s += extrude(chamferFoot(x, y, w, d, cCut), zBody, bodyH, shade(col, 0.02), shade(col, -0.32), shade(col, -0.48), e);
        var padZ = zBody + bodyH;
        // recessed tray
        s += boxLit(x + w * 0.16, y + d * 0.18, w * 0.68, d * 0.64, padZ, 1.0, col, -0.42, e);
        var hx = x + w * 0.34, hy = y + d * 0.3, hw = w * 0.32, hd = d * 0.4;
        var hubZ = padZ + 1.0;
        s += boxLit(hx - 2, hy - 2, hw + 4, hd + 4, hubZ, raise * 0.35, col, -0.1, e);
        s += boxLit(hx, hy, hw, hd, hubZ + raise * 0.35, raise * 1.15, col, 0.28, e);
        s += boxLit(hx + hw * 0.2, hy + hd * 0.2, hw * 0.6, hd * 0.6, hubZ + raise * 1.5, raise * 0.55, col, 0.6, e);
        s += topDot(hx + hw / 2, hy + hd / 2, hubZ + raise * 2.1, 2.4, shade(col, 0.8));
        var midx = hx + hw / 2, midy = hy + hd / 2, zRail = hubZ + raise * 0.5;
        var ports = [[x + w * 0.08, midy], [x + w * 0.92, midy], [midx, y + d * 0.1], [midx, y + d * 0.9], [x + w * 0.12, y + d * 0.16], [x + w * 0.88, y + d * 0.16], [x + w * 0.12, y + d * 0.84], [x + w * 0.88, y + d * 0.84]];
        var ai;
        for (ai = 0; ai < ports.length; ai++) {
            var ax = ports[ai][0], ay = ports[ai][1];
            if (Math.abs(ax - midx) > Math.abs(ay - midy)) s += railH(midx, ax, midy, zRail, 1.6, "#d4a017", e);
            else s += railV(midx, midy, ay, zRail, 1.6, "#d4a017", e);
            if (Math.abs(ax - midx) > 1 && Math.abs(ay - midy) > 1) {
                s += railH(midx, ax, ay, zRail, 1.4, "#d4a017", e);
                s += railV(ax, midy, ay, zRail, 1.4, "#d4a017", e);
            }
            s += terminal(ax, ay, zRail + 0.4, col);
        }
    } else if (key === "alu") {
        // Twin raised compute engines with deep recessed channel between
        s += extrude(chamferFoot(x, y, w, d, Math.min(w, d) * 0.12), zBody, bodyH * 0.7, shade(col, -0.05), shade(col, -0.35), shade(col, -0.5), e);
        var deck = zBody + bodyH * 0.7;
        s += boxLit(x + 3, y + 3, w - 6, d - 6, deck, 0.9, col, -0.45, e); // recessed floor
        var laneW = w * 0.3, laneX0 = x + w * 0.06, laneX1 = x + w * 0.64;
        s += boxLit(laneX0, y + 6, laneW, d - 12, deck + 0.9, raise * 1.15, col, 0.18, e);
        s += boxLit(laneX1, y + 6, laneW, d - 12, deck + 0.9, raise * 1.15, col, 0.18, e);
        var bi, blocks = 4, bh = (d - 18) / blocks;
        for (bi = 0; bi < blocks; bi++) {
            var by = y + 9 + bi * bh;
            s += boxLit(laneX0 + 2.5, by, laneW - 5, bh - 3.5, deck + 0.9 + raise * 1.15, raise * 0.55, col, 0.48, e);
            s += boxLit(laneX1 + 2.5, by, laneW - 5, bh - 3.5, deck + 0.9 + raise * 1.15, raise * 0.55, col, 0.48, e);
            s += grooveY(laneX0 + 3, by + bh * 0.5, laneW - 6, deck + 0.9 + raise * 1.5, col);
        }
        // deep center trench
        s += boxLit(x + w * 0.42, y + 8, w * 0.16, d - 16, deck + 0.9, raise * 0.2, col, -0.55, e);
        for (bi = 0; bi < 5; bi++) {
            s += terminal(x + 3.2, y + d * (0.15 + bi * 0.16), deck + 1.2, col);
            s += terminal(x + w - 3.2, y + d * (0.15 + bi * 0.16), deck + 1.2, col);
        }
    } else if (key === "regs") {
        // Tall separated register cells (storage sticks) on a thin foundation
        s += extrude(chamferFoot(x + 1, y + 1, w - 2, d - 2, 5), zBody, bodyH * 0.65, shade(col, 0.0), shade(col, -0.3), shade(col, -0.48), e);
        var rz = zBody + bodyH * 0.65;
        s += boxLit(x + 3, y + 3, w - 6, d - 6, rz, 0.9, col, -0.4, e);
        var cols = 4, rows = 3, gw = (w - 14) / cols, gd = (d - 12) / rows, rx, ry, pieces = [];
        for (ry = 0; ry < rows; ry++) for (rx = 0; rx < cols; rx++) {
            pieces.push({
                x: x + 6 + rx * gw + gw * 0.28,
                y: y + 6 + ry * gd + gd * 0.1,
                w: gw * 0.32,
                d: gd * 0.8,
                z0: rz + 0.9,
                h: raise * (1.05 + (rx % 2) * 0.18),
                col: col
            });
        }
        s += drawSortedBoxes(pieces, col, e);
        s += boxLit(x + w - 6, y + 6, 3.5, d - 12, rz + 0.9, raise * 0.45, "#d4a84b", 0.2, e);
        for (ry = 0; ry < rows; ry++) s += goldTrace([x + 6 + 3 * gw + gw * 0.28 + gw * 0.32, y + 6 + ry * gd + gd * 0.5], [x + w - 4, y + 6 + ry * gd + gd * 0.5], rz + raise);
    } else if (key === "pipe") {
        // Five clearly separated raised chambers on a recessed conduit
        s += boxLit(x, y + d * 0.18, w, d * 0.64, zBody, bodyH * 0.55, col, -0.3, e);
        var pz = zBody + bodyH * 0.55;
        s += boxLit(x + 3, y + d * 0.28, w - 6, d * 0.44, pz, 0.8, col, -0.5, e);
        var stages = 5, sw = (w - 10) / stages, si, pipePieces = [];
        for (si = 0; si < stages; si++) {
            pipePieces.push({
                x: x + 5 + si * sw + 3.2,
                y: y + d * 0.3,
                w: sw - 6.4,
                d: d * 0.4,
                z0: pz + 0.8,
                h: raise * (1.05 + (si === 2 ? 0.3 : 0)),
                col: col
            });
        }
        s += drawSortedBoxes(pipePieces, col, e);
        for (si = 0; si < stages - 1; si++) {
            var cxp = x + 5 + (si + 1) * sw;
            s += boxLit(cxp - 2, y + d * 0.4, 4, d * 0.2, pz + 0.8, raise * 0.35, "#f0c35a", 0.3, e);
            s += topDot(cxp, y + d * 0.5, pz + 0.8 + raise * 0.45, 1.6, gold);
        }
        for (si = 0; si < stages; si++) {
            var tx = x + 5 + si * sw + (sw - 6.4) * 0.55;
            s += topLine([tx - 3, y + d * 0.5, pz + 0.8 + raise], [tx + 3.5, y + d * 0.5, pz + 0.8 + raise], gold, 1.6);
        }
    } else if (key === "decoder") {
        // Compact bit rack + large extruded diamond hub + output stubs
        s += extrude(chamferFoot(x + w * 0.06, y + d * 0.05, w * 0.88, d * 0.9, Math.min(w, d) * 0.24), zBody, bodyH * 0.55, shade(col, 0.0), shade(col, -0.3), shade(col, -0.48), e);
        var dz = zBody + bodyH * 0.55;
        var bits = 6, bw = (w * 0.8) / bits, bi2;
        for (bi2 = 0; bi2 < bits; bi2++) {
            s += boxLit(x + w * 0.1 + bi2 * bw + 1, y + d * 0.08, bw - 2, d * 0.2, dz, raise * 0.65, col, (bi2 % 2) ? 0.45 : 0.05, e);
        }
        var dcx = x + w / 2, dcy = y + d * 0.55, hs = Math.min(w, d) * 0.28;
        s += extrude([[dcx, dcy - hs], [dcx + hs, dcy], [dcx, dcy + hs], [dcx - hs, dcy]], dz + 0.5, raise * 1.35, neon, shade(col, -0.12), shade(col, -0.32), e);
        s += boxLit(dcx - 2.5, y + d * 0.28, 5, d * 0.12, dz, raise * 0.4, "#e8c56a", 0.25, e);
        for (bi2 = 0; bi2 < 3; bi2++) {
            var ox = x + w * (0.22 + bi2 * 0.28), oy = y + d * 0.88;
            s += railV(dcx + (ox - dcx) * 0.35, dcy + hs * 0.35, oy, dz + raise * 0.4, 1.5, "#d4a017", e);
            s += railH(dcx + (ox - dcx) * 0.35, ox, oy, dz + raise * 0.4, 1.5, "#d4a017", e);
            s += boxLit(ox - 4, oy - 3, 8, 6, dz + raise * 0.2, raise * 0.6, col, 0.4, e);
            s += terminal(ox, oy, dz + raise * 0.85, col);
        }
    } else if (key === "l1" || key === "l2") {
        var isL2 = key === "l2";
        var mz;
        if (isL2) {
            // Stepped L: tall left bank + lower right wing (distinct from L1 rectangle)
            s += boxLit(x, y, w * 0.4, d, zBody, bodyH, col, -0.08, e);
            s += boxLit(x + w * 0.32, y + d * 0.35, w * 0.68, d * 0.65, zBody, bodyH * 0.85, col, -0.12, e);
            mz = zBody + bodyH;
            s += boxLit(x + 3, y + 3, w * 0.4 - 6, d - 6, mz, 0.8, col, -0.4, e);
            s += boxLit(x + w * 0.35, y + d * 0.38, w * 0.62 - 3, d * 0.58 - 3, zBody + bodyH * 0.85, 0.8, col, -0.4, e);
        } else {
            s += extrude(chamferFoot(x, y, w, d, 4), zBody, bodyH, shade(col, 0.0), shade(col, -0.3), shade(col, -0.48), e);
            mz = zBody + bodyH;
            s += boxLit(x + 3, y + 3, w - 6, d - 6, mz, 0.8, col, -0.42, e);
        }
        var gc = isL2 ? 7 : 4, gr = isL2 ? 3 : 3;
        var cells = [], gx, gy, cw, ch;
        var originX = isL2 ? x + w * 0.38 : x + 6;
        var originY = isL2 ? y + d * 0.42 : y + 6;
        var areaW = isL2 ? w * 0.56 : w - 12;
        var areaD = isL2 ? d * 0.5 : d - 12;
        cw = areaW / gc; ch = areaD / gr;
        for (gy = 0; gy < gr; gy++) {
            s += grooveY(originX, originY + gy * ch, areaW, mz + 1, col);
            for (gx = 0; gx < gc; gx++) {
                cells.push({
                    x: originX + gx * cw + 1.2,
                    y: originY + gy * ch + 1.2,
                    w: cw - 2.4,
                    d: ch - 2.4,
                    z0: (isL2 ? zBody + bodyH * 0.85 : mz) + 0.8,
                    h: raise * (0.75 + ((gx + gy) % 3) * 0.1),
                    col: col
                });
            }
        }
        if (isL2) {
            var gc2 = 3, gr2 = 4, cw2 = (w * 0.32) / gc2, ch2 = (d - 14) / gr2;
            for (gy = 0; gy < gr2; gy++) for (gx = 0; gx < gc2; gx++) {
                cells.push({
                    x: x + 5 + gx * cw2 + 1,
                    y: y + 5 + gy * ch2 + 1,
                    w: cw2 - 2,
                    d: ch2 - 2,
                    z0: mz + 0.8,
                    h: raise * 0.9,
                    col: col
                });
            }
        }
        s += drawSortedBoxes(cells, col, e);
        s += terminal(x + w - 5, y + (isL2 ? d * 0.4 : 5), mz + raise * 0.3, col);
    } else if (key === "fpu") {
        // True L silhouette: vertical vector stack + horizontal mantissa wing (empty corner)
        s += boxLit(x, y, w * 0.52, d, zBody, bodyH, col, -0.05, e);
        s += boxLit(x + w * 0.4, y + d * 0.48, w * 0.6, d * 0.52, zBody, bodyH, col, -0.05, e);
        var fz = zBody + bodyH;
        s += boxLit(x + 3, y + 3, w * 0.52 - 6, d - 6, fz, 0.8, col, -0.4, e);
        s += boxLit(x + w * 0.43, y + d * 0.5, w * 0.54 - 3, d * 0.46 - 3, fz, 0.8, col, -0.4, e);
        var lanes = 4, lw = (w * 0.52 - 12) / lanes, li;
        for (li = 0; li < lanes; li++) {
            s += boxLit(x + 5 + li * lw + 1, y + 6, lw - 2, d - 14, fz + 0.8, raise * (0.95 + li * 0.06), col, 0.28, e);
        }
        var mg = 3, mr = 2, mw = (w * 0.5 - 10) / mg, md = (d * 0.42 - 8) / mr, mx, my;
        for (my = 0; my < mr; my++) for (mx = 0; mx < mg; mx++) {
            s += boxLit(x + w * 0.48 + mx * mw + 1.2, y + d * 0.54 + my * md + 1.2, mw - 2.4, md - 2.4, fz + 0.8, raise * 0.85, col, 0.42, e);
        }
        s += grooveY(x + 4, y + d * 0.5, w * 0.45, fz + raise, col);
        for (li = 0; li < 3; li++) s += terminal(x + w - 4, y + d * (0.58 + li * 0.12), fz + raise * 0.2, col);
    } else if (key === "cores") {
        var n = 4;
        if ((lv || 1) <= 1) n = 4;
        if ((lv || 1) >= 3) n = 9;
        if ((lv || 1) >= 4) n = 12;
        if ((lv || 1) >= 5) n = 16;
        s += extrude(chamferFoot(x, y, w, d, 6), zBody, bodyH * 0.7, shade(col, -0.02), shade(col, -0.3), shade(col, -0.48), e);
        var cz = zBody + bodyH * 0.7;
        s += boxLit(x + 4, y + 4, w - 8, d - 8, cz, 0.8, col, -0.42, e);
        var side = Math.ceil(Math.sqrt(n)), tw = (w - 16) / side, td = (d - 16) / side, ti = 0, tiles = [];
        var tx, ty;
        for (ty = 0; ty < side; ty++) for (tx = 0; tx < side; tx++) {
            if (ti >= n) break;
            tiles.push({
                x: x + 8 + tx * tw + 2.4,
                y: y + 8 + ty * td + 2.4,
                w: tw - 4.8,
                d: td - 4.8,
                z0: cz + 0.8,
                h: raise * 1.05,
                col: col
            });
            ti++;
        }
        s += drawSortedBoxes(tiles, col, e);
        ti = 0;
        for (ty = 0; ty < side; ty++) for (tx = 0; tx < side; tx++) {
            if (ti >= n) break;
            var cx0 = x + 8 + tx * tw + tw * 0.28, cy0 = y + 8 + ty * td + td * 0.28;
            s += boxLit(cx0, cy0, tw * 0.44, td * 0.44, cz + 0.8 + raise * 1.05, raise * 0.4, col, 0.55, e);
            s += topDot(cx0 + tw * 0.22, cy0 + td * 0.22, cz + 0.8 + raise * 1.5, 1.35, shade(col, 0.8));
            ti++;
        }
    } else {
        s += boxC(x, y, w, d, zBody, H, col, e);
        s += rim(x, y, w, d, zBody + H, col);
    }

    return s;
}

function labelAnchor(key, x, y, w, d, z0, h) {
    var lift = 5;
    if (key === "clock") lift = 14;
    if (key === "cu") lift = 12;
    if (key === "cores" || key === "regs") lift = 9;
    if (key === "pipe") lift = 8;
    if (key === "alu" || key === "decoder") lift = 9;
    if (key === "fpu" || key === "l2") lift = 8;
    return iso(x + w / 2, y + d / 2, z0 + h + lift);
}

function buildChipSvg(opts) {
    var inter = opts.interactive, onMap = opts.onMap, lvMap = opts.lvMap, uid = inter ? "" : "m_";
    var s = "<defs>";
    s += "<filter id='" + uid + "soft' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='14'/></filter>";
    s += "<filter id='" + uid + "softPad' x='-40%' y='-40%' width='180%' height='180%'><feGaussianBlur stdDeviation='5'/></filter>";
    s += "<filter id='" + uid + "neon'><feGaussianBlur stdDeviation='1.1' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter>";
    for (var i = 0; i < PARTS.length; i++) {
        var c = PARTS[i].color;
        s += '<linearGradient id="' + uid + 'g_' + PARTS[i].key + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + shade(c, 0.58) + '"/><stop offset="0.55" stop-color="' + c + '"/><stop offset="1" stop-color="' + shade(c, -0.18) + '"/></linearGradient>';
    }
    s += '<linearGradient id="' + uid + 'gpcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fd4ad"/><stop offset="1" stop-color="#5bb884"/></linearGradient>';
    s += '<linearGradient id="' + uid + 'gslab" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f9fc"/><stop offset="1" stop-color="#cfd6e0"/></linearGradient>';
    s += '<linearGradient id="' + uid + 'gdie" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a3380"/><stop offset="1" stop-color="#12183f"/></linearGradient>';
    s += '<linearGradient id="' + uid + 'gedge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f9a70"/><stop offset="1" stop-color="#356a4c"/></linearGradient>';
    s += '<linearGradient id="' + uid + 'gpin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe59a"/><stop offset="1" stop-color="#c9922e"/></linearGradient>';
    s += "</defs>";

    // ambient drop shadow
    s += poly([[-10, -10, -6], [480, -10, -6], [480, 480, -6], [-10, 480, -6]], "rgba(40,70,110,0.3)", 'filter="url(#' + uid + 'soft)"');

    var ps = 'stroke="#b8862d" stroke-width="0.65"', n, y0, x0;
    // gold contact pins — layered + beveled tips
    for (n = 0; n < 12; n++) {
        y0 = 14 + n * 36;
        s += box(-62, y0, 26, 12, 0, 3.2, "url(#" + uid + "gpin)", "#d4a017", "#a67c1a", ps);
        s += box(-58, y0 + 2.2, 18, 7.5, 3.2, 2.2, "#ffe9a8", "#e0b84a", "#c9922e", 'stroke="rgba(255,255,255,0.35)" stroke-width="0.4"');
        x0 = 14 + n * 36;
        s += box(x0, -62, 12, 26, 0, 3.2, "url(#" + uid + "gpin)", "#d4a017", "#a67c1a", ps);
        s += box(x0 + 2.2, -58, 7.5, 18, 3.2, 2.2, "#ffe9a8", "#e0b84a", "#c9922e", 'stroke="rgba(255,255,255,0.35)" stroke-width="0.4"');
    }

    // layered PCB / slab / die substrate
    s += box(-48, -48, 496, 496, -2, 4, "url(#" + uid + "gedge)", "#3f8f62", "#2f6848", 'stroke="rgba(0,0,0,0.2)" stroke-width="0.5"');
    s += box(-40, -40, 480, 480, 0, 8, "url(#" + uid + "gpcb)", "#4fa574", "#3f8f62", 'stroke="rgba(255,255,255,0.4)" stroke-width="0.85" stroke-linejoin="round"');
    // PCB etch rings
    for (n = 0; n < 12; n++) {
        y0 = 20 + n * 36;
        s += line3([-36, y0, 8], [-18, y0, 8], "", 'stroke="#6fc894" stroke-width="2.2"');
        s += line3([418, y0, 8], [436, y0, 8], "", 'stroke="#6fc894" stroke-width="2.2"');
        x0 = 20 + n * 36;
        s += line3([x0, -36, 8], [x0, -18, 8], "", 'stroke="#6fc894" stroke-width="2.2"');
        s += line3([x0, 418, 8], [x0, 436, 8], "", 'stroke="#6fc894" stroke-width="2.2"');
    }
    for (n = 0; n < 12; n++) {
        y0 = 14 + n * 36;
        s += box(436, y0, 26, 12, 0, 3.2, "url(#" + uid + "gpin)", "#d4a017", "#a67c1a", ps);
        s += box(440, y0 + 2.2, 18, 7.5, 3.2, 2.2, "#ffe9a8", "#e0b84a", "#c9922e", 'stroke="rgba(255,255,255,0.35)" stroke-width="0.4"');
        x0 = 14 + n * 36;
        s += box(x0, 436, 12, 26, 0, 3.2, "url(#" + uid + "gpin)", "#d4a017", "#a67c1a", ps);
        s += box(x0 + 2.2, 440, 7.5, 18, 3.2, 2.2, "#ffe9a8", "#e0b84a", "#c9922e", 'stroke="rgba(255,255,255,0.35)" stroke-width="0.4"');
    }
    s += box(-22, -22, 444, 444, 8, 5.5, "url(#" + uid + "gslab)", "#c6cdd7", "#aeb7c3", 'stroke="rgba(255,255,255,0.55)" stroke-width="0.85"');
    // beveled slab lip
    s += box(-16, -16, 432, 432, 13.5, 1.8, "#e8edf4", "#b7c0cc", "#9aa5b4", 'stroke="rgba(255,255,255,0.35)" stroke-width="0.4"');
    s += box(0, 0, 400, 400, 14, 4.5, "url(#" + uid + "gdie)", "#151b4a", "#0d1233", 'stroke="rgba(160,180,255,0.55)" stroke-width="1"');
    // recessed die mount frame
    s += box(6, 6, 388, 388, 18.2, 0.7, "rgba(0,0,0,0.25)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.15)");
    for (n = 1; n < 8; n++) {
        s += line3([n * 50, 0, 18.5], [n * 50, 400, 18.5], "", 'stroke="rgba(255,255,255,0.045)" stroke-width="1"');
        s += line3([0, n * 50, 18.5], [400, n * 50, 18.5], "", 'stroke="rgba(255,255,255,0.045)" stroke-width="1"');
    }
    // substrate circuit etch (inactive)
    for (n = 0; n < 6; n++) {
        s += line3([20 + n * 60, 14, 18.6], [52 + n * 60, 14, 18.6], "", 'stroke="rgba(255,190,120,0.16)" stroke-width="1.7"');
        s += line3([14, 30 + n * 58, 18.6], [14, 58 + n * 58, 18.6], "", 'stroke="rgba(255,190,120,0.14)" stroke-width="1.5"');
        s += line3([380, 40 + n * 55, 18.6], [386, 40 + n * 55, 18.6], "", 'stroke="rgba(255,200,140,0.18)" stroke-width="1.2"');
    }
    // connection pads near slot centers (under parts)
    for (i = 0; i < PARTS.length; i++) {
        var pad = PARTS[i], px = (pad.slot[0] + pad.slot[2] / 2) * 50, py = (pad.slot[1] + pad.slot[3] / 2) * 50;
        s += topFace(px - 4, py - 4, 8, 8, 18.55, "rgba(255,200,120,0.12)");
    }

    var wires = [["clock", "cu"], ["cu", "regs"], ["cu", "alu"], ["cu", "decoder"], ["alu", "fpu"], ["regs", "pipe"], ["alu", "pipe"], ["pipe", "l1"], ["pipe", "cores"], ["l1", "l2"], ["cores", "l2"]];
    for (i = 0; i < wires.length; i++) {
        var a = PART[wires[i][0]], b = PART[wires[i][1]];
        var live = onMap[a.key] && onMap[b.key];
        var pathLit = inter && live && (hot == a.key || hot == b.key);
        var ax = (a.slot[0] + a.slot[2] / 2) * 50, ay = (a.slot[1] + a.slot[3] / 2) * 50;
        var bx = (b.slot[0] + b.slot[2] / 2) * 50, by = (b.slot[1] + b.slot[3] / 2) * 50;
        // subtle under-trace channel on die
        s += line3([ax, ay, 18.7], [bx, by, 18.7], "", 'stroke="rgba(0,0,0,0.35)" stroke-width="' + (pathLit ? "6.5" : "3.2") + '" stroke-linecap="round"');
        s += line3([ax, ay, 18.85], [bx, by, 18.85], "trace" + (live ? " live" : "") + (pathLit ? " path" : ""));
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
        var isSel = inter && (typeof selected !== "undefined") && selected == B.key;
        var isHot = inter && hot == B.key;
        // Invisible hit slab keeps selection / fault clicks reliable over complex geometry
        s += (inter ? '<g class="partg' + (isHot ? " hot" : "") + '" onclick="clickPart(\'' + B.key + '\')"><title>' + info.name + '</title>' : '<g>');
        s += topFace(B.x, B.y, B.w, B.d, 18.1, "rgba(0,0,0,0)", 'stroke="none"');
        s += partHardware(B.key, B.x, B.y, B.w, B.d, 18, B.h, col, B.lv, isSel, uid + "softPad", isHot);
        var top = labelAnchor(B.key, B.x, B.y, B.w, B.d, 18, B.h);
        var lab = 'font-family="ui-monospace,Menlo,monospace" text-anchor="middle" fill="#fff" stroke="rgba(0,0,0,0.5)" stroke-width="2.8" paint-order="stroke" font-weight="800"';
        s += '<text x="' + top[0].toFixed(1) + '" y="' + top[1].toFixed(1) + '" font-size="12" ' + lab + '>' + info.short + '</text>';
        if (inter) s += '<text x="' + top[0].toFixed(1) + '" y="' + (top[1] + 12).toFixed(1) + '" font-size="9" ' + lab + '>Lv ' + game.parts[B.key].level + '</text>';
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
