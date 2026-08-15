# Architecture

*Cross-reference: System structure, modules, data flow, and tech stack decisions.*

## System Ecosystem
Tastifyy is composed of four connected interfaces, all backed by a single central platform:

1. **Customer App**: Mobile-first app (and companion web experience) for discovery, ordering, and tracking. Must be usable on low bandwidth, mid-range Android devices.
2. **Restaurant Partner Panel**: Web/tablet dashboard for order and menu management, promotions, and analytics.
3. **Delivery Partner Panel**: Mobile app for accepting deliveries, navigation hand-off, and earnings.
4. **Admin Panel**: Internal web console for platform oversight, approvals, configuration, and finance.
5. **Central Platform**: The backend ordering engine, payments (Razorpay), notifications, and AI services.

## Data Flow
- `[ Customer App ]` → places order → `[ TASTIFYY CENTRAL PLATFORM ]` → routes order → `[ Restaurant Partner Panel ]`
- `[ TASTIFYY CENTRAL PLATFORM ]` → assigns delivery → `[ Delivery Partner Panel ]` → updates status → `[ Customer App ]` (live tracking)
- `[ Admin Panel ]` ⇄ oversees & configures ⇄ `[ TASTIFYY CENTRAL PLATFORM ]` (users, restaurants, delivery partners, payments, ads, commissions)

## Tech Stack
*(Pending implementation decisions for front-end frameworks, backend languages, and infrastructure)*
