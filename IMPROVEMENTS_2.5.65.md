# 2.5.65 — Handoff PERMISSION, Team name bug, MetCost auto

## 1. Manager Leave / Transfer handoff → PERMISSION_DENIED
- Require phone OTP (`_ensureWriteAuth`) before handoff
- RTDB `mobileUsers` rules: approved manager may
  - remove / mark left **own** node
  - promote successor when `transferredFrom` / `approvedBy: auto_handoff:…`
  - update team members under their managerId
- Deploy **database.rules.json** with the app

## 2. Team card name `VIVEK ${L(...)}`
- Fixed nested template: `(You)` / `(आप)` now evaluates correctly

## 3. Team card role line
- Dedupes repeated Manager / same resp+designation

## 4. MetCost Target tab auto fields empty
- Auto rows no longer wiped by empty DOM reads
- Always compute Wastage Loss, Conversion, Total from rates + editable inputs
- Default wastage % 1.3 when blank so Conversion fills

## Deploy
1. Host app files
2. Publish Firebase RTDB rules from this package
3. Manager: logout → OTP login → retry handoff
