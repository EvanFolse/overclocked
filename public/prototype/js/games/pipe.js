
// games/pipe.js: Simplified Hazard Lab
// ---------------------------------------------------------

GAMES.pipe = {
    icon: "🏭",
    title: "HAZARD LAB",
    time: 70,
    stars: [80, 170, 260],
    badPenalty: 12,

    menuIntro: true,
    about: "Two instructions share the pipeline. Read whether B needs a register that A is still producing, then pick the fix: Continue, Forward, or Stall. Tap a card below for the rule of thumb.",
    rule: "",
    introKeyTitle: "PICK A FIX",
    introKey: ""
        + accCard("▶️", "Continue", "No dependency", "1",
            keyDef("When", "B does not read the register A is writing")
            + keyDef("Ex", "ADD R1,R2,R3 then SUB R4,R5,R6")
            + keyDef("Do", "Let both keep going with no wait"))
        + accCard("⚡", "Forward", "Result already calculated", "2",
            keyDef("When", "B needs A's result, and A already finished the math")
            + keyDef("Ex", "ADD R1,R2,R3 then SUB R4,R1,R5")
            + keyDef("Do", "Pass the result straight to B instead of waiting for write-back"))
        + accCard("⏸️", "Stall", "Still loading from memory", "3",
            keyDef("When", "A is a load (LW) and B needs that value right away")
            + keyDef("Ex", "LW R1,0(R2) then ADD R3,R1,R4")
            + keyDef("Do", "Wait one cycle for memory, then forward")),
    keyTitle: "QUICK REFERENCE",
    key: "<div class='key-cols'>" +
        "<div class='key-col'><span class='key-num'>Key 1</span><b>CONTINUE</b><small>No dependency</small><div class='key-ex'>B does not need<br>A's register</div></div>" +
        "<div class='key-col'><span class='key-num'>Key 2</span><b>FORWARD</b><small>Pass result</small><div class='key-ex'>A finished math<br>B needs it now</div></div>" +
        "<div class='key-col'><span class='key-num'>Key 3</span><b>STALL</b><small>Wait 1 cycle</small><div class='key-ex'>LW then use<br>before MEM done</div></div>" +
        "</div>",

    start: function (g, arena) {

        // =========================================
        // GAME STATE
        // =========================================

        var currentCase = null;
        var previousType = -1;
        var locking = false;
        var solved = 0;

        // =========================================
        // GENERATE RANDOM REGISTERS
        // =========================================

        function pickRegs(count) {

            var pool = [
                "R1", "R2", "R3", "R4",
                "R5", "R6", "R7"
            ];

            var result = [];

            while (result.length < count) {

                var index = rand(0, pool.length - 1);

                result.push(pool[index]);

                pool.splice(index, 1);
            }

            return result;
        }

        // =========================================
        // GENERATE A HAZARD SCENARIO
        // =========================================

        function makeCase() {

            var r = pickRegs(6);
            var type;

            // Avoid repeating the same scenario type.

            do {
                type = rand(0, 2);
            } while (type === previousType);

            previousType = type;

            // INDEPENDENT INSTRUCTIONS

            if (type === 0) {

                return {
                    a: "ADD " + r[0] + ", " + r[1] + ", " + r[2],

                    aDesc: "Adds " + r[1] + " and " + r[2]
                        + " to produce " + r[0] + ".",

                    aStatus: "Result calculated",

                    b: "SUB " + r[3] + ", " + r[4] + ", " + r[5],

                    bDesc: "Subtracts " + r[5] + " from " + r[4]
                        + ".",

                    bStatus: "Needs " + r[4] + " and " + r[5],

                    best: 0,

                    confKey: "pipe_none",

                    success: "Both instructions can continue independently.",

                    hint: "The second instruction does not need "
                        + r[0] + ". No waiting is necessary.",

                    result: "▶ Both instructions advance"
                };
            }

            // ARITHMETIC DATA DEPENDENCY

            if (type === 1) {

                return {
                    a: "ADD " + r[0] + ", " + r[1] + ", " + r[2],

                    aDesc: "Adds " + r[1] + " and " + r[2]
                        + " to produce " + r[0] + ".",

                    aStatus: "Result calculated, not written back",

                    b: "SUB " + r[3] + ", " + r[0] + ", " + r[4],

                    bDesc: "Subtracts " + r[4] + " from " + r[0]
                        + ".",

                    bStatus: "Needs " + r[0] + " to execute",

                    best: 1,

                    confKey: "pipe_fwd",

                    success: r[0] + " forwarded directly to Instruction B.",

                    hint: r[0] + " has already been calculated. "
                        + "It can be passed directly to the next instruction.",

                    result: "A ── " + r[0] + " ──▶ B"
                };
            }

            // LOAD-USE DATA DEPENDENCY

            return {
                a: "LW " + r[0] + ", 0(" + r[1] + ")",

                aDesc: "Loads data from memory into " + r[0] + ".",

                aStatus: "Memory access not finished",

                b: "ADD " + r[2] + ", " + r[0] + ", " + r[3],

                bDesc: "Adds " + r[0] + " and " + r[3] + ".",

                bStatus: "Needs " + r[0] + " to execute",

                best: 2,

                confKey: "pipe_loaduse",

                success: "Waited one cycle for memory, then forwarded "
                    + r[0] + ".",

                hint: r[0] + " is still being loaded from memory. "
                    + "The result is not ready to forward yet.",

                result: "⏸ Wait 1 cycle → Forward " + r[0]
            };
        }

        // =========================================
        // COMPACT GAME CONTAINER
        // =========================================

        var container = mk(arena, "div", "", "");

        Object.assign(container.style, {
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            fontSize: "12px",
            lineHeight: "1.3"
        });

        // =========================================
        // INSTRUCTION CARDS
        // =========================================

        function createCard(label) {

            var card = mk(container, "div", "", "");

            Object.assign(card.style, {
                border: "1px solid #64748b",
                borderRadius: "6px",
                padding: "6px 8px",
                background: "rgba(128,128,128,0.08)"
            });

            var title = mk(card, "div", "", label);

            Object.assign(title.style, {
                fontSize: "10px",
                fontWeight: "bold",
                opacity: "0.7"
            });

            var instruction = mk(card, "div", "", "");

            Object.assign(instruction.style, {
                fontWeight: "bold",
                fontFamily: "monospace",
                fontSize: "14px",
                marginTop: "2px"
            });

            var description = mk(card, "div", "", "");

            Object.assign(description.style, {
                fontSize: "11px",
                marginTop: "2px"
            });

            var status = mk(card, "div", "", "");

            Object.assign(status.style, {
                fontSize: "11px",
                fontWeight: "bold",
                marginTop: "3px"
            });

            return {
                box: card,
                instruction: instruction,
                description: description,
                status: status
            };
        }

        var cardA = createCard("INSTRUCTION A");

        var connection = mk(
            container, "div", "", "↓ Next instruction"
        );

        Object.assign(connection.style, {
            textAlign: "center",
            fontSize: "11px",
            fontWeight: "bold"
        });

        var cardB = createCard("INSTRUCTION B");

        // =========================================
        // QUESTION
        // =========================================

        var question = mk(
            container,
            "div",
            "",
            "How should the CPU proceed?"
        );

        Object.assign(question.style, {
            fontWeight: "bold",
            textAlign: "center",
            marginTop: "2px"
        });

        // =========================================
        // ACTION BUTTONS
        // =========================================

        var buttons = mk(container, "div", "", "");

        Object.assign(buttons.style, {
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "4px"
        });

        var actions = [
            ["▶ CONTINUE", "1 · Run normally"],
            ["⚡ FORWARD", "2 · Pass result"],
            ["⏸ STALL", "3 · Wait one cycle"]
        ];

        actions.forEach(function (action, index) {

            var button = mk(buttons, "button", "", "");

            Object.assign(button.style, {
                padding: "6px 3px",
                border: "1px solid #64748b",
                borderRadius: "6px",
                background: "rgba(128,128,128,0.12)",
                color: "inherit",
                cursor: "pointer",
                fontSize: "11px",
                minWidth: "0"
            });

            var name = mk(button, "div", "", action[0]);

            name.style.fontWeight = "bold";

            var detail = mk(button, "div", "", action[1]);

            Object.assign(detail.style, {
                fontSize: "10px",
                marginTop: "2px"
            });

            button.onclick = function () {
                choose(index);
            };
        });

        // =========================================
        // FEEDBACK
        // =========================================

        var feedback = mk(
            container, "div", "", "Inspect the instructions."
        );

        Object.assign(feedback.style, {
            textAlign: "center",
            fontSize: "11px",
            minHeight: "28px",
            padding: "3px"
        });

        // =========================================
        // DISPLAY THE NEXT SCENARIO
        // =========================================

        function next() {

            locking = false;

            currentCase = makeCase();

            cardA.instruction.textContent = currentCase.a;
            cardA.description.textContent = currentCase.aDesc;
            cardA.status.textContent = currentCase.aStatus;

            cardB.instruction.textContent = currentCase.b;
            cardB.description.textContent = currentCase.bDesc;
            cardB.status.textContent = currentCase.bStatus;

            cardA.status.style.color =
                currentCase.best === 2
                    ? "#d97706"
                    : "#22c55e";

            cardB.status.style.color = "#94a3b8";

            cardA.box.style.borderColor = "#64748b";
            cardB.box.style.borderColor = "#64748b";

            connection.textContent = "↓ Next instruction";
            connection.style.color = "inherit";

            feedback.textContent = "Inspect the instructions.";
            feedback.style.color = "inherit";

            g.info("Solved: " + solved);
        }

        // =========================================
        // HANDLE PLAYER ACTION
        // =========================================

        function choose(index) {

            if (locking || !currentCase) {
                return;
            }

            if (index === currentCase.best) {

                locking = true;
                solved++;

                cardA.box.style.borderColor = "#22c55e";
                cardB.box.style.borderColor = "#22c55e";

                cardA.status.textContent = "Ready";
                cardB.status.textContent = "Ready";

                cardA.status.style.color = "#22c55e";
                cardB.status.style.color = "#22c55e";

                connection.textContent = currentCase.result;
                connection.style.color = "#22c55e";

                feedback.textContent = currentCase.success;
                feedback.style.color = "#22c55e";

                // Brief visual animation.

                if (connection.animate) {

                    connection.animate([
                        { opacity: 0.2, transform: "scale(0.95)" },
                        { opacity: 1, transform: "scale(1)" }
                    ], {
                        duration: 350,
                        easing: "ease-out"
                    });
                }

                g.good(
                    20,
                    "CORRECT!",
                    currentCase.confKey
                );

                g.after(1400, next);

            } else {

                feedback.textContent = currentCase.hint;
                feedback.style.color = "#ef4444";

                g.bad(
                    "Incorrect action!",
                    currentCase.confKey
                );
            }
        }

        // =========================================
        // KEYBOARD CONTROLS
        // =========================================

        g.onKey = function (key) {

            if (["1", "2", "3"].includes(key)) {

                choose(Number(key) - 1);

                return true;
            }

            return false;
        };

        next();
    }
};
