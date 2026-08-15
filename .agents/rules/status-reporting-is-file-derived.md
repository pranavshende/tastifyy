---
trigger: manual
---

When asked "what's the current status of the project," Gemini must derive the answer from phases.md (current phase) + test.md (pass/fail state) + memory.md (latest entries) — not from memory of the conversation alone. It should explicitly state which phase is active and what is tested vs. untested/broken. Trigger: Manual — runs only when the user asks for project status.