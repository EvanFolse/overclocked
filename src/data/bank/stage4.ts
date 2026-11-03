import type { StageBank } from "@/data/bank/types";

/**
 * Stage 4 · The Memory Hierarchy
 *
 * Source: memory-hierarchy-content.md (team) — authored here because the markdown
 * file was not present in the repo at implementation time. Topics, hierarchy order,
 * and learning goals follow the Stage 4 brief.
 *
 * Required: 6 multiple choice, 2 matching sets. Spare: 3 multiple choice, 1 matching set.
 * SRAM/DRAM are taught as technologies, not extra hierarchy levels.
 */
export const STAGE_4_BANK: StageBank = {
  stageId: 4,

  reading:
    "Computer systems organize storage as a memory hierarchy: registers, L1, L2, and L3 cache, then RAM, then secondary storage (SSD, HDD, optical, tape). Moving down the pyramid, capacity grows and cost per bit falls, but latency rises. Upper levels are usually volatile SRAM-based; main memory is typically DRAM; storage is nonvolatile. SRAM and DRAM are technologies used to build levels—they are not extra bands in the sequence. A cache hit serves data from a nearby level; a miss forces a slower lookup farther away.",
  readingDraft: true,

  mc: [
    // ---------- Required (6) ----------
    {
      id: "s4-ms-01",
      group: "mission",
      concept: "Registers",
      scenario:
        "A tight loop keeps reloading the same three integers from L1 even though they fit in the core. Which level should hold those hot values for the lowest latency?",
      choices: [
        "L3 Cache",
        "RAM",
        "Registers",
        "SSD",
        "L2 Cache",
      ],
      correctIndex: 2,
      hint: "What is faster and closer to the ALU than even L1?",
      explanation:
        "Registers are the fastest storage and sit inside the core. Hot values that fit should live there rather than bouncing through cache.",
      draft: true,
    },
    {
      id: "s4-ms-02",
      group: "mission",
      concept: "Cache miss / RAM",
      scenario:
        "The core looks in L1, L2, and L3 and still cannot find the data. Where does the request go next in a typical hierarchy?",
      choices: [
        "Registers",
        "Optical disc",
        "Magnetic tape",
        "RAM (main memory)",
        "HDD only",
      ],
      correctIndex: 3,
      hint: "After the last-level cache, what is the system's main working memory?",
      explanation:
        "A miss through L1–L3 goes to main memory (RAM), usually DRAM. Storage devices are only involved if the OS must page or load from disk.",
      draft: true,
    },
    {
      id: "s4-mc-01",
      concept: "L1 Cache",
      scenario:
        "Which cache level is typically the smallest, fastest, and closest to a CPU core?",
      choices: [
        "L3 Cache",
        "L1 Cache",
        "L2 Cache",
        "RAM",
        "SSD",
      ],
      correctIndex: 1,
      hint: "Think of the first place the core checks after registers.",
      explanation:
        "L1 is the smallest and fastest on-chip cache, usually private to a core and often split into instruction and data caches.",
      draft: true,
    },
    {
      id: "s4-mc-02",
      concept: "L3 Cache",
      scenario:
        "On many multicore CPUs, which cache level is often large and shared among cores as a last-level cache?",
      choices: [
        "Registers",
        "L1 Cache",
        "L2 Cache",
        "L3 Cache",
        "DRAM modules outside the chip",
      ],
      correctIndex: 3,
      hint: "Which on-chip cache is usually the last stop before main memory and may be shared?",
      explanation:
        "L3 is commonly the shared last-level cache: larger and slower than L1/L2, but still much faster than RAM.",
      draft: true,
    },
    {
      id: "s4-mc-03",
      concept: "SRAM vs DRAM",
      scenario:
        "Why do caches typically use SRAM while main memory typically uses DRAM?",
      choices: [
        "SRAM is cheaper per bit and denser than DRAM",
        "DRAM never needs refreshing, so it is ideal for L1",
        "SRAM is faster but less dense; DRAM is denser and cheaper per bit",
        "DRAM is nonvolatile and SRAM is not",
        "SRAM can only be placed off-chip",
      ],
      correctIndex: 2,
      hint: "Trade speed and transistor count against density and cost.",
      explanation:
        "SRAM cells are fast and need no refresh but use more transistors, so they suit small caches. DRAM is denser and cheaper, so it suits large main memory, at the cost of refresh and higher latency.",
      draft: true,
    },
    {
      id: "s4-mc-04",
      concept: "Hierarchy trade-offs",
      scenario:
        "Moving from the top of the memory hierarchy toward secondary storage, which pattern is generally true?",
      choices: [
        "Speed increases, capacity shrinks, cost per bit rises",
        "Speed falls, capacity grows, cost per bit falls",
        "Speed and capacity both rise, cost stays flat",
        "Only volatility changes; size and speed stay the same",
        "Latency falls while capacity stays fixed",
      ],
      correctIndex: 1,
      hint: "Faster memory is scarce and expensive; slower storage is plentiful and cheap.",
      explanation:
        "Down the hierarchy, latency and capacity generally increase while cost per bit decreases. That is why systems keep hot data high and cold data low.",
      draft: true,
    },

    // ---------- Spare (3) ----------
    {
      id: "s4-mc-05",
      spare: true,
      concept: "SSD vs HDD",
      scenario:
        "Compared with a hard disk drive (HDD), what is a typical advantage of an SSD?",
      choices: [
        "Much lower cost per bit at every capacity",
        "Lower latency and no mechanical seek delay",
        "Data is always stored in volatile DRAM cells",
        "Higher latency but unlimited rewrite life",
        "It must be refreshed like DRAM",
      ],
      correctIndex: 1,
      hint: "Which one has moving parts, and which does not?",
      explanation:
        "SSDs use flash with no moving parts, so they avoid mechanical seek and rotational delay. HDDs are usually cheaper per bit at high capacity but much slower for random access.",
      draft: true,
    },
    {
      id: "s4-mc-06",
      spare: true,
      concept: "Volatile vs nonvolatile",
      scenario:
        "Which statement correctly contrasts volatile and nonvolatile storage?",
      choices: [
        "Registers and RAM keep data after power-off; SSDs do not",
        "Volatile memory loses contents without power; nonvolatile storage retains them",
        "Only optical discs are volatile",
        "DRAM is nonvolatile because capacitors hold charge forever",
        "Cache is nonvolatile and tape is volatile",
      ],
      correctIndex: 1,
      hint: "What happens to RAM contents when you unplug the machine?",
      explanation:
        "Volatile memory (registers, SRAM caches, DRAM) loses data without power. Nonvolatile storage (SSD, HDD, optical, tape) retains data for long-term use.",
      draft: true,
    },
    {
      id: "s4-mc-07",
      spare: true,
      concept: "Optical Disc / Magnetic Tape",
      scenario:
        "Which storage medium is best suited to low-cost, high-capacity archival backup where sequential access is acceptable?",
      choices: [
        "CPU registers",
        "L1 Cache",
        "Magnetic tape",
        "SRAM scratchpad only",
        "L3 Cache",
      ],
      correctIndex: 2,
      hint: "Think of cold storage used in data centers for archives.",
      explanation:
        "Magnetic tape offers huge capacity at very low cost per bit but with slow sequential access—ideal for archives, not for interactive working sets. Optical discs are also archival/removable but typically smaller.",
      draft: true,
    },
  ],

  matching: [
    // ---------- Required (2) ----------
    {
      id: "s4-match-01",
      concepts: ["Registers", "L1 Cache", "L2 Cache", "L3 Cache"],
      pairs: [
        {
          item: "Registers",
          description:
            "Tiny, fastest storage inside the CPU core for values in use right now",
        },
        {
          item: "L1 Cache",
          description:
            "Smallest and fastest on-chip cache, usually private and closest to the core",
        },
        {
          item: "L2 Cache",
          description:
            "Larger, slightly slower mid-level cache that often remains private to a core",
        },
        {
          item: "L3 Cache",
          description:
            "Large last-level cache, often shared across cores before main memory",
        },
      ],
      distractor: "A compiler pass that removes unused functions from a binary",
      hint: "Order by size and distance from the core: registers first, then L1, L2, and shared L3.",
      draft: true,
    },
    {
      id: "s4-match-02",
      concepts: ["RAM", "SRAM", "DRAM", "SSD"],
      pairs: [
        {
          item: "RAM",
          description:
            "Main working memory of the system; typically large, volatile, and slower than cache",
        },
        {
          item: "SRAM",
          description:
            "Fast memory technology used in caches and registers; no refresh, low density",
        },
        {
          item: "DRAM",
          description:
            "Dense main-memory technology that stores bits as charge and must be refreshed",
        },
        {
          item: "SSD",
          description:
            "Nonvolatile flash storage with no moving parts; slower than RAM, faster than HDD",
        },
      ],
      distractor: "A network protocol that assigns IP addresses automatically",
      hint: "Separate hierarchy roles (RAM, SSD) from technologies (SRAM, DRAM).",
      draft: true,
    },

    // ---------- Spare (1) — remaining storage terms ----------
    {
      id: "s4-match-03",
      concepts: ["HDD", "Optical Disc", "Magnetic Tape", "Cache hit"],
      pairs: [
        {
          item: "HDD",
          description:
            "Magnetic spinning platters with a moving head; high capacity, high latency",
        },
        {
          item: "Optical Disc",
          description:
            "Removable media such as CD/DVD/Blu-ray read by laser; durable distribution copies",
        },
        {
          item: "Magnetic Tape",
          description:
            "Sequential archival storage with huge capacity and the lowest cost per bit",
        },
        {
          item: "Cache hit",
          description:
            "Requested data is found in a nearby cache level, avoiding a slower trip farther down",
        },
      ],
      distractor: "A GPU shader that paints pixels for a video game",
      hint: "Three items are storage media; one describes finding data already in cache.",
      spare: true,
      draft: true,
    },
  ],

  openFirst: {
    id: "s4-oe-01",
    prompt:
      "Name three levels of the memory hierarchy (from fastest toward slowest) and briefly say what each is for.",
    fullAt: 3,
    halfAt: 2,
    groups: [
      {
        label: "Registers",
        terms: [["register", "registers"]],
        near: ["fast", "fastest", "core", "cpu", "operand", "temporary"],
      },
      {
        label: "L1 / cache",
        terms: [["l1", "level 1", "cache"]],
        near: ["fast", "on-chip", "core", "hit", "close"],
      },
      {
        label: "L2",
        terms: [["l2", "level 2"]],
        near: ["larger", "slower", "private", "cache"],
      },
      {
        label: "L3",
        terms: [["l3", "level 3", "llc", "last-level", "last level"]],
        near: ["shared", "large", "cache"],
      },
      {
        label: "RAM",
        terms: [["ram", "main memory", "dram"]],
        near: ["working", "volatile", "program", "gigabyte", "gb"],
      },
      {
        label: "Storage",
        terms: [["ssd", "hdd", "disk", "storage", "tape", "optical"]],
        near: ["nonvolatile", "permanent", "slow", "capacity", "archive"],
      },
    ],
    explanation:
      "Any three in hierarchy order work, for example: registers (hottest values in the core), L1/L2/L3 caches (keep frequent data near the CPU), RAM (main working memory), and storage (SSD/HDD/tape for durable data).",
    draft: true,
  },

  openPool: [
    {
      id: "s4-oe-02",
      prompt:
        "Explain the difference between SRAM and DRAM, and say which hierarchy roles each usually fills.",
      fullAt: 3,
      halfAt: 2,
      groups: [
        {
          label: "SRAM traits",
          terms: [["sram", "static"]],
          near: ["fast", "cache", "register", "no refresh", "refresh", "dense", "density"],
        },
        {
          label: "DRAM traits",
          terms: [["dram", "dynamic"]],
          near: ["refresh", "capacitor", "dense", "main memory", "ram", "cheap"],
        },
        {
          label: "Roles",
          terms: [["cache"], ["ram", "main memory"]],
          need: 2,
        },
      ],
      explanation:
        "SRAM is fast and needs no refresh but is less dense—used for registers and caches. DRAM is denser and cheaper, needs refresh, and implements most main memory (RAM).",
      draft: true,
    },
    {
      id: "s4-oe-03",
      prompt:
        "Why is faster memory generally smaller and more expensive per bit than slower storage?",
      fullAt: 2,
      halfAt: 1,
      groups: [
        {
          label: "Technology / cost",
          terms: [
            ["sram"],
            ["transistor"],
            ["cost"],
            ["expensive"],
            ["area"],
            ["die"],
          ],
          need: 1,
        },
        {
          label: "Capacity trade-off",
          terms: [
            ["capacity"],
            ["small"],
            ["smaller"],
            ["dense"],
            ["density"],
            ["latency"],
            ["speed"],
          ],
          need: 1,
        },
      ],
      explanation:
        "Fast memory (often SRAM on-die) uses more area and cost per bit, so only small amounts fit near the core. Slower technologies (DRAM, flash, disk, tape) are denser and cheaper, so systems put bulk capacity farther away.",
      draft: true,
    },
    {
      id: "s4-oe-04",
      prompt:
        "What is the difference between a cache hit and a cache miss, and what happens after a miss?",
      fullAt: 2,
      halfAt: 1,
      groups: [
        {
          label: "Hit",
          terms: [["hit"]],
          near: ["found", "cache", "fast", "nearby"],
        },
        {
          label: "Miss",
          terms: [["miss"]],
          near: ["ram", "memory", "next", "slower", "fetch", "lower"],
        },
      ],
      explanation:
        "A hit means the data was found in the checked cache level. A miss means it was not, so the request continues to a slower level (another cache or RAM), which costs more latency.",
      draft: true,
    },
  ],
};
