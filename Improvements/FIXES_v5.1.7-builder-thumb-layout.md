# v5.1.7 — Auto Schedule interaction layout re-verified

## Review of 5.1.6
Horizontal filters fixed the vertical stack, but:
- 5 rows of **top sticky** chrome still ate grid space
- Save / Auto sat at the **top** (hard for thumbs)
- App still tried to **force landscape** orientation

## Interaction-first layout (5.1.7)

**Top (filters only)**  
1. Month + Change  
2. Primary filters — horizontal swipe  
3. Sub filters — horizontal swipe  

**Middle** — schedule grid (maximum height)

**Bottom sticky (thumb zone)**  
1. Sequence + Clear  
2. Cancel | Auto Generate | Save (48px)  
3. Drag legend  

Also: **no landscape lock** on open — portrait is first-class.  
Modal uses flex column + safe-area padding on the footer.
