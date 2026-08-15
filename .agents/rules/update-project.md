---
trigger: manual
---

## Update Rule

Whenever the project is updated, modified, fixed, reviewed, tested, or verified, the AI must first inspect the current state of the relevant files inside `D:\tastifyy\Project` and the existing source code. The AI must determine what has actually changed and identify which project documents are affected before making updates.

After any meaningful implementation change, the AI must keep the Project Knowledge Base synchronized. Check `prd.md` for requirement changes, `architecture.md` for architectural changes, `database.md` for schema or relationship changes, `design.md` for UI/UX changes, `phases.md` for development progress, `test.md` for testing and verification results, and `memory.md` for important historical changes or decisions. Do not update files that are not actually affected.

The AI must never mark a feature or phase as completed only because code has been written. It must verify the implementation and run the relevant tests before using `VERIFIED` or `VERIFIED COMPLETE`. If the implementation exists but testing is incomplete, use `IMPLEMENTED — NOT VERIFIED`. If testing is blocked, use `BLOCKED`. If documentation and implementation disagree, use `DOCUMENTATION MISMATCH` until the conflict is resolved.

Whenever a change affects existing functionality, perform regression testing on the related features. When a database, API, authentication, authorization, payment, navigation, or shared component is changed, inspect all dependent functionality before declaring the change complete.

Every meaningful update must be recorded accurately. Update `test.md` with the actual test result and date, update `phases.md` when development progress changes, and update `memory.md` when the change represents an important implementation decision, bug fix, architecture change, database change, milestone, or project-state change. Never fabricate test results, dates, completion status, or historical information.

Before finalizing an update, perform a synchronization check across:

```text
prd.md
architecture.md
database.md
design.md
phases.md
test.md
memory.md
rules.md
```

The AI must ensure that the documentation, source code, database, UI, testing status, and project phase describe the same current system. If a conflict cannot be resolved from the available project information, do not guess; clearly report the conflict and ask for clarification when necessary.

For every update, the AI must report what was changed, which files were affected, what was tested, the actual test results, the current verification status, remaining issues, and the recommended next step.
