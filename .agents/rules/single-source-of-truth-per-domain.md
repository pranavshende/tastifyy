---
trigger: always_on
---

Each file owns one domain and must not be duplicated elsewhere:

architecture.md → system structure, modules, data flow, tech stack decisions
phases.md → what is being built now vs. later, phase boundaries, milestones
prd.md → product requirements, goals, methodology, scope
database.md → schema, tables, fields, relations, migrations
design.md → UI/UX structure, screens, components, style decisions
test.md → test cases, phase-wise testing status, pass/fail state
rules.md → hard constraints Gemini must always follow
memory.md → dated log of what was actually done/changed If information could belong in two files, it goes in the more specific one only, with a one-line cross-reference in the other. Trigger: Automatic — structural convention Gemini enforces on every write.