Exactly. You don't want `phases.md` to be just a checklist of features.

You want it to be an **implementation roadmap**, where every phase is divided into **modules**, and every module specifies:

1. **Module name**
2. **Purpose**
3. **What to use**
4. **Features to implement**
5. **Dependencies**
6. **Implementation order**
7. **Completion checklist**

And all checkboxes should remain **blank `[ ]`**.

The phase split below follows the PRD: Phase 1 is the core three-sided marketplace, Phase 2 adds AI/retention/advanced ordering, and Phase 3 adds advanced intelligence, business models and scale.  

Here is the structure I recommend for your new `phases.md`:

````md
# Tastifyy — Phase-Wise Implementation Plan

**Cross Reference:**
- `prd.md` → Product requirements and feature scope
- `architecture.md` → System architecture, application flow, modules and navigation
- `design.md` → UI/UX system
- `memory.md` → Development history and implementation decisions

---

# 1. Development Model

Tastifyy is developed as:

- One unified mobile application
- One unified website
- One centralized backend
- One PostgreSQL database
- One authentication system
- One RBAC system
- One order engine
- One payment system
- One delivery system
- One notification/realtime system
- One AI layer

All modules are implemented inside this unified platform.

The phases determine **when a module is implemented**, while `architecture.md` defines **how the modules interact**.

---

# 2. Phase Structure

```text
Phase 0
Foundation
    ↓
Phase 1
Core Marketplace MVP
    ↓
Phase 2
Intelligence & Engagement
    ↓
Phase 3
Scale & Advanced Platform
````

---

# PHASE 0 — FOUNDATION

## Objective

Build the technical foundation required by every future module.

---

# Module 0.1 — Project Foundation

## Purpose

Create the unified project structure for mobile, web and backend.

## What to Use

### Mobile

* Expo React Native
* React Navigation / Expo Router
* TypeScript or project-standard JavaScript structure

### Website

* React
* React Router

### Backend

* Node.js
* Express.js

### Database

* Supabase PostgreSQL

## Features

* [x] Monorepo/project structure
* [x] Mobile application
* [x] Website application
* [x] Backend application
* [x] Shared configuration
* [x] Environment configuration
* [x] Development/production environment separation
* [x] Common API configuration
* [x] Error handling foundation
* [x] Logging foundation

## Dependencies

None.

## Completion Criteria

* [x] Mobile application runs
* [x] Website runs
* [x] Backend runs
* [x] Database connects
* [x] Environment variables work
* [x] Mobile can communicate with backend
* [x] Website can communicate with backend

---

# Module 0.2 — Database Foundation

## Purpose

Create the central database structure used by all roles.

## What to Use

* Supabase PostgreSQL
* Database migrations
* Foreign keys
* Indexes
* Constraints
* Row-level security where applicable

## Core Entities

```text
Users
Roles
User Roles
Sessions
Addresses

Restaurants
Restaurant Documents
Restaurant Hours

Menus
Menu Categories
Menu Items
Inventory

Carts
Cart Items

Orders
Order Items
Order Status History

Payments
Transactions
Refunds

Delivery Partners
Delivery Assignments
Delivery Status

Notifications
Reviews
Coupons
Offers

Audit Logs
Configurations
```

## Features

* [ ] Database schema
* [ ] Relationships
* [ ] Constraints
* [ ] Indexes
* [ ] Seed data
* [ ] Migration system
* [ ] Database security

---

# Module 0.3 — Authentication

## Purpose

Provide a single authentication system for all Tastifyy roles.

## What to Use

* Supabase Auth / centralized authentication layer
* OTP authentication
* Email authentication
* Google authentication where supported
* Session management

## Roles

```text
Customer
Restaurant Partner
Delivery Partner
Advertiser / Business Partner
Admin
```

## Features

* [ ] Registration
* [ ] Login
* [ ] Logout
* [ ] OTP verification
* [ ] Email authentication
* [ ] Google login
* [ ] Session persistence
* [ ] Session expiration
* [ ] Password/account recovery where applicable
* [ ] Guest browsing
* [ ] Device/session management

---

# Module 0.4 — RBAC & Authorization

## Purpose

Control what each role can access.

## What to Use

* Backend authorization middleware
* Role-based permissions
* Resource ownership validation
* Database-level access policies

## Features

* [x] Role resolution
* [x] Active-role selection
* [x] Permission validation
* [x] Route protection
* [x] API protection
* [x] Resource ownership
* [x] Admin authorization
* [x] Restaurant data isolation
* [x] Delivery partner data isolation

## Flow

```text
User
 ↓
Authentication
 ↓
Roles
 ↓
Permissions
 ↓
Resource Ownership
 ↓
Allowed Action
```

---

# Module 0.5 — Unified Navigation

## Purpose

Create role-aware navigation inside the same app and website.

## What to Use

### Mobile

* Expo Router / React Navigation

### Web

* React Router

## Features

* [x] Public navigation
* [x] Customer navigation
* [x] Restaurant navigation
* [x] Delivery navigation
* [x] Advertiser navigation
* [x] Admin navigation
* [x] Role switching
* [x] Protected routes
* [x] Unauthorized screen
* [x] Session-based redirect

---

# Module 0.6 — Shared Services

## Purpose

Create reusable services required across modules.

## What to Use

* API service layer
* Realtime service
* Notification service
* File storage
* Location service
* Logging
* Error handling
* Configuration service

## Features

* [ ] API client
* [ ] API error handler
* [ ] Realtime connection
* [ ] File upload
* [ ] Image handling
* [ ] Location service
* [ ] Notification foundation
* [ ] Logging
* [ ] Audit logging
* [ ] Configuration loading

---

# PHASE 1 — MVP

## Objective

Validate the core three-sided marketplace in a single local market.

The PRD defines Phase 1 around customer registration/location, normal discovery, menu/cart/checkout/payment, restaurant operations, delivery operations, admin operations, lifecycle notifications and ratings/reviews. 

---

# Module 1.1 — Customer Module

## Purpose

Provide the primary food discovery and ordering experience.

## What to Use

* Mobile UI
* Web UI
* Authentication service
* User profile service
* Address service
* API layer

## Features

* [ ] Customer profile
* [ ] Profile editing
* [ ] Saved addresses
* [ ] Home
* [ ] Favorites
* [ ] Order history
* [ ] Account settings
* [ ] Logout

---

# Module 1.2 — Location Module

## Purpose

Determine where the customer can order from.

## What to Use

* Device GPS
* Maps/location provider
* Reverse geocoding
* PostgreSQL geographic/location data
* Serviceability rules

## Features

* [ ] GPS detection
* [ ] Manual location
* [ ] Address search
* [ ] Saved addresses
* [ ] Home address
* [ ] Work address
* [ ] Custom address
* [ ] Current location
* [ ] Service-area validation
* [ ] Restaurant-radius validation

## Flow

```text
Location
 ↓
Service Area
 ↓
Restaurant Radius
 ↓
Delivery Availability
 ↓
Serviceable Restaurants
```

---

# Module 1.3 — Restaurant Onboarding Module

## Purpose

Allow restaurants and home kitchens to join the marketplace.

## What to Use

* Restaurant onboarding forms
* Document upload
* Admin approval workflow
* Restaurant profile service
* Location service

## Features

* [x] Restaurant registration
* [x] Home-kitchen registration
* [x] Owner information
* [x] Restaurant information
* [x] Restaurant type
* [x] Location
* [x] Operating hours
* [x] Delivery radius
* [x] Cuisine
* [x] Documents
* [x] Admin verification
* [x] Approval/rejection

---

# Module 1.4 — Restaurant Module

## Purpose

Manage the restaurant's presence and operations.

## What to Use

* Restaurant service
* Restaurant dashboard
* CRUD APIs
* Image storage
* Configuration service

## Features

* [x] Restaurant profile
* [x] Restaurant logo
* [x] Cover image
* [x] Description
* [x] Cuisine
* [x] Operating hours
* [x] Delivery radius
* [x] Open/closed status
* [x] Restaurant settings
* [x] Restaurant availability

---

# Module 1.5 — Menu Module

## Purpose

Allow restaurants to create and maintain their food catalog.

## What to Use

* Menu service
* PostgreSQL
* Image storage
* CRUD APIs

## Features

### Categories

* [x] Create category
* [x] Edit category
* [x] Delete category
* [x] Reorder category

### Items

* [x] Create food item
* [x] Edit food item
* [x] Delete food item
* [x] Food image
* [x] Description
* [x] Price
* [x] Veg/non-veg
* [x] Availability
* [x] Variants
* [x] Add-ons
* [x] Spice level

---

# Module 1.6 — Inventory Module

## Purpose

Ensure customers can order only available food.

## What to Use

* PostgreSQL
* Inventory service
* Menu service
* Order transaction handling

## Features

* [ ] Item availability
* [ ] Stock state
* [ ] Out-of-stock state
* [ ] Enable/disable ordering
* [ ] Inventory validation during checkout
* [ ] Inventory update after order
* [ ] Prevent unavailable item ordering

---

# Module 1.7 — Discovery Module

## Purpose

Allow customers to discover restaurants and food.

## What to Use

* PostgreSQL queries
* Search/indexing
* Location filtering
* Restaurant ranking
* Map provider

## Features

* [x] Restaurant listing
* [x] Nearby restaurants
* [x] Popular restaurants
* [x] Top-rated restaurants
* [x] Fast delivery
* [x] Budget-friendly restaurants
* [x] Open now
* [x] Cuisine categories
* [x] Map view
* [x] List view
* [x] Distance
* [x] Restaurant details

---

# Module 1.8 — Search Module

## Purpose

Provide standard restaurant and food search.

## What to Use

* PostgreSQL search
* Indexed columns
* Search API
* Filtering
* Sorting

## Features

* [ ] Restaurant name search
* [ ] Food item search
* [ ] Cuisine search
* [ ] Category search
* [ ] Price filter
* [ ] Rating filter
* [ ] Veg/non-veg filter
* [ ] Delivery-time filter
* [ ] Open-now filter
* [ ] Offers filter
* [ ] Relevance sorting
* [ ] Distance sorting
* [ ] Price sorting
* [ ] Rating sorting

### Phase 1 Limitation

AI/natural-language search is intentionally not implemented here.

It belongs to Phase 2.

---

# Module 1.9 — Cart Module

## Purpose

Manage selected food items before checkout.

## What to Use

* Client-side cart state
* Backend cart persistence
* PostgreSQL
* Cart validation service

## Features

* [x] Add item
* [x] Remove item
* [x] Change quantity
* [x] Customize item
* [x] Add-ons
* [x] Variants
* [x] Subtotal
* [x] Restaurant validation
* [x] Item availability validation

---

# Module 1.10 — Checkout Module

## Purpose

Convert a cart into a validated order.

## What to Use

* Checkout service
* Pricing engine
* Cart service
* Address service
* Coupon service
* Payment service

## Features

* [x] Address selection
* [x] Delivery details
* [x] Item summary
* [x] Subtotal
* [x] Delivery fee
* [x] Platform fee
* [x] Taxes/charges
* [x] Discount
* [x] Final total
* [x] Coupon validation
* [x] Item availability validation
* [x] Restaurant availability validation
* [x] Delivery availability validation

---

# Module 1.11 — Coupon & Offers Module

## Purpose

Provide the basic conversion and promotion system.

## What to Use

* Coupon service
* Offer service
* Admin configuration
* PostgreSQL

## Features

* [ ] Coupon creation
* [ ] Coupon validation
* [ ] Minimum order
* [ ] Expiry
* [ ] Usage limits
* [ ] User eligibility
* [ ] Restaurant eligibility
* [ ] Percentage discount
* [ ] Flat discount
* [ ] Offer display
* [ ] Checkout integration

---

# Module 1.12 — Payment Module

## Purpose

Process customer payments securely.

## What to Use

* Razorpay
* Backend payment service
* Payment webhooks
* PostgreSQL transaction records

## Features

* [x] Payment initiation
* [x] Razorpay checkout
* [x] UPI
* [x] Card payment
* [x] Payment verification
* [x] Payment success
* [x] Payment failure
* [x] Payment retry
* [x] Webhook handling
* [x] Idempotency
* [x] Transaction history
* [x] Refund foundation

---

# Module 1.13 — Order Module

## Purpose

Provide the central order lifecycle.

## What to Use

* Node.js order service
* PostgreSQL
* Transaction management
* Realtime events

## Features

* [x] Create order
* [x] Order items
* [x] Payment association
* [x] Restaurant association
* [x] Customer association
* [x] Order status
* [x] Status history
* [x] Cancellation
* [x] Order history
* [x] Order details

## Order States

```text
Created
 ↓
Payment Confirmed
 ↓
Restaurant Accepted
 ↓
Preparing
 ↓
Ready
 ↓
Rider Assigned
 ↓
Picked Up
 ↓
Out For Delivery
 ↓
Delivered
```

---

# Module 1.14 — Restaurant Order Management

## Purpose

Allow restaurants to fulfil customer orders.

## What to Use

* Restaurant dashboard
* Order API
* Realtime events
* Notification service

## Features

* [x] New order notification
* [x] Order list
* [x] Order details
* [x] Accept order
* [x] Reject order
* [x] Start preparation
* [x] Mark ready
* [x] View order history
* [x] Order status updates

---

# Module 1.15 — Delivery Partner Module

## Purpose

Provide the delivery partner operational experience.

## What to Use

* Mobile application
* Location service
* Delivery API
* Realtime
* Maps/navigation

## Features

* [ ] Delivery registration
* [ ] Profile
* [ ] Verification
* [ ] Online/offline
* [ ] Availability
* [ ] Delivery requests
* [ ] Accept request
* [ ] Reject request
* [ ] Active delivery
* [ ] Delivery history
* [ ] Earnings
* [ ] Basic payout history

---

# Module 1.16 — Delivery Assignment Module

## Purpose

Match orders with eligible delivery partners.

## What to Use

* Location service
* Availability service
* Delivery service
* Realtime events

## Features

* [ ] Find eligible riders
* [ ] Check online status
* [ ] Check availability
* [ ] Distance calculation
* [ ] Assignment
* [ ] Delivery request
* [ ] Accept/reject
* [ ] Reassignment

---

# Module 1.17 — Live Delivery Module

## Purpose

Track an active delivery.

## What to Use

* GPS
* Maps
* Realtime location updates
* Delivery status service

## Features

* [ ] Restaurant navigation
* [ ] Pickup confirmation
* [ ] Customer navigation
* [ ] Customer location
* [ ] Delivery status
* [ ] ETA
* [ ] Live location
* [ ] Customer OTP
* [ ] Delivery completion

---

# Module 1.18 — Notification Module

## Purpose

Keep users informed about important platform events.

## What to Use

* Push notification service
* In-app notification center
* Realtime events
* Backend event system

## Features

* [ ] Login notification
* [ ] Order confirmation
* [ ] Restaurant acceptance
* [ ] Preparing
* [ ] Ready
* [ ] Rider assigned
* [ ] Pickup
* [ ] Out for delivery
* [ ] Delivered
* [ ] Payment failure
* [ ] Basic support notifications

---

# Module 1.19 — Ratings & Reviews

## Purpose

Create trust signals from completed orders.

## What to Use

* Review service
* PostgreSQL
* Rating aggregation

## Features

* [ ] Food rating
* [ ] Restaurant rating
* [ ] Delivery rating
* [ ] Written review
* [ ] Review display
* [ ] Review moderation
* [ ] Rating aggregation

---

# Module 1.20 — Admin Module

## Purpose

Operate and control the MVP marketplace.

## What to Use

* React admin experience
* Admin APIs
* RBAC
* Audit logs
* Configuration service

## Features

### Users

* [x] View users
* [x] Search users
* [x] Block/unblock
* [x] User details

### Restaurants

* [x] Applications
* [x] Approve
* [x] Reject
* [x] Suspend
* [x] Activate

### Delivery

* [x] View delivery partners
* [x] Approve
* [x] Reject
* [x] Deactivate
* [x] Monitor active delivery

### Orders

* [x] Search orders
* [x] View order lifecycle
* [x] View payment
* [x] View delivery
* [x] Handle exceptions

---

# Module 1.21 — Admin Configuration

## Purpose

Keep business values configurable.

## What to Use

* Configuration tables
* Admin UI
* Backend configuration service

## Features

* [ ] Delivery fees
* [ ] Platform fees
* [ ] Restaurant commission
* [ ] Coupon limits
* [ ] Refund rules
* [ ] Service areas
* [ ] Delivery rules
* [ ] Operational settings

The PRD requires configurable financial and operational values to be changeable through the Admin Workspace without requiring a new application release. 

---

# PHASE 1 — INTEGRATION ORDER

```text
Authentication
      ↓
RBAC
      ↓
Location
      ↓
Restaurant Onboarding
      ↓
Restaurant
      ↓
Menu
      ↓
Discovery
      ↓
Search
      ↓
Cart
      ↓
Coupons
      ↓
Checkout
      ↓
Payment
      ↓
Order
      ↓
Restaurant Order Management
      ↓
Delivery Assignment
      ↓
Delivery
      ↓
Notifications
      ↓
Reviews
      ↓
Admin
```

---

# PHASE 2 — INTELLIGENCE & ENGAGEMENT

## Objective

Add features that improve retention, differentiation and advanced ordering.

The PRD explicitly places AI Food Assistant, natural-language search, Coins, referrals, group ordering, split bills, scheduled orders, Last-Minute Deals and restaurant analytics in Phase 2. 

---

# Module 2.1 — AI Food Assistant

## What to Use

* LLM/AI service
* Backend AI service
* Live PostgreSQL catalog data
* User preference data
* Order history
* Location
* Availability

## Features

* [ ] Conversational food discovery
* [ ] Budget recommendations
* [ ] Cuisine recommendations
* [ ] Mood recommendations
* [ ] Location-aware recommendations
* [ ] Availability-aware recommendations
* [ ] Recommendation explanations
* [ ] Real restaurant grounding
* [ ] Real food-item grounding

## Rule

AI must not invent restaurants, food items, prices or availability.

---

# Module 2.2 — Natural Language Search

## What to Use

* LLM intent extraction
* Search service
* PostgreSQL
* Restaurant/menu catalog

## Features

* [ ] Natural-language query
* [ ] Budget extraction
* [ ] Cuisine extraction
* [ ] Food extraction
* [ ] Location extraction
* [ ] Dietary preference
* [ ] Spice level
* [ ] Party size
* [ ] Semantic ranking

Example:

```text
"Find spicy vegetarian food under ₹300 near me"
```

---

# Module 2.3 — AI Item-Level Search

## What to Use

* AI intent extraction
* Menu search
* Semantic matching
* Live inventory

## Features

* [ ] Ingredient search
* [ ] Food attribute search
* [ ] Similar food search
* [ ] Item-level ranking
* [ ] Availability filtering
* [ ] Price filtering

---

# Module 2.4 — Tastifyy Coins

## What to Use

* Reward engine
* Coin ledger
* PostgreSQL
* Checkout integration

## Features

* [ ] Earn coins
* [ ] Coin balance
* [ ] Coin history
* [ ] Coin expiry
* [ ] Redeem coins
* [ ] Redemption limits
* [ ] Admin configuration

---

# Module 2.5 — Referral / Share & Earn

## What to Use

* Referral engine
* Unique referral codes
* Deep links
* Reward ledger

## Features

* [ ] Referral code
* [ ] Referral link
* [ ] Share
* [ ] Referral tracking
* [ ] Qualification
* [ ] Rewards
* [ ] Referral history
* [ ] Anti-abuse checks

---

# Module 2.6 — Group Order

## What to Use

* Realtime
* Shared cart
* Group-order service
* PostgreSQL

## Features

* [ ] Create group order
* [ ] Share link
* [ ] Join group
* [ ] Shared restaurant
* [ ] Shared cart
* [ ] Realtime item updates
* [ ] Organizer controls
* [ ] Finalize order

---

# Module 2.7 — Split Bill

## What to Use

* Group-order service
* Payment service
* Participant ledger

## Features

* [ ] Equal split
* [ ] Own-item split
* [ ] Custom split
* [ ] Payment status
* [ ] Pending payments
* [ ] Failed payment handling

---

# Module 2.8 — Scheduled Orders

## What to Use

* Scheduled-order service
* Background jobs
* Cron/scheduler
* Notification service

## Features

* [ ] Schedule date
* [ ] Schedule time
* [ ] Restaurant-hour validation
* [ ] Preparation-time validation
* [ ] Reminder
* [ ] Automatic preparation trigger
* [ ] Delivery assignment

---

# Module 2.9 — Last-Minute Deals

## What to Use

* Restaurant module
* Inventory module
* Offer engine
* Background jobs
* Expiration scheduler

## Features

* [ ] Create deal
* [ ] Discount
* [ ] Quantity limit
* [ ] Start time
* [ ] Expiry
* [ ] Minimum discount validation
* [ ] Deal discovery
* [ ] Automatic expiry
* [ ] Sold-out removal

---

# Module 2.10 — Restaurant Analytics

## What to Use

* Analytics event pipeline
* PostgreSQL
* Aggregation queries
* Dashboard charts

## Features

* [ ] Sales
* [ ] Orders
* [ ] AOV
* [ ] Best sellers
* [ ] Peak hours
* [ ] Cancellation rate
* [ ] Customer retention
* [ ] Review insights

---

# Module 2.11 — Order Recommendations

## What to Use

* Order history
* Favorites
* Reviews
* Recommendation engine
* Availability data

## Features

* [ ] Reorder
* [ ] Previous favorites
* [ ] Similar restaurants
* [ ] Similar dishes
* [ ] Personalized recommendations

---

# Module 2.12 — Price Comparison

## What to Use

* Search engine
* Restaurant menu data
* Pricing engine
* Similarity matching

## Features

* [ ] Compare similar dishes
* [ ] Compare prices
* [ ] Cheap alternatives
* [ ] Best-value ranking
* [ ] Budget recommendations

---

# Module 2.13 — Birthday Benefits

## What to Use

* Customer profile
* Offer engine
* Coupon engine
* Notification service

## Features

* [ ] Birthday date
* [ ] Birthday offers
* [ ] Birthday coupons
* [ ] Birthday notifications
* [ ] Birthday discovery
* [ ] Party ordering

---

# Module 2.14 — Quick Support

## What to Use

* Support ticket service
* FAQ
* Order context
* Notification service

## Features

* [ ] FAQ
* [ ] Order support
* [ ] Issue categories
* [ ] Quick responses
* [ ] Ticket creation
* [ ] Ticket tracking
* [ ] Escalation

---

# PHASE 2 — IMPLEMENTATION ORDER

```text
Phase 1 Data
      ↓
Analytics Foundation
      ↓
Order History
      ↓
AI Food Assistant
      ↓
Natural Language Search
      ↓
AI Item Search
      ↓
Coins
      ↓
Referral
      ↓
Group Order
      ↓
Split Bill
      ↓
Scheduled Orders
      ↓
Last-Minute Deals
      ↓
Restaurant Analytics
      ↓
Recommendations
      ↓
Price Comparison
      ↓
Birthday Benefits
      ↓
Quick Support
```

---

# PHASE 3 — SCALE & ADVANCED PLATFORM

## Objective

Introduce advanced intelligence, new business models and large-scale marketplace capabilities.

The PRD defines weather recommendations, advanced AI personalization, community competitions, premium membership, advanced advertising, multi-city expansion and advanced business intelligence as Phase 3 capabilities. 

---

# Module 3.1 — Weather Recommendations

## What to Use

* Weather API
* Location service
* Recommendation engine
* AI service

## Features

* [ ] Current weather
* [ ] Temperature-based recommendations
* [ ] Rain recommendations
* [ ] Seasonal recommendations
* [ ] Weather-aware home
* [ ] Weather-aware AI

---

# Module 3.2 — Advanced AI Personalization

## What to Use

* AI/ML services
* User behavior data
* Order history
* Recommendation engine
* Analytics pipeline

## Features

* [ ] Long-term preferences
* [ ] Behavioral personalization
* [ ] Personalized home
* [ ] Personalized food
* [ ] Personalized restaurants
* [ ] Personalized offers
* [ ] Personalized notifications
* [ ] Context-aware recommendations

---

# Module 3.3 — Community Module

## What to Use

* Community service
* Voting system
* Moderation
* Realtime/leaderboards

## Features

* [ ] Restaurant voting
* [ ] Food voting
* [ ] Polls
* [ ] Food competitions
* [ ] Trending leaderboard
* [ ] Admin moderation

---

# Module 3.4 — Premium Membership

## What to Use

* Subscription service
* Payment gateway
* User entitlement service
* Admin configuration

## Features

* [ ] Membership plans
* [ ] Premium benefits
* [ ] Subscription purchase
* [ ] Renewal
* [ ] Cancellation
* [ ] Member-only offers
* [ ] Subscription analytics

---

# Module 3.5 — Advertising Module

## What to Use

* Advertiser workspace
* Campaign engine
* Advertisement engine
* Location targeting
* Analytics
* Admin approval

## Features

* [ ] Advertiser registration
* [ ] Business profile
* [ ] Campaign creation
* [ ] Home banner
* [ ] Sponsored restaurant
* [ ] Featured food
* [ ] Location targeting
* [ ] Campaign duration
* [ ] Admin approval
* [ ] Views
* [ ] Clicks
* [ ] Conversion analytics
* [ ] Campaign billing

---

# Module 3.6 — Multi-City Module

## What to Use

* City management
* Geographic service zones
* Location service
* City-specific configuration

## Features

* [ ] City creation
* [ ] City activation
* [ ] Service zones
* [ ] Restaurants by city
* [ ] Delivery partners by city
* [ ] City-specific fees
* [ ] City-specific commission
* [ ] City-specific incentives
* [ ] City-specific analytics
* [ ] City-specific advertising

---

# Module 3.7 — Advanced Business Intelligence

## What to Use

* Analytics pipeline
* Data aggregation
* BI dashboards
* Historical data
* Business metrics

## Features

* [ ] GMV analytics
* [ ] Revenue analytics
* [ ] Commission analytics
* [ ] Delivery analytics
* [ ] Customer cohorts
* [ ] Retention
* [ ] Churn
* [ ] Restaurant performance
* [ ] City comparison
* [ ] Advertising ROI
* [ ] AI performance
* [ ] Forecasting

---

# Module 3.8 — Rent & Earn

## Status

Validation Required.

## Before Implementation

* [ ] Business model validation
* [ ] Customer research
* [ ] Partner research
* [ ] Pricing model
* [ ] Commission model
* [ ] Payment model
* [ ] Cancellation model
* [ ] Liability model
* [ ] Operational model
* [ ] PRD approval

## After Validation

```text
Validation
 ↓
PRD Update
 ↓
Architecture Update
 ↓
Database Design
 ↓
API Design
 ↓
UI/UX
 ↓
Implementation
 ↓
Testing
```

---

# PHASE 3 — IMPLEMENTATION ORDER

```text
Phase 2 Data
      ↓
Weather Integration
      ↓
Advanced AI
      ↓
Community
      ↓
Premium Membership
      ↓
Advertising
      ↓
Advanced Analytics / BI
      ↓
Multi-City
      ↓
Validated New Business Models
```

---

# 60. Module Implementation Standard

Every Tastifyy module must follow this implementation sequence:

```text
1. PRD Requirement
        ↓
2. Module Definition
        ↓
3. Database Schema
        ↓
4. API Design
        ↓
5. Backend Service
        ↓
6. Authorization
        ↓
7. Mobile UI
        ↓
8. Website UI
        ↓
9. Realtime / Notifications
        ↓
10. Error States
        ↓
11. Edge Cases
        ↓
12. Testing
        ↓
13. Documentation
```

---

# 61. Module Completion Checklist

A module cannot be considered complete merely because its UI exists.

## Database

* [ ] Schema implemented
* [ ] Relationships implemented
* [ ] Constraints implemented
* [ ] Indexes implemented
* [ ] Security policies implemented

## Backend

* [ ] Routes implemented
* [ ] Controllers/services implemented
* [ ] Validation implemented
* [ ] Authorization implemented
* [ ] Error handling implemented
* [ ] Business rules implemented

## Mobile

* [ ] Screens implemented
* [ ] Navigation implemented
* [ ] API integration implemented
* [ ] Loading states implemented
* [ ] Empty states implemented
* [ ] Error states implemented

## Website

* [ ] Pages implemented
* [ ] Role-based access implemented
* [ ] API integration implemented
* [ ] Loading states implemented
* [ ] Empty states implemented
* [ ] Error states implemented

## Platform

* [ ] Notifications implemented
* [ ] Realtime implemented where required
* [ ] Analytics implemented where required
* [ ] Audit logging implemented where required

## Testing

* [ ] Unit testing
* [ ] API testing
* [ ] Integration testing
* [ ] Role testing
* [ ] Edge-case testing
* [ ] End-to-end testing

---

# 62. Cross-Platform Rule

Every feature must be evaluated for both:

```text
Mobile
+
Website
```

If a feature is intended for a specific role, it must be implemented inside that role's experience.

Example:

```text
Restaurant Analytics

Mobile
 ↓
Restaurant Analytics Screen

Website
 ↓
Restaurant Analytics Dashboard

Backend
 ↓
Same Analytics Service
```

The mobile and website must never have separate business logic.

---

# 63. Backend Module Rule

Each major domain should have its own backend module.

```text
modules/
│
├── auth
├── users
├── restaurants
├── menus
├── inventory
├── discovery
├── search
├── carts
├── checkout
├── orders
├── payments
├── delivery
├── notifications
├── reviews
├── rewards
├── referrals
├── group-orders
├── scheduled-orders
├── deals
├── ai
├── analytics
├── support
├── advertisements
├── subscriptions
└── admin
```

A module owns its business logic and exposes services/API endpoints to other modules.

---

# 64. Feature Dependency Rule

Before implementing any feature, identify its dependencies.

Example:

```text
AI Food Assistant
      ↓
Requires:
      ↓
Authentication
Location
Restaurants
Menus
Inventory
Search
Order History
Availability
      ↓
AI Recommendation
```

Therefore AI cannot be treated as an isolated UI feature.

---

# 65. Phase 1 Dependency Structure

```text
Foundation
   ↓
Authentication
   ↓
RBAC
   ↓
Users
   ↓
Location
   ↓
Restaurants
   ↓
Menus
   ↓
Inventory
   ↓
Discovery/Search
   ↓
Cart
   ↓
Checkout
   ↓
Coupons
   ↓
Payment
   ↓
Order Engine
   ↓
Restaurant Operations
   ↓
Delivery
   ↓
Notifications
   ↓
Reviews
   ↓
Admin
```

---

# 66. Phase 2 Dependency Structure

```text
Phase 1 Marketplace
        ↓
Real User Data
        ↓
Analytics
        ↓
AI
        ↓
Natural Language Search
        ↓
Personalized Recommendations
```

Parallel engagement modules:

```text
Orders
 ↓
Coins
 ↓
Referral
 ↓
Group Orders
 ↓
Split Bill
 ↓
Scheduled Orders
 ↓
Last-Minute Deals
```

---

# 67. Phase 3 Dependency Structure

```text
Phase 1
   +
Phase 2
   +
Scale
   ↓
Advanced AI
   ↓
Weather
   ↓
Community
   ↓
Premium
   ↓
Advertising
   ↓
Business Intelligence
   ↓
Multi-City
```

---

# 68. Development Priority

When multiple modules are ready for implementation, prioritize:

```text
P0
Core transaction
 ↓
P1
Core marketplace operations
 ↓
P2
Retention and differentiation
 ↓
P3
Advanced intelligence and scale
```

---

# 69. Final Phase Map

```text
PHASE 0
FOUNDATION
│
├── Project
├── Database
├── Authentication
├── RBAC
├── Navigation
└── Shared Services
│
▼
PHASE 1
MVP
│
├── Customer
├── Location
├── Restaurant Onboarding
├── Restaurant
├── Menu
├── Inventory
├── Discovery
├── Search
├── Cart
├── Checkout
├── Coupons
├── Payments
├── Orders
├── Restaurant Operations
├── Delivery
├── Live Tracking
├── Notifications
├── Reviews
└── Admin
│
▼
PHASE 2
INTELLIGENCE & ENGAGEMENT
│
├── AI Food Assistant
├── Natural Language Search
├── AI Item Search
├── Tastifyy Coins
├── Referral
├── Group Order
├── Split Bill
├── Scheduled Orders
├── Last-Minute Deals
├── Restaurant Analytics
├── Recommendations
├── Price Comparison
├── Birthday Benefits
└── Quick Support
│
▼
PHASE 3
SCALE & ADVANCED PLATFORM
│
├── Weather
├── Advanced AI
├── Community
├── Premium
├── Advertising
├── Multi-City
├── Advanced BI
└── Rent & Earn
```

---

# 70. Golden Development Rule

`phases.md` defines **what gets implemented, in what phase, module by module, and what each module requires.**

`architecture.md` defines **how those modules connect and how the application flows.**

`prd.md` defines **what the product is supposed to do and the business requirements.**

Therefore:

```text
prd.md
   ↓
What should Tastifyy do?
   ↓
architecture.md
   ↓
How should Tastifyy work?
   ↓
phases.md
   ↓
When and module-by-module how should it be implemented?
   ↓
design.md
   ↓
How should it look and behave?
   ↓
memory.md
   ↓
What has actually been implemented/changed?
```

This keeps the five documentation files synchronized without mixing product requirements, architecture, implementation planning, UI design, and development history.

```
```
