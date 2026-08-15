# Database Schema

*Cross-reference: Data models, tables, fields, and relationships.*

## Core Entities (Proposed)
- **Users**: Customers, Admin.
- **Restaurants**: Traditional, Cloud Kitchens, Home Kitchens. Includes profile, location, timings, and service radius.
- **Delivery Partners**: Full-time, part-time. Includes availability schedule and location.
- **Menus & Items**: Food items, categories, variants, inventory/stock, Last-Minute Deals.
- **Orders**: Cart, items, pricing, splitting, tracking status.
- **Payments**: Razorpay references, refunds, split bill tracking.
- **Advertisements**: Campaigns, views, clicks.
- **Coupons/Offers**: Rules, limits, eligibility, funding ownership.

## Schema Rule
Any change touching data models must be written into this file before or in the same step as the corresponding code.

*(Detailed schema and fields to be defined before implementation)*
