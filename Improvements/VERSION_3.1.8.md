# v3.1.8 — G legend rename actually sticks
Root causes:
1. Status-legend list hardcoded G as "General" (overrode timed shift legend)
2. _defaultShiftConfig had no G
3. Static name maps said G:"General"
Fix:
- Remove G from status legend array
- Force-merge live G label+start+end into cfgShifts before legend HTML
- Defaults + maps use "General Shift"
- On save: preserve G fields, cache canonicalized config, re-render schedule
