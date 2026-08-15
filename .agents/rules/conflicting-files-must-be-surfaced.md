---
trigger: always_on
---

If two files contradict each other (e.g., design.md shows a screen not in phases.md's current scope, or database.md is missing a field prd.md requires), Gemini must surface the conflict to the user before proceeding, rather than picking one silently. Trigger: Automatic — surfaced the moment a conflict is detected.