# v5.1.3 — Schedule vs Print shift counts + red “A” on General

## Issues
1. **On-screen:** General Shift summary row showed a red/pink **🅰️** badge (A-Shift icon) because `G` was missing from `_shiftRowColorMap` and fell through to the A palette.
2. **Print:** Summary only counted **D / N / L**, so **G (General)** counts never appeared even when the grid was full of G cells.

## Fixes
1. Added `G` to `_shiftRowColorMap` → blue 🔵 + General colours.
2. Print summary builds rows from **active shift config** (+ O/L/G/status codes), same idea as on-screen: only codes with count &gt; 0, then Total.

## Files
- `js/schedule/app-schedule.js`
- `js/team/app-team-print-learn.js`
