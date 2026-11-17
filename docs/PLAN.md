# Overclocked: team plan and status

Course deadline: **Mon Nov 30, 2026** (CSC 3501 Game-Based Learning Project).
US Thanksgiving is **Thu Nov 26**, so assume **nobody works Nov 25-29**. Real feature deadline: **Tue Nov 24**.

## 1. What we are shipping
A static HTML5 game in `games/cpu-builder/` (copied from `public/prototype/`). No build step, no install.

Grading (same grade for everyone, only people who contribute get credit):

| Category | Weight | What helps us |
|---|---|---|
| Technical content | 30% | accurate hardware ideas: datapath, pipeline hazards, cache, benchmark (CPU time = IC x CPI x cycle) |
| Educational experience | 40% | the mechanic itself makes you reason (hazard lab, golden rescue, benchmark choices), feedback explains why |
| Game design and implementation | 30% | works in a browser, clear instructions, no console errors |

## 2. Architecture (read `public/prototype/ARCHITECTURE.md`)
Plain `<script>` files, one file = one owner. Load order is in `index.html`. Each minigame is `js/games/<key>.js`.
Status: PR #6 and PR #8 are merged, `main` has the new prototype (Nov 17). Branch from `main` now.

## 3. Decisions (reply with a thumbs up, or object by Thu 11/19)
1. Final submission = the HTML prototype in `public/prototype/` (not the Next.js app). Proposed: yes.
2. Currency name replacing "CP" (professor's request): "Instructions", and rename the stat card to "ISA SIZE"?

## 4. Tasks and owners (edit the names, one owner per task)

| Task | Files | Owner | Due | Status |
|---|---|---|---|---|
| Merge #6 then #8 | - | Gary | Tue 11/17 | done |
| Timing bar (professor request) | `index.html`, `ui.js`, `style.css` | Evan | Fri 11/20 | |
| Rename "CP" (professor request), text only | all UI strings | Evan | Fri 11/20 | |
| Chip eras | new `js/era.js` | Evan | Sun 11/22 | |
| Clock game: pick the clock period from unit delays | `js/games/clock.js` | TODO | Sun 11/22 | |
| FPU game: sign / exponent / mantissa bits (IEEE 754) | `js/games/fpu.js` | TODO | Sun 11/22 | |
| L1 game: predict hit or miss before the reveal | `js/games/l1.js` | TODO | Sun 11/22 | |
| Golden Chip, welcome, benchmark, README, thumbnail, games.yml | `golden.js` `welcome.js` `benchmark.js` | Gary | Tue 11/24 | |
| Playtest with 2 outside people, write down where they got stuck | - | TODO | Mon 11/23 | |

Rules: branch from `main`, small PRs, one reviewer, do not edit someone else's file.

## 5. Submission checklist (Gary does the final PR on Nov 27, not Nov 30)
- [ ] `games/cpu-builder/index.html` runs from GitHub Pages (relative paths only)
- [ ] `README.md`: description, learning objectives, how to play, authors, AI-use note
- [ ] `thumbnail.png` 800x450, PNG, under 500 KB
- [ ] one entry in `_data/games.yml` (title, authors, topic, description, learning_objective, game_url, thumbnail)
- [ ] folder under 35 MB, no console errors, tested on a clean browser profile
- [ ] every member's name in README and in at least one commit

## 6. Daily check-in (post in Discord by 9 pm, one line each)
`done: ...  | next: ...  | blocked by: ...`
