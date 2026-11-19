// games/fpu.js: IEEE-754 8-bit Minifloat (1 Sign | 4 Exp bias-7 | 3 Mantissa 1.MMM)
// ---------------------------------------------------------
GAMES.fpu = {
    icon: "🎯",
    title: "IEEE-754 BUILDER",
    time: 55,
    stars: [60, 130, 210],
    badPenalty: 6,
    rule: "Flip the 8 bits <b>[S | EEEE | MMM]</b> to encode the decimal!<br>Formula: <b>(−1)<sup>S</sup> × (1 + M/8) × 2<sup>(E − 7)</sup></b>",
    start: function (g, arena) {
        mk(arena, "div", "legend", "<b>S (1b)</b> 0:+ 1:− &nbsp;|&nbsp; <b>E (4b)</b> bias=7 (0111=2⁰, 1000=2¹, 0110=2⁻¹)<br><b>M (3b)</b> 1.MMM (000=1.0, 100=1.5, 010=1.25, 110=1.75)");
        var targetEl = mk(arena, "div", "want", ""), hintEl = mk(arena, "div", "ophint", ""), tiles = mk(arena, "div", "tiles", "");
        var subEl = mk(arena, "div", "mono", "");
        subEl.style.cssText = "font-size:12px;color:#4a47c8;margin-top:4px;";
        var checkBtn = mk(arena, "button", "bigbtn", "ENCODE ✔");

        var easyPool = [
            { val: 1.0, bits: [0, 0,1,1,1, 0,0,0] },
            { val: 1.5, bits: [0, 0,1,1,1, 1,0,0] },
            { val: -2.0, bits: [1, 1,0,0,0, 0,0,0] },
            { val: 3.0, bits: [0, 1,0,0,0, 1,0,0] },
            { val: 4.0, bits: [0, 1,0,0,1, 0,0,0] },
            { val: -1.25, bits: [1, 0,1,1,1, 0,1,0] },
            { val: 2.5, bits: [0, 1,0,0,0, 0,1,0] },
            { val: -3.5, bits: [1, 1,0,0,0, 1,1,0] }
        ];
        var hardPool = [
            { val: 0.5, bits: [0, 0,1,1,0, 0,0,0] },
            { val: -0.75, bits: [1, 0,1,1,0, 1,0,0] },
            { val: 0.625, bits: [0, 0,1,1,0, 0,1,0] },
            { val: 6.0, bits: [0, 1,0,0,1, 1,0,0] },
            { val: -5.0, bits: [1, 1,0,0,1, 0,1,0] },
            { val: 0.25, bits: [0, 0,1,0,1, 0,0,0] }
        ];

        var cur = null, bits = [0, 0,1,1,1, 0,0,0], solved = 0;
        function evalBits(b) {
            var s = b[0] ? -1 : 1;
            var e = b[1] * 8 + b[2] * 4 + b[3] * 2 + b[4];
            var m = b[5] * 4 + b[6] * 2 + b[7];
            return { s: s, e: e, m: m, val: s * (1 + m / 8) * Math.pow(2, e - 7) };
        }
        function draw() {
            tiles.innerHTML = "";
            for (var i = 0; i < 8; i++)(function (idx) {
                var grp = idx === 0 ? "g0 gap" : (idx <= 4 ? (idx === 4 ? "g1 gap" : "g1") : "g2");
                var t = mk(tiles, "button", "bit " + grp + (bits[idx] ? " on" : ""), String(bits[idx]));
                t.style.width = "36px";
                t.style.height = "48px";
                t.onclick = function () { bits[idx] = 1 - bits[idx]; beep(420, 35); draw(); };
            })(i);
            var ev = evalBits(bits);
            subEl.innerHTML = "Your fields: S=" + bits[0] + " · E=" + ev.e + " (2<sup>" + (ev.e - 7) + "</sup>) · M=1." + bits.slice(5).join("");
        }
        function next() {
            var pool = (lvl("fpu") >= 2 || solved >= 3) ? easyPool.concat(hardPool) : easyPool;
            cur = pool[rand(0, pool.length - 1)];
            bits = [0, 0,1,1,1, 0,0,0];
            targetEl.innerHTML = "Encode: <span style='color:#be2a78'>" + cur.val + "</span>";
            hintEl.innerHTML = (lvl("fpu") >= 2 ? "Lv" + lvl("fpu") + " FPU: fractional &amp; negative exponents active!" : "Tip: Pick Sign, then E = (power of 2) + 7, then 1.MMM");
            g.info("solved " + solved);
            draw();
        }
        checkBtn.onclick = function () {
            var ev = evalBits(bits);
            if (Math.abs(ev.val - cur.val) < 1e-6) {
                solved++;
                g.good(cur.val < 1 && cur.val > -1 ? 18 : 14, "✔ " + cur.val + " = " + bits.join(""), "fpu_float");
                next();
            } else {
                g.bad("Got " + ev.val + " (expected " + cur.val + ")", "fpu_float");
            }
        };
        next();
    }
};
