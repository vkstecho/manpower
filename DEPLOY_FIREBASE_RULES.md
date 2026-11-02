# Mentor Firebase rules (payment history across devices)

Project: **mentor-vkstech**

1. Firebase Console → Realtime Database → **Rules**
2. Paste contents of `database.rules.json` (or merge the nodes below)
3. **Publish**

Required paths:
- `mentor_guidance/{mobile}` — full student data including payments
- `mentor_guidance_index/{mobile}` — list of students for mentor
- `mentor_notifications/{mentorMobile}/{paymentId}` — pending queue
- `mentor_payments/{mobile}` — payments array mirror

`.write: auth != null` requires user is signed in (phone OTP or anonymous after OTP flow).

After deploy: student books session → mentor opens Payment History on any device → sees pending → Approve & Unlock.
