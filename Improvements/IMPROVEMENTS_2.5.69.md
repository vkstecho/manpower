# 2.5.69 — MR Skill Hub theme toggle

## Problem
Moon/sun on MR Skill Hub did not visibly change the screen (cards stayed same; only weak CSS).

## Fix
1. Full light/dark CSS for hub background, header, MetCost & MRM cards
2. Theme classes on cards (not only header)
3. Toggle forces background color + toast confirmation
4. MetCost / MRM iframes receive theme via postMessage + shared localStorage key
