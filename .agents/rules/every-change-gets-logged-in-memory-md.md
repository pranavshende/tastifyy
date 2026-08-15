---
trigger: always_on
---

After any code change, decision, or fix, Gemini appends an entry to memory.md with: date, what changed, why, and which files were touched. Entries are additive (append, don't rewrite history). This is the project's changelog and must never be skipped, even for small fixes. Trigger: Automatic — logged after every change, never on request only.