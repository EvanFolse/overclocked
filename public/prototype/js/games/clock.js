
// games/clock.js
// ---------------------------------------------------------

GAMES.clock = {
    icon: "⏱️",
    title: "CLOCK SYNC",
    time: 30,
    stars: [80, 150, 220],
    badPenalty: 10,

    menuIntro: true,
    about: "Each clock cycle shows one instruction. Start CU, ALU, Registers, and Memory so their signals settle before the automatic edge. Only two can process at once, so kick off the slowest tasks first. Times and slot limits are a game simplification, not literal chip timing.",
    rule: "",
    introKeyTitle: "HOW TO SYNC",
    introKey: ""
        + accCard("🧩", "Four Components", "Tap or use keys 1-4", "1-4",
            keyDef("1", "Control Unit")
            + keyDef("2", "ALU")
            + keyDef("3", "Registers")
            + keyDef("4", "Memory")
            + keyDef("Play", "Read the instruction, then start each part that still says WAITING"))
        + accCard("⚙️", "Two Slots", "Only two at once", "",
            keyDef("Rule", "At most two components can process at the same time")
            + keyDef("Tip", "Start the longest bars first so they finish before the edge")
            + keyDef("Free", "When one finishes, start the next waiting part"))
        + accCard("⏱️", "Clock Edge", "Deadline for all four", "",
            keyDef("Goal", "Have all four READY before the timer hits zero")
            + keyDef("Score", "More ready parts = more points that cycle")
            + keyDef("Miss", "Anything still processing or waiting fails the edge")),
    keyTitle: "QUICK REFERENCE",
    key: "<div class='key-cols cols-4'>" +
        "<div class='key-col'><span class='key-num'>Key 1</span><b>CU</b><small>Control Unit</small><div class='key-ex'>Decode /<br>next-PC</div></div>" +
        "<div class='key-col'><span class='key-num'>Key 2</span><b>ALU</b><small>Math &amp; logic</small><div class='key-ex'>Often the<br>slowest bar</div></div>" +
        "<div class='key-col'><span class='key-num'>Key 3</span><b>REGS</b><small>Registers</small><div class='key-ex'>Read / write<br>operands</div></div>" +
        "<div class='key-col'><span class='key-num'>Key 4</span><b>MEM</b><small>Memory</small><div class='key-ex'>Slow on<br>LOAD/STORE</div></div>" +
        "</div>",

    start: function (g, arena) {

        // =========================================
        // GAME STATE
        // =========================================

        var startAt = Date.now();
        var cycleStart = startAt;
        var cycleDuration = 6000;
        var cycleNumber = 1;

        var maxProcessing = 2;
        var previousInstruction = -1;

        // =========================================
        // INSTRUCTION TYPES
        // =========================================

        // Processing times are ordered:
        // Control Unit, ALU, Registers, Memory

        var instructionTypes = [
            {
                name: "ADD — Integer addition",
                description: "Add two register values and prepare the result. The ALU does the arithmetic; data memory is not accessed.",
                times: [1400, 2400, 1800, 500],
                tasks: [
                    "Decode ADD",
                    "Add operands",
                    "Read operands / prepare result",
                    "Remain idle"
                ]
            },
            {
                name: "MUL — Integer multiplication",
                description: "Multiply two register values. Multiplication has a longer modeled ALU delay.",
                times: [1200, 3600, 1400, 600],
                tasks: [
                    "Decode MUL",
                    "Multiply operands",
                    "Prepare result register",
                    "Remain idle"
                ]
            },
            {
                name: "LOAD — Read from memory",
                description: "Calculate an address and retrieve data for a register. Memory access is the longest task.",
                times: [1500, 1400, 900, 3800],
                tasks: [
                    "Decode LOAD",
                    "Calculate address",
                    "Prepare destination register",
                    "Retrieve data"
                ]
            },
            {
                name: "STORE — Write to memory",
                description: "Prepare a register value and its destination address for a memory write.",
                times: [1400, 1200, 1800, 3400],
                tasks: [
                    "Decode STORE",
                    "Calculate address",
                    "Read source value",
                    "Prepare memory write"
                ]
            },
            {
                name: "BRANCH — Conditional jump",
                description: "Compare values and decide which instruction address comes next. Control and comparison dominate.",
                times: [2800, 2200, 800, 600],
                tasks: [
                    "Prepare next-PC selection",
                    "Compare operands",
                    "Read comparison values",
                    "Remain idle"
                ]
            },
            {
                name: "AND — Bitwise logic",
                description: "Combine two register values bit by bit. The ALU performs a relatively simple logic operation.",
                times: [1200, 1600, 1400, 500],
                tasks: [
                    "Decode AND",
                    "Perform bitwise AND",
                    "Prepare result register",
                    "Remain idle"
                ]
            }
        ];

        var components = [
            { name: "Control Unit", key: "1" },
            { name: "ALU", key: "2" },
            { name: "Registers", key: "3" },
            { name: "Memory", key: "4" }
        ];

        // =========================================
        // CLOCK DISPLAY
        // =========================================

        var clockLabel = mk(
            arena, "div", "", "CLOCK CYCLE 1"
        );

        clockLabel.style.textAlign = "center";
        clockLabel.style.fontWeight = "bold";
        clockLabel.style.marginBottom = "8px";

        var instructionTitle = mk(
            arena, "div", "", ""
        );

        instructionTitle.style.fontWeight = "bold";

        var instructionDescription = mk(
            arena, "div", "", ""
        );

        Object.assign(instructionDescription.style, {
            fontSize: "12px",
            marginBottom: "8px"
        });

        var slotLabel = mk(
            arena, "div", "", "Processing slots: 0/2"
        );

       Object.assign(slotLabel.style, {
            textAlign: "center",
            marginBottom: "2px",
            fontWeight: "bold",
            fontSize: "12px"
                });

        var clockTrack = mk(arena, "div", "", "");

        Object.assign(clockTrack.style, {
            width: "100%",
            height: "20px",
            background: "rgba(128,128,128,0.2)",
            borderRadius: "8px",
            overflow: "hidden",
            marginBottom: "8px"
        });

        var clockFill = mk(clockTrack, "div", "", "");

        Object.assign(clockFill.style, {
            width: "100%",
            height: "100%",
            background: "#3b82f6",
            borderRadius: "8px"
        });

        var clockTime = mk(arena, "div", "", "");

        clockTime.style.textAlign = "center";
        clockTime.style.marginBottom = "12px";

        // =========================================
        // COMPONENT BUTTONS
        // =========================================

        var componentGrid = mk(arena, "div", "", "");

        Object.assign(componentGrid.style, {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "8px"
        });

        components.forEach(function (part, index) {

            part.button = mk(
                componentGrid, "button", "", ""
            );

            Object.assign(part.button.style, {
                padding: "6px 8px",
                border: "2px solid #64748b",
                borderRadius: "6px",
                background: "rgba(128,128,128,0.08)",
                color: "inherit",
                cursor: "pointer",
                textAlign: "left",
                minWidth: "0",
                minHeight: "0",
                fontSize: "12px",
                lineHeight: "1.2"
                    });

            part.title = mk(
                part.button,
                "div",
                "",
                part.key + " — " + part.name
            );

            part.title.style.fontWeight = "bold";

            part.taskLabel = mk(
                part.button, "div", "", ""
            );

            Object.assign(part.taskLabel.style, {
             fontSize: "10px",
            marginTop: "2px"
                });

            part.durationLabel = mk(
                part.button, "div", "", ""
            );

            part.durationLabel.style.fontSize = "12px";
            part.durationLabel.style.marginTop = "4px";

            part.statusLabel = mk(
                part.button, "div", "", "WAITING"
            );

            part.statusLabel.style.fontSize = "12px";
            part.statusLabel.style.fontWeight = "bold";
            part.statusLabel.style.marginTop = "6px";

            part.track = mk(
                part.button, "div", "", ""
            );

            Object.assign(part.track.style, {
                height: "8px",
                background: "rgba(128,128,128,0.2)",
                borderRadius: "4px",
                marginTop: "8px",
                overflow: "hidden"
            });

            part.fill = mk(
                part.track, "div", "", ""
            );

            Object.assign(part.fill.style, {
                width: "0%",
                height: "100%",
                background: "#eab308",
                borderRadius: "4px"
            });

            part.button.onclick = function () {
                activate(index);
            };
        });

        // =========================================
        // GAME INSTRUCTIONS
        // =========================================

        var instructions = mk(
            arena,
            "div",
            "",
            "Only two slots: start slow tasks first, then fill free slots."
        );

        Object.assign(instructions.style, {
            textAlign: "center",
            marginTop: "12px",
            fontSize: "13px"
        });

        // =========================================
        // START A NEW CLOCK CYCLE
        // =========================================

        function resetCycle(now) {

            cycleStart = now;

            var elapsed = now - startAt;

            if (elapsed < 10000) {
                cycleDuration = 6000;
            } else if (elapsed < 20000) {
                cycleDuration = 5500;
            } else {
                cycleDuration = 5000;
            }

            clockLabel.textContent =
                "CLOCK CYCLE " + cycleNumber;

            // Select a new instruction.
            // Prevent the same instruction appearing twice in a row.

            var choice;

            do {
                choice = Math.floor(
                    Math.random() * instructionTypes.length
                );
            } while (choice === previousInstruction);

            previousInstruction = choice;

            var instruction = instructionTypes[choice];

            instructionTitle.textContent =
                instruction.name;

            instructionDescription.textContent =
                instruction.description;

            slotLabel.textContent =
                "Processing slots: 0/2";

            components.forEach(function (part, index) {

                part.duration = instruction.times[index];

                part.taskLabel.textContent =
                    instruction.tasks[index];

                part.startedAt = null;

                part.durationLabel.textContent =
                    "Processing: "
                    + (part.duration / 1000).toFixed(1)
                    + "s";

                part.statusLabel.textContent = "WAITING";
                part.statusLabel.style.color = "#94a3b8";

                part.fill.style.width = "0%";
                part.fill.style.background = "#eab308";

                part.button.style.borderColor = "#64748b";

                part.button.style.background =
                    "rgba(128,128,128,0.08)";
            });
        }

        // =========================================
        // COUNT ACTIVE PROCESSING SLOTS
        // =========================================

        function processingCount(now) {

            return components.filter(function (part) {

                return part.startedAt !== null &&
                    now < part.startedAt + part.duration;

            }).length;
        }

        // =========================================
        // ACTIVATE A COMPONENT
        // =========================================

        function activate(index) {

            var now = Date.now();
            var part = components[index];

            // Prevent activation after the clock edge.

            if (now - cycleStart >= cycleDuration) {
                return;
            }

            // Prevent activating the same component twice.

            if (part.startedAt !== null) {
                return;
            }

            // Only two components may process simultaneously.

            if (processingCount(now) >= maxProcessing) {
                g.info("Both processing slots occupied!");
                return;
            }

            part.startedAt = now;

            slotLabel.textContent =
                "Processing slots: "
                + processingCount(now)
                + "/2";

            part.statusLabel.textContent = "PROCESSING";
            part.statusLabel.style.color = "#eab308";

            part.button.style.borderColor = "#eab308";
        }

        // =========================================
        // EVALUATE THE CLOCK EDGE
        // =========================================

        function evaluateCycle(edgeAt) {

            var ready = 0;

            components.forEach(function (part) {

                if (
                    part.startedAt !== null &&
                    part.startedAt + part.duration <= edgeAt
                ) {
                    ready++;
                }
            });

            if (ready === 4) {

                g.good(
                    40,
                    "PERFECT SYNC! 4/4 READY",
                    "clock_edge"
                );

            } else if (ready === 3) {

                g.good(
                    15,
                    "PARTIAL SYNC! 3/4 READY",
                    "clock_edge"
                );

            } else if (ready === 2) {

                g.good(
                    5,
                    "PARTIAL SYNC! 2/4 READY",
                    "clock_edge"
                );

            } else {

                g.bad(
                    "TIMING FAILURE! " + ready + "/4 READY",
                    "clock_edge"
                );
            }
        }

        // =========================================
        // KEYBOARD CONTROLS
        // =========================================

        g.onKey = function (key) {

            if (["1", "2", "3", "4"].includes(key)) {

                activate(Number(key) - 1);

                return true;
            }

            return false;
        };

        // =========================================
        // MAIN GAME LOOP
        // =========================================

        resetCycle(startAt);

        g.info("Prepare all four components!");

        g.every(16, function () {

            var now = Date.now();

            var elapsed = now - cycleStart;

            var remaining = Math.max(
                0,
                cycleDuration - elapsed
            );

            var clockProgress =
                remaining / cycleDuration;

            clockFill.style.width =
                (clockProgress * 100) + "%";

            clockFill.style.background =
                clockProgress < 0.25
                    ? "#ef4444"
                    : "#3b82f6";

            clockTime.textContent =
                "Next clock edge: "
                + (remaining / 1000).toFixed(2)
                + "s";

            slotLabel.textContent =
                "Processing slots: "
                + processingCount(now)
                + "/2";

            // Update component processing bars.

            components.forEach(function (part) {

                if (part.startedAt === null) {
                    return;
                }

                var progress = Math.min(
                    1,
                    (now - part.startedAt) / part.duration
                );

                part.fill.style.width =
                    (progress * 100) + "%";

                if (progress >= 1) {

                    part.statusLabel.textContent = "READY";
                    part.statusLabel.style.color = "#22c55e";

                    part.fill.style.background = "#22c55e";

                    part.button.style.borderColor = "#22c55e";

                    part.button.style.background =
                        "rgba(34,197,94,0.12)";

                } else {

                    part.fill.style.background = "#eab308";
                }
            });

            // Automatic clock edge.

            if (remaining <= 0) {

                evaluateCycle(cycleStart + cycleDuration);

                cycleNumber++;

                resetCycle(now);
            }
        });
    }
};

