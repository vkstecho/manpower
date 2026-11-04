# 2.5.68 — Handoff hierarchy (UNCATEGORISED / Vivek missing)

## Why UNCATEGORISED after Vivek → Keshav
Admin hierarchy only listed `mobileUsers.role === 'manager'`.
If handoff updated **employees.managerId** but **mobileUsers** promote failed (PERMISSION),
Keshav stayed `member` → **UNCATEGORISED**, with a Manager button.

## Why Vivek not in Team
Handoff marks Vivek `left_team`, removes/clears his `mobileUsers`.
By design he leaves the active team. Next OTP = fresh user (not old manager roster).
His name belongs under **Left Members**, not active Team.

## Fixes
1. Hierarchy: anyone who **owns active employees** via `managerId` is shown as Manager (even if role still member)
2. Those users are removed from UNCATEGORISED
3. Handoff: always promote **employee** row; mobileUsers promote is best-effort with clear warning
4. Admin can still **Repair managers list** or tap **Manager** on Keshav once

## After deploy
Admin → Team → **Repair managers list** once (optional if hierarchy already derives from roster)
