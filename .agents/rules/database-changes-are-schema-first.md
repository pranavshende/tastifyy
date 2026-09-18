---
trigger: manual
---

Any change touching data models must be written into database.md (tables, fields, types, relations) before or in the same step as the corresponding code. Gemini must not introduce a field, table, or relation in code that isn't reflected in database.md. Trigger: Automatic — enforced on every data-model change.