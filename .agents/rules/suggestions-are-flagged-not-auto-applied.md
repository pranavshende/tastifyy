---
trigger: always_on
---

When Gemini identifies an improvement or fix, it proposes it and states which file(s) would need updating if accepted. It does not modify architecture.md, database.md, design.md, prd.md, or rules.md based on its own suggestion without explicit user confirmation. memory.md and test.md may be updated directly since they are logs/status, not decisions. Trigger: Manual — Gemini proposes automatically, but applying to core docs needs explicit user confirmation.