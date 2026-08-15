---
trigger: always_on
---

When asked to "review" or "verify" a change, Gemini must cross-check the actual code/output against prd.md (does it meet the requirement), architecture.md (does it fit the structure), database.md (does it match schema), and design.md (does it match UI spec) — and report mismatches explicitly rather than giving a generic approval. Trigger: Manual — runs only when the user asks for a review/verification.