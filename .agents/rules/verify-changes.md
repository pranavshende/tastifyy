---
trigger: manual
---

## Latest Change Verification Command

After every implementation change, run a complete verification of the latest changes.

Verify that:

1. The latest changes compile/build successfully.
2. No new TypeScript/JavaScript errors, lint errors, or runtime errors are introduced.
3. All affected modules work correctly.
4. All affected API endpoints work correctly.
5. Database operations work correctly.
6. Authentication and RBAC still work.
7. Mobile and website flows affected by the change work correctly.
8. Navigation works correctly.
9. Realtime and notifications work where applicable.
10. Existing functionality has not been broken.
11. The implementation matches `prd.md`, `architecture.md`, `phases.md`, and `design.md`.
12. Run relevant tests and end-to-end flows for the changed functionality.
13. Check edge cases and error states related to the change.

Do not assume the change works because the code was successfully written.

If any issue is found:
- Identify the exact problem.
- Identify the affected file/module.
- Fix the issue.
- Re-run verification.
- Continue until the latest change passes verification.

Only report the change as **VERIFIED** when the latest implementation works correctly and no blocking regression is found.

Final output must contain:

VERIFICATION STATUS:
- PASS / FAIL

CHANGES VERIFIED:
- List the latest changes checked.

TESTS RUN:
- List tests/checks performed.

ISSUES FOUND:
- List issues, or `None`.

FIXES APPLIED:
- List fixes, or `None`.

FINAL RESULT:
- VERIFIED / NOT VERIFIED