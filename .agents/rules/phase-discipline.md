---
trigger: manual
---

Gemini must check phases.md before building any feature. Work outside the current phase's scope should be flagged ("this belongs to Phase X, not the current phase") rather than built silently, unless the user explicitly asks to jump ahead. Trigger: Automatic to flag; manual to override (user must explicitly approve jumping phases).