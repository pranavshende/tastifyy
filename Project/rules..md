Rule 1: role-based-access-is-mandatory

Description: Every feature must enforce strict separation across the four roles — Customer, Restaurant Partner, Delivery Partner, Admin. No API or screen may expose another role's data. Restaurant/delivery access is limited strictly to their own data. File: rules.md Trigger: Automatic

Rule 2: no-raw-payment-data-storage

Description: Never store raw card data on Tastifyy servers. All payment handling goes through Razorpay; only tokens/references are persisted. PCI-aware handling is non-negotiable, not a "phase 2" hardening item. File: rules.md Trigger: Automatic

Rule 3: financial-values-are-admin-configurable

Description: Commission %, delivery fee, platform fee, coupon limits, Tastifyy Coins value, subscription pricing, and ad pricing must never be hardcoded — they must read from Admin-Panel-configurable settings so they can change without an app release. File: rules.md Trigger: Automatic

Rule 4: duplicate-order-prevention-required

Description: Every checkout/payment code path must implement idempotency to block a second charge from the same cart submission (double-tap, network retry). No payment flow is "done" without this. File: rules.md Trigger: Automatic

Rule 5: sponsored-content-must-be-labeled

Description: Any paid or sponsored listing/ad must be visually labeled as sponsored/promoted in the UI. This is a trust requirement, not optional styling. File: rules.md Trigger: Automatic

Rule 6: low-bandwidth-first

Description: Core screens (Home, Search, Restaurant, Cart) must be built and tested for low-bandwidth, mid-range Android conditions by default — not treated as an edge case to optimize later. File: rules.md Trigger: Automatic

Rule 7: location-data-minimization

Description: Customer location/contact info may be shared with a delivery partner only for the duration and purpose of an active order — never persisted or exposed beyond that scope. File: rules.md Trigger: Automatic

Rule 8: no-24-7-delivery-claims

Description: UI copy and logic must never conflate "24/7 app access" with "24/7 delivery." Availability must always be derived from real operating-hours data, never assumed. File: rules.md Trigger: Automatic

Rule 9: rent-and-earn-is-unvalidated

Description: The Rent & Earn concept is explicitly marked unfinalized in the PRD. Gemini must not scaffold or build it until the user explicitly confirms it's approved. File: rules.md Trigger: Automatic to flag / Manual to approve

Rule 10: audit-logging-for-admin-actions

Description: All sensitive Admin Panel actions (approvals, financial config changes, user/restaurant bans, etc.) must be logged for audit purposes. File: rules.md Trigger: Automatic

Rule 11: phase-scope-lock

Description: Do not build Phase 2/3 features (AI Assistant, weather recs, advanced personalization, Rent & Earn, etc.) while Phase 1 (MVP) is still active, unless the user explicitly asks to jump ahead. File: rules.md Trigger: Automatic to flag / Manual to override

Rule 12: prd-version-is-locked

Description: PRD v2.0 (Section 74 onward) supersedes v1.0. Where v2.0 updates a role, feature, or priority defined earlier in the document, the v2.0 version is authoritative. File: prd.md Trigger: Automatic

Rule 13: priority-matrix-drives-build-order

Description: Build order must follow the Section 74.19 Feature Priority Matrix (P0 → P1 → P2 → P3, mapped to Phase 1/2/3). Don't build a P2/P3 item while a P0/P1 item in the same phase is incomplete, unless the user explicitly overrides. File: prd.md Trigger: Automatic to flag / Manual to override

Rule 14: unfinalized-features-flagged

Description: Any feature explicitly marked proposed/unfinalized in the PRD (currently: Rent & Earn) must be flagged as "not approved for build" in any plan or status report until the PRD itself is updated to confirm it. File: prd.md Trigger: Automatic

Rule 15: acceptance-criteria-is-the-definition-of-done

Description: The acceptance criteria in Sections 65/74.23 (and any per-feature criteria) are the literal bar for "done." test.md entries must map directly to these criteria — a feature isn't complete because it "works," it's complete because it meets its stated criteria. File: prd.md Trigger: Automatic

Rule 16: revenue-model-changes-require-doc-update

Description: Any change to commission %, delivery margin, platform fee, subscription pricing, or ad pricing logic must be reflected in PRD Sections 43/52 before or alongside implementation — never shipped as a silent code-only change. File: prd.md Trigger: Automatic to flag / Manual to apply

Rule 17: new-feature-requests-go-through-prd-first

Description: A feature not already described in the PRD isn't scaffolded directly into code. It must first be added to prd.md (with priority, phase, and acceptance criteria) — this keeps phases.md, test.md, and the PRD from drifting apart. File: prd.md Trigger: Manual (needs user to confirm/add)

Rule 18: cross-role-scope-respected-in-prd

Description: A feature touching multiple roles (e.g., Group Order affects Customer + Admin; Last-Minute Deals affects Restaurant + Customer) must be represented in each relevant role's PRD section, not folded into just one. File: prd.md Trigger: Automatic

Rule 19: success-metrics-tracked-per-feature

Description: When building any feature listed in Sections 68/74.22, Gemini should note which success metric it's meant to move (e.g., "AI query → add-to-cart rate") so instrumentation isn't an afterthought. File: prd.md Trigger: Automatic