# 2.5.71 — Manager Change Company Name (promoted managers)

## Bug
A member promoted to Manager (handoff / Admin → Manager button) saw **Change Company Name** but:
1. Gate used only `SESSION.role === 'manager'` — not `isMgr()` → toast "Manager only"
2. Current showed **—** because `SESSION.company` was never set on promote
3. Team sync used role-only manager key

## Fix
- Open/Save allow `isMgr()` (employee accessLevel/manager) as well as role
- Load company from mobileUsers / employee if session blank
- Save writes company + companyId; reinforces role manager; syncs team by managerId
- Clearer OTP / permission error messages
