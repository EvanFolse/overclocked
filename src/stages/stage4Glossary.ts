import type { Contrast, GlossaryTerm } from "@/stages/glossary";

/**
 * Stage 4 glossary and contrasts for the Tutor (design doc 6.1).
 * DRAFT TEXT: check against the course textbook before release.
 */
export const STAGE_4_GLOSSARY: GlossaryTerm[] = [
  {
    id: "registers",
    name: "Registers",
    aliases: ["register"],
    text: "Registers are the tiniest, fastest storage inside the CPU core. They hold values the processor is using right now. Capacity is tiny; latency is about one cycle.",
  },
  {
    id: "l1",
    name: "L1 Cache",
    aliases: ["l1", "level 1 cache", "l1 cache"],
    text: "L1 is the smallest and fastest on-chip cache, closest to the core. It is often split into instruction and data caches and measured in tens of KB.",
  },
  {
    id: "l2",
    name: "L2 Cache",
    aliases: ["l2", "level 2 cache", "l2 cache"],
    text: "L2 is larger and a bit slower than L1. It is often private to a core and bridges the gap between tiny L1 and shared last-level cache.",
  },
  {
    id: "l3",
    name: "L3 Cache",
    aliases: ["l3", "level 3 cache", "l3 cache", "llc", "last-level cache"],
    text: "L3 is a large last-level cache on many CPUs, often shared across cores. Slower than L1/L2 but still far faster than main memory.",
  },
  {
    id: "ram",
    name: "RAM",
    aliases: ["main memory", "primary memory"],
    text: "RAM is the system's main working memory. It holds running programs and data, is typically DRAM, and is volatile—contents are lost without power.",
  },
  {
    id: "sram",
    name: "SRAM",
    aliases: ["static ram", "static random access memory"],
    text: "SRAM is a fast memory technology that needs no refresh. It is used to build registers and caches. It is not an extra level in the hierarchy by itself.",
  },
  {
    id: "dram",
    name: "DRAM",
    aliases: ["dynamic ram", "dynamic random access memory"],
    text: "DRAM stores bits as charge on capacitors, so it must be refreshed. It is denser and cheaper than SRAM and is the usual technology for main memory (RAM).",
  },
  {
    id: "ssd",
    name: "SSD",
    aliases: ["solid-state drive", "solid state drive", "flash drive"],
    text: "An SSD is nonvolatile flash storage with no moving parts. It is much slower than RAM but typically much faster than an HDD for random access.",
  },
  {
    id: "hdd",
    name: "HDD",
    aliases: ["hard disk", "hard disk drive", "hard drive"],
    text: "An HDD stores data on spinning magnetic platters. It offers large capacity at low cost per bit, but mechanical motion makes latency high.",
  },
  {
    id: "optical",
    name: "Optical Disc",
    aliases: ["cd", "dvd", "blu-ray", "optical disk", "optical media"],
    text: "Optical discs store data as pits read by a laser. They are removable and nonvolatile, useful for distribution and archives, not for high-speed working sets.",
  },
  {
    id: "tape",
    name: "Magnetic Tape",
    aliases: ["tape", "mag tape"],
    text: "Magnetic tape provides huge capacity at very low cost per bit for archival storage. Access is sequential and slow compared with disks or SSDs.",
  },
  {
    id: "storage",
    name: "Storage",
    aliases: ["secondary storage"],
    text: "Storage is the nonvolatile tier below RAM: SSD, HDD, optical discs, and tape. Highest capacity and latency; lowest cost per bit.",
  },
  {
    id: "volatile",
    name: "Volatile memory",
    aliases: ["volatile"],
    text: "Volatile memory loses its contents when power is removed. Registers, SRAM caches, and DRAM (RAM) are volatile.",
  },
  {
    id: "nonvolatile",
    name: "Nonvolatile storage",
    aliases: ["non-volatile", "nonvolatile", "persistent storage"],
    text: "Nonvolatile storage keeps data without power. SSDs, HDDs, optical discs, and tape are nonvolatile.",
  },
  {
    id: "cache-hit",
    name: "Cache hit",
    aliases: ["hit"],
    text: "A cache hit means the requested data was found in the cache level being checked, so the core avoids a slower trip farther down the hierarchy.",
  },
  {
    id: "cache-miss",
    name: "Cache miss",
    aliases: ["miss"],
    text: "A cache miss means the data was not in that cache level. The request continues to a slower level (another cache or RAM), adding latency.",
  },
];

export const STAGE_4_CONTRASTS: Contrast[] = [
  {
    between: ["registers", "l1"],
    text: "Registers are inside the core and hold a handful of values for the current instructions. L1 cache is larger and slightly slower; it holds copies of recently used memory lines, not the architectural register file.",
  },
  {
    between: ["l1", "l2"],
    text: "L1 is smaller and faster; L2 is larger and a bit slower. Both are often private to a core. On a miss in L1, the core typically checks L2 next.",
  },
  {
    between: ["l2", "l3"],
    text: "L2 is usually mid-size and often private. L3 is larger, slower, and often shared across cores as the last-level cache before RAM.",
  },
  {
    between: ["l1", "l3"],
    text: "L1 is tiny and closest to the core; L3 is much larger and farther away (in latency). A hit in L1 is far cheaper than going all the way to L3.",
  },
  {
    between: ["l3", "ram"],
    text: "L3 is still on-chip cache—fast but limited in size. RAM is main memory: much larger and slower, typically DRAM, and outside the last-level cache.",
  },
  {
    between: ["sram", "dram"],
    text: "SRAM is fast and needs no refresh but uses more area per bit—used for caches and registers. DRAM is denser and cheaper, needs refresh, and implements most RAM. Neither is an extra hierarchy band by itself.",
  },
  {
    between: ["ram", "ssd"],
    text: "RAM is volatile working memory with nanosecond-scale access. An SSD is nonvolatile storage with much higher latency. Programs run from RAM; files live on the SSD until loaded.",
  },
  {
    between: ["ssd", "hdd"],
    text: "SSDs use flash with no moving parts and lower latency. HDDs use spinning platters and a moving head: higher latency, often lower cost per bit at large capacities.",
  },
  {
    between: ["volatile", "nonvolatile"],
    text: "Volatile memory (registers, cache, DRAM) forgets when power is gone. Nonvolatile storage (SSD, HDD, optical, tape) keeps data for the long term.",
  },
  {
    between: ["cache-hit", "cache-miss"],
    text: "A hit serves data from the cache level you checked. A miss means you must look farther down—another cache level or RAM—paying more latency.",
  },
  {
    between: ["optical", "tape"],
    text: "Optical discs are removable laser-read media for distribution and modest archives. Magnetic tape targets bulk archival capacity with sequential access and very low cost per bit.",
  },
];
