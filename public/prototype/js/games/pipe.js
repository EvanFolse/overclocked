// games/pipe.js: Procedural Hazard Lab (no register/Gantt spoilers)
// ---------------------------------------------------------
GAMES.pipe = {
    icon: "🏭",
    title: "HAZARD LAB",
    time: 70,
    stars: [80, 170, 260],
    badPenalty: 12,
    menuIntro: true,
    about: "Pipelining lets the CPU work on different stages of several instructions at once. Sometimes those instructions collide. Spot the hazard, then choose the fix a real five-stage pipeline would use.",
    rule: "",
    introKeyTitle: "PIPELINE &amp; FIXES",
    introKey: ""
        + accCard("🏭", "Five Stages", "How one instruction flows", "",
            keyDef("IF", "Instruction Fetch from memory")
            + keyDef("ID", "Instruction Decode / read regs")
            + keyDef("EX", "Execute in the ALU")
            + keyDef("MEM", "Memory access if needed")
            + keyDef("WB", "Write results back to registers"))
        + accCard("▶️", "Run Normally", "No hazard in the way", "1",
            keyDef("When", "Instructions use independent registers")
            + keyDef("Ex", "ADD R1,R2,R3 then SUB R4,R5,R6")
            + keyDef("Do", "Let both continue with no extra wait"))
        + accCard("⚡", "Forward Data", "Pass a result early", "2",
            keyDef("When", "The next instruction needs a value still in EX")
            + keyDef("Ex", "ADD R1,R2,R3 then AND R4,R1,R5")
            + keyDef("Do", "Forward instead of waiting for write-back"))
        + accCard("⏸️", "Stall 1 Cycle", "Pause until data is ready", "3",
            keyDef("When", "A load result is needed immediately after")
            + keyDef("Ex", "LW R1,[..] then ADD R2,R1,R3")
            + keyDef("Do", "Insert one bubble so MEM can finish"))
        + accCard("🚿", "Flush Path", "Wrong path was fetched", "4",
            keyDef("When", "A taken branch or jump changes direction")
            + keyDef("Ex", "BEQ that is taken after later ops were fetched")
            + keyDef("Do", "Discard the wrong-path instructions")),
    keyTitle: "QUICK REFERENCE",
    key: "<div class='pipe-stage-bar'>IF fetch · ID decode · EX execute · MEM memory · WB write-back</div>"
        + "<div class='key-cols cols-4'>" +
        "<div class='key-col'><span class='key-num'>Key 1</span><b>NORMAL</b><small>No hazard</small><div class='key-ex'>Independent<br>registers</div></div>" +
        "<div class='key-col'><span class='key-num'>Key 2</span><b>FORWARD</b><small>Pass result</small><div class='key-ex'>Needs value<br>still in EX</div></div>" +
        "<div class='key-col'><span class='key-num'>Key 3</span><b>STALL 1</b><small>Wait 1 cycle</small><div class='key-ex'>Load-use<br>(LW then use)</div></div>" +
        "<div class='key-col'><span class='key-num'>Key 4</span><b>FLUSH</b><small>Wrong path</small><div class='key-ex'>Taken branch<br>or jump</div></div>" +
        "</div>",
    start: function (g, arena) {
        var ops = ["ADD", "SUB", "AND", "OR", "XOR"];
        function pickRegs(count) {
            var pool = ["R1", "R2", "R3", "R4", "R5", "R6", "R7"], out = [];
            while (out.length < count) {
                var r = pool[rand(0, pool.length - 1)];
                if (out.indexOf(r) === -1) out.push(r);
            }
            return out;
        }
        function makeCase(use3) {
            var r = pickRegs(7), opA = ops[rand(0, ops.length - 1)], opB = ops[rand(0, ops.length - 1)];
            var kinds = use3 ? ["sched_ok", "adj_load", "clean3", "branch2", "fwd2"] : ["clean2", "fwd2", "loaduse2", "struct2", "branch2"];
            var k = kinds[rand(0, kinds.length - 1)];

            if (k === "clean2") {
                return {
                    a: opA + " " + r[0] + ", " + r[1] + ", " + r[2],
                    b: opB + " " + r[3] + ", " + r[4] + ", " + r[5],
                    tag: "Clean (0 Stalls)", best: 0, confKey: "pipe_none",
                    rows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "EX", "MEM", "WB", "", ""]],
                    solvedRows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "EX", "MEM", "WB", "", ""]],
                    cpi: "1.00",
                    whyBad: ["", r[3] + " reads " + r[4] + "," + r[5] + " (not " + r[0] + ") → 0 stalls!", "No RAW dependency → no stall!", "Not a branch!"]
                };
            }
            if (k === "fwd2") {
                var swapSrc = Math.random() < 0.5;
                return {
                    a: opA + " " + r[0] + ", " + r[1] + ", " + r[2],
                    b: opB + " " + r[3] + ", " + (swapSrc ? r[4] + ", " + r[0] : r[0] + ", " + r[4]),
                    tag: "EX→EX Forward", best: 1, confKey: "pipe_fwd",
                    rows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "EX", "MEM", "WB", "", ""]],
                    solvedRows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "EX⚡", "MEM", "WB", "", ""]],
                    cpi: "1.00",
                    whyBad: ["B reads " + r[0] + " written by A!", "", "ALU finishes " + r[0] + " at EX → Forward (0 stalls)!", "Not a branch!"]
                };
            }
            if (k === "loaduse2") {
                return {
                    a: "LW  " + r[0] + ", 0(" + r[1] + ")",
                    b: opB + " " + r[2] + ", " + r[0] + ", " + r[3],
                    tag: "Load-Use: 1 Stall", best: 2, confKey: "pipe_loaduse",
                    rows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "EX", "MEM", "WB", "", ""]],
                    solvedRows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "🫧", "EX⚡", "MEM", "WB", ""]],
                    cpi: "1.50",
                    whyBad: [r[0] + " isn't loaded from memory yet!", "LW finishes MEM at C4 → 1 cycle too late for EX!", "", "Don't flush a valid instruction!"]
                };
            }
            if (k === "struct2") {
                return {
                    a: "LW  " + r[0] + ", 0(" + r[1] + ") [MEM]",
                    b: "IFETCH Inst [1 Mem Port]",
                    tag: "Structural: 1 Stall", best: 2, confKey: "pipe_struct",
                    rows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "", "", "IF", "ID", "EX", "MEM", "WB"]],
                    solvedRows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "", "", "🫧", "IF", "ID", "EX", "MEM"]],
                    cpi: "1.50",
                    whyBad: ["MEM and IF collide on the single memory port at C4!", "Forwarding fixes registers, not a 1-port memory bus!", "", "Stall IF 1 cycle instead of flushing!"]
                };
            }
            if (k === "branch2") {
                return {
                    a: "BEQ " + r[0] + ", " + r[1] + ", L1 (TAKEN)",
                    b: opB + " " + r[2] + ", " + r[3] + ", " + r[4] + " (PC+4)",
                    tag: "Branch Flush", best: 3, confKey: "pipe_branch",
                    rows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "EX", "MEM", "WB", "", ""]],
                    solvedRows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "FLUSH", "—", "—", "", ""]],
                    cpi: "1.50",
                    whyBad: ["Wrong-path " + opB + " would corrupt " + r[2] + "!", "Forwarding can't undo a wrong-path fetch!", "Stalling keeps the wrong-path instruction!", ""]
                };
            }
            if (k === "sched_ok") {
                return {
                    a: "LW  " + r[0] + ", 0(" + r[1] + ")",
                    b: opA + " " + r[2] + ", " + r[3] + ", " + r[4],
                    c: opB + " " + r[5] + ", " + r[0] + ", " + r[6],
                    tag: "Scheduled! MEM→EX Fwd", best: 1, confKey: "pipe_sched",
                    rows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "EX", "MEM", "WB", "", ""], ["", "", "IF", "ID", "EX", "MEM", "WB", ""]],
                    solvedRows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "EX", "MEM", "WB", "", ""], ["", "", "IF", "ID", "EX⚡", "MEM", "WB", ""]],
                    cpi: "1.00",
                    whyBad: ["C reads " + r[0] + " from LW → needs MEM→EX Fwd!", "", "Unrelated B already filled the 1-cycle load slot → 0 extra stalls!", "No branch taken!"]
                };
            }
            if (k === "adj_load") {
                return {
                    a: "LW  " + r[0] + ", 0(" + r[1] + ")",
                    b: opA + " " + r[2] + ", " + r[0] + ", " + r[3],
                    c: opB + " " + r[4] + ", " + r[5] + ", " + r[6],
                    tag: "Adjacent Load-Use: 1 Stall", best: 2, confKey: "pipe_loaduse",
                    rows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "EX", "MEM", "WB", "", ""], ["", "", "IF", "ID", "EX", "MEM", "WB", ""]],
                    solvedRows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "🫧", "EX⚡", "MEM", "WB", ""], ["", "", "IF", "ID", "🫧", "EX", "MEM", "WB"]],
                    cpi: "1.33",
                    whyBad: ["B immediately reads " + r[0] + " before LW's MEM stage!", "LW finishes MEM at C4, too late for B's EX at C4!", "", "Don't flush valid work!"]
                };
            }
            return {
                a: opA + " " + r[0] + ", " + r[1] + ", " + r[2],
                b: opB + " " + r[3] + ", " + r[4] + ", " + r[5],
                c: "ADD " + r[6] + ", " + r[1] + ", " + r[4],
                tag: "3-Inst Clean Pipe", best: 0, confKey: "pipe_none",
                rows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "EX", "MEM", "WB", "", ""], ["", "", "IF", "ID", "EX", "MEM", "WB", ""]],
                solvedRows: [["IF", "ID", "EX", "MEM", "WB", "", "", ""], ["", "IF", "ID", "EX", "MEM", "WB", "", ""], ["", "", "IF", "ID", "EX", "MEM", "WB", ""]],
                cpi: "1.00",
                whyBad: ["", "All destination registers (" + r[0] + "," + r[3] + "," + r[6] + ") are independent!", "0 stalls needed!", "No branch!"]
            };
        }

        var labels = [["✅ RUN NORMALLY", "1 · No hazard (0 stalls)"], ["🔁 FORWARD DATA", "2 · EX/MEM→EX (0 stalls)"], ["⏸️ STALL 1 CYCLE", "3 · Load-Use / 1-Port Mem"], ["🧹 FLUSH PATH", "4 · Taken branch"]];
        var cur = null, solved = 0, locking = false, ganttWrap = mk(arena, "div", "", ""); ganttWrap.style.width = "100%";
        var card = mk(arena, "div", "pinfo", ""), row = mk(arena, "div", "fixrow", "");
        for (var i = 0; i < 4; i++)(function (idx) { mk(row, "button", "fixbtn", labels[idx][0] + "<small>" + labels[idx][1] + "</small>").onclick = function () { pick(idx); }; })(i);
        function clsOf(v) { return (v === "🫧" || v === "FLUSH") ? "bub" : v.indexOf("⚡") !== -1 ? "fwd" : v && v !== "—" ? "stg" : ""; }
        function drawGantt(rows, st) {
            var names = ["A", "B", "C"];
            var body = rows.map(function (r, idx) {
                return "<tr><td><b>" + names[idx] + "</b></td>" + r.map(function (v) { return "<td class='" + clsOf(v) + "'>" + v + "</td>"; }).join("") + "</tr>";
            }).join("");
            ganttWrap.innerHTML = "<table class='gantt'><tr><th>Inst</th><th>C1</th><th>C2</th><th>C3</th><th>C4</th><th>C5</th><th>C6</th><th>C7</th><th>C8</th></tr>" + body + "</table><div class='mono' style='font-size:11px;color:#4a47c8;margin-top:4px;text-align:right;'>" + st + "</div>";
        }
        function next() {
            locking = false;
            var u3 = (lvl("pipe") >= 2 || solved >= 3) && Math.random() < 0.6;
            cur = makeCase(u3);
            drawGantt(cur.rows, u3 ? "3-Inst Pipeline · Inspect rd vs rs1/rs2" : "Inspect registers &amp; cycle overlap");
            card.innerHTML = "<div><b>A:</b> " + cur.a + "</div><div style='margin-top:2px'><b>B:</b> " + cur.b + "</div>" + (cur.c ? "<div style='margin-top:2px'><b>C:</b> " + cur.c + "</div>" : "");
            g.info("solved " + solved);
        }
        function pick(idx) {
            if (!cur || locking) return;
            if (idx === cur.best) {
                solved++; locking = true;
                drawGantt(cur.solvedRows, "✅ " + cur.tag + " · CPI " + cur.cpi);
                g.good(cur.c ? 25 : 20, "✔ " + cur.tag + " (CPI " + cur.cpi + ")", cur.confKey);
                g.after(950, next);
            } else g.bad(cur.whyBad[idx], cur.confKey);
        }
        g.onKey = function (k) { if (k >= "1" && k <= "4") { pick(Number(k) - 1); return true; } return false; };
        next();
    }
};
