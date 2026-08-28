# Testing & Verification

*Cross-reference: Test cases, phase-wise testing status, and pass/fail states.*

## Definition of Done
The acceptance criteria in `prd.md` Sections 65 and 74.23 serve as the literal bar for "done". Features must meet their stated criteria to be marked complete.

### Key Acceptance Criteria Reference
- Customer can discover nearby restaurants/food via list and map views.
- Authorized users can switch between non-conflicting roles within the same unified app/website (e.g. from Customer to Restaurant Partner) using a single authentication mechanism.
- Restaurant onboarding supports location, operating hours, and type (including home kitchens).
- Natural-language search returns live, available items.
- AI interprets ingredient-level requests (e.g. "I want tomato").
- Price comparison supports cheap/best-value options.
- Group orders support shareable link and shared cart.
- Split bill supports equal, own-item, and custom amounts.
- Scheduled orders enforce preparation constraints.
- Razorpay handles success, failure, pending, retry, and refunds without duplicate charges.
- Coupons enforce configurable eligibility.
- Last-Minute Deals enforce quantity and expiry limits.

## Test Status

### Phase 1 (MVP)
- **Iteration 1 (Core Auth & Admin Foundation)**: `IMPLEMENTED — NOT VERIFIED`
- **Iteration 2 (Restaurant Onboarding & Menu Management)**: `IMPLEMENTED — NOT VERIFIED`
- **Iteration 3 (Customer Discovery & Cart)**: `IMPLEMENTED — NOT VERIFIED`
- **Iteration 4 (Checkout, Payments & Coupons)**: `IMPLEMENTED — NOT VERIFIED`
- **Iteration 5 (Real-time Order Management & Delivery)**: `IMPLEMENTED — NOT VERIFIED`
- **Iteration 6 (Notifications & Reviews)**: `IMPLEMENTED — NOT VERIFIED`

### Test Infrastructure (2026-08-29)
- **Jest + ts-jest ESM pipeline**: `CONFIGURED` — `tsconfig.test.json` created, `jest.config.js` updated to reference it.
- **Language server Jest types**: `CONFIGURED` — `tests/tsconfig.json` (standalone) created so the TS language server resolves `@types/jest` globals for all test files.
- **`setup.ts` mock types**: `FIXED` — `jest.fn<() => Promise<...>>()` generics added to Supabase mocks; `never` errors resolved.
- **Phase test files (A–P, e2e)**: `READY TO RUN` — no known TypeScript errors in test infrastructure. Functional pass/fail not yet verified.
