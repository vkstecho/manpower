# v5.1.6 — Auto Schedule builder mobile layout

## Problem
On phone portrait, filters/actions stacked into a broken column:
- Primary filters (Department/Machines/…) beside title → vertical stack
- Sub-filters (All, Assistant, …) vertical column on the left
- Clear / Sequence / Save / Cancel / Auto Generate scattered mid-screen
- Large empty space, hard to tap

## Solution
Sticky header restructured into **clear rows**:

1. **Title + Change** (one row)
2. **Primary filters** — horizontal scroll, no wrap
3. **Sub-filters** — horizontal scroll chips (larger touch targets)
4. **Sequence + Clear**
5. **Save | Cancel | Auto Generate** — equal flex, 44px min height

CSS: `.sb-hscroll` hides scrollbar; `.sb-prim-btn` consistent sizing.

Landscape toast only on very narrow phones (≤360px).
