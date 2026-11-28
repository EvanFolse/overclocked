# Submitting Overclocked to the course repo (CSC 3501)

Course repo: https://github.com/riseatlsu/CSC-3501-Fall-2026
Deadline: Nov 30, 2026. Only ONE pull request for the whole team.

## Before you start (check in our repo, branch main)

`public/prototype/` must contain all three of these:

- `index.html`
- `README.md` (everyone's row and AI line filled in)
- `thumbnail.png` (800 x 450, PNG, under 500 KB)

Run `git pull origin main` in our repo first so you copy the latest files.

## 1. Fork the course repo (once)

On GitHub, open the course repo, click **Fork**, then **Create fork**.

## 2. Clone your fork and make a branch

Replace YOUR_USERNAME and the path to our repo (OUR_REPO) below.

```
cd ~
git clone https://github.com/YOUR_USERNAME/CSC-3501-Fall-2026.git
cd CSC-3501-Fall-2026
git checkout -b add-overclocked
mkdir -p games/overclocked
cp -R OUR_REPO/public/prototype/. games/overclocked/
```

## 3. Add our gallery entry (only append, do not edit other entries)

Our entry is saved in our own repo as `submission/games-entry.yml` (all four full names are already filled in). Append it to the course repo's file:

```
printf "\n" >> _data/games.yml
cat OUR_REPO/submission/games-entry.yml >> _data/games.yml
tail -20 _data/games.yml
```

The last lines should show our entry after the two example games.

## 4. Check before pushing

```
grep -n REPLACE _data/games.yml
for f in index.html README.md thumbnail.png; do test -f games/overclocked/$f && echo "OK   $f" || echo "MISSING $f"; done
grep -n "fill in" games/overclocked/README.md
du -sh games/overclocked
python3 -m http.server 8010
```

- The first command must print nothing (no REPLACE left).
- All three files must say OK.
- `grep "fill in"` should print nothing.
- Size must be well under 35 MB.
- Open http://localhost:8010/games/overclocked/index.html and play a bit. No red errors in the browser console (F12).

Press Ctrl+C to stop the server.

## 5. Push and open the pull request

```
git add -A games/overclocked _data/games.yml
git status -sb
git commit -m "Add Overclocked: CPU Builder"
git push -u origin add-overclocked
```

`git status` should only list files under `games/overclocked/` and `_data/games.yml`.

On GitHub click **Compare & pull request** (base: riseatlsu/CSC-3501-Fall-2026 main).

Title: `Add Overclocked: CPU Builder`

Description:

```
Overclocked is an idle learning game for CSC 3501. Players build a 3D CPU by
passing 10 mini games (control unit, ALU, registers, clock, decoder, pipeline,
L1/L2 cache, FPU, multi-core), repair hardware faults, and test the CPU on
real workloads.

- Game: games/overclocked/ (index.html, README.md, thumbnail.png)
- Gallery entry: added one entry to _data/games.yml
- Team: Bruce Brown, Evan Folse, Jacob Wear, Gary Ye
- Runs in the browser with no install; tested locally under /games/overclocked/
```

Use **Create draft pull request** first if some names or files are still missing. Click **Ready for review** before the deadline.

## 6. If something changes later

Copy the files again (step 2 last line), re-check (step 4), then `git add -A`, `git commit`, `git push`. The pull request updates automatically.
