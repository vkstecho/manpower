# v3.1.7
1. G legend: _canonicalizeShiftConfig now keeps G label+start+end (was dropping G → fallback "General")
2. Payment help example uses live defaultDiscountPct (not hardcoded 17%)
3. Save payment settings → close modal + go Home
4. Watchdog: do not force login if mp_session still valid
5. After shift save: cache draft + re-render schedule legend
