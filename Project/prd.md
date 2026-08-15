# TASTIFYY
Discover. Order. Enjoy.
Product Requirements Document (PRD)
Local Food Discovery, Ordering & Delivery Platform
PRD v2.0
August 2026
Confidential — Prepared as the single source of truth for design, development, and business planning.

## 2. Document Control
Field | Details
--- | ---
Document Title | Tastifyy — Product Requirements Document
Version | PRD v1.0 / PRD v2.0
Status | Draft for Review
Prepared For | Founders, Product, Design, Engineering, and Business Teams
Document Owner | Product Management
Classification | Confidential / Internal Use
Scope | Customer App, Restaurant Partner Panel, Delivery Partner Panel, Admin Panel

## 3. Executive Summary
Tastifyy is an Indian food-tech platform that connects hungry customers, local restaurants, and independent delivery partners through a single, intelligent mobile and web ecosystem. It is built around the idea that ordering food should be fast, affordable, and genuinely helpful — not just a restaurant list to scroll through.
Tastifyy solves three connected problems at once: customers struggle to decide what to eat within their budget and mood, restaurants struggle to get discovered without depending entirely on large third-party platforms, and delivery partners want flexible, transparent earning opportunities. Tastifyy addresses this through smart, natural-language search, mood- and weather-aware recommendations, a low-budget discovery mode, and a last-minute deals engine that helps restaurants sell surplus food before it goes to waste.

### Who Tastifyy Serves
- Customers who want convenient, affordable, and personalized food discovery and ordering.
- Restaurant owners who want more local visibility, direct promotional tools, and actionable sales data.
- Delivery partners who want flexible full-time or part-time earning opportunities with transparent payouts.
- Local advertisers and business partners who want to reach a hyper-local, food-motivated audience.

### Why Tastifyy Is Different
Rather than positioning itself as another restaurant-listing app, Tastifyy differentiates through an AI Food Assistant that understands budget, mood, and context; a food-waste-reduction marketplace for last-minute deals; group ordering and bill-splitting built for how people actually eat together; and a rewards system (Tastifyy Coins) that keeps customers engaged without relying purely on discounting.

### Value Creation
Stakeholder | Value Created by Tastifyy
--- | ---
Customers | Faster decisions, lower food spend, personalized discovery, transparent tracking, and rewards for loyalty.
Restaurants | Increased local visibility, direct-to-customer promotions, reduced food wastage, and actionable analytics without over-reliance on a single external platform.
Delivery Partners | Flexible full-time/part-time work, transparent earnings breakdowns, and fair order assignment logic.
Tastifyy (Platform) | Diversified revenue across commissions, subscriptions, advertising, and delivery margins.

### Revenue Model Overview
Tastifyy earns revenue through restaurant commissions on completed orders, a delivery margin on logistics, platform/convenience fees charged to customers, restaurant subscription plans that unlock advanced tools, sponsored listings and advertisements, and (in later phases) premium membership. Section 43 defines this in full detail, including an initial ₹1 lakh/month business milestone model.
Tastifyy is designed to launch first in a single local market (e.g., a town or small city), prove the model with real restaurants and delivery partners, and then expand city-by-city using the same core platform — avoiding the cost and complexity of building for national scale before the product is validated.

## 4. Product Vision
To become the most trusted local food companion in India — a platform where discovering what to eat is effortless, ordering is instant, and every meal supports a local restaurant and a local delivery partner.

### Vision Pillars
- **Local Food Discovery** — surface the best nearby food first, not just the biggest brands.
- **Affordable Food** — make budget-conscious ordering a first-class experience, not an afterthought.
- **Smart Recommendations** — use context (budget, mood, weather, history) to reduce decision fatigue.
- **Convenient Ordering** — a fast, low-friction path from craving to confirmed order.
- **Restaurant Growth** — give restaurants tools to grow independent of any single acquisition channel.
- **Flexible Delivery Opportunities** — enable delivery partners to earn on their own schedule.
- **Food Waste Reduction** — turn surplus food into affordable last-minute deals instead of waste.
- **Technology-Driven Personalization** — every customer's home screen should feel like it was built for them.

## 5. Product Mission
Tastifyy's mission is to connect Customers, Restaurants, and Delivery Partners through one digital platform that is simple enough for a first-time user and powerful enough to run a growing local food economy.

Layer | Mission Statement
--- | ---
Customers | Give every customer a fast, personalized, and affordable way to discover and order food they'll actually enjoy.
Restaurants | Give every restaurant, from a single-owner eatery to a multi-outlet brand, direct digital tools to reach local customers and grow sales.
Delivery Partners | Give every delivery partner flexible, transparent, and fairly-assigned earning opportunities.

These three sides are held together by the Tastifyy platform layer — the ordering engine, the AI recommendation layer, the payments and logistics backbone, and the Admin control center that keeps the marketplace healthy, fair, and safe.

## 6. Problem Statement

### 6.1 Customer Problems
- Difficulty deciding what to eat, especially when browsing large, undifferentiated restaurant lists.
- Difficulty finding food that fits a specific budget.
- Difficulty discovering good restaurants that are actually nearby.
- Lack of personalized recommendations based on taste, history, or context.
- Uncertainty around delivery time and order status.
- Friction when ordering as a group — multiple people, one cart, unclear payment.
- Difficulty splitting the bill fairly after a group order.
- Difficulty finding last-minute discounts or surplus-food deals.

### 6.2 Restaurant Problems
- Limited digital visibility, especially for small and independent restaurants.
- High dependency on a small number of external platforms for order volume.
- Difficulty attracting customers from their immediate local area.
- Food wastage from unsold prepared food and perishable stock.
- Limited access to sales and customer analytics.
- Difficulty running and managing their own promotions.

### 6.3 Delivery Partner Problems
- Need for flexible work that fits around other commitments (full-time or part-time).
- Need for transparent, predictable earnings information before accepting an order.
- Need for efficient, fair order assignment rather than manual competition for orders.
- Need for clear visibility into daily, weekly, and monthly earnings and payouts.

## 7. Product Objectives
Objectives are grouped by outcome and should be tracked against the KPIs defined in Section 58.

Objective | Why It Matters
--- | ---
Increase local restaurant discovery | More restaurants gain visibility beyond word-of-mouth, growing supply on the platform.
Enable simple, low-friction food ordering | Reduces cart abandonment and increases order completion rate.
Improve customer retention | Repeat customers are more profitable and validate product-market fit.
Reduce restaurant food waste | Differentiates Tastifyy and creates goodwill with restaurant partners.
Increase restaurant sales | Restaurant success is the foundation of platform supply and trust.
Provide flexible delivery opportunities | Attracts and retains a healthy pool of delivery partners.
Build multiple, diversified revenue streams | Reduces dependence on commission alone; improves unit economics.
Reach ₹1 lakh/month platform revenue | Initial business milestone proving the local-market model works (see Section 44).

## 8-9. Target Audience & User Personas
Tastifyy serves five categories of users, each with distinct goals, pain points, and success criteria.

### Persona 1 — The Customer ("Everyday Orderer")
- **Profile**: Ages 18–40, students, working professionals, and families in tier-2/tier-3 towns and city neighborhoods; smartphone-first, price-sensitive.
- **Goals**: Decide what to eat quickly, stay within budget, get reliable delivery.
- **Problems**: Decision fatigue, unclear pricing until checkout, inconsistent delivery times.
- **Needs**: Fast search, budget filters, honest ETAs, easy reordering.
- **Typical Behavior**: Orders 2–6 times a month, browses on mobile during meal-decision windows (12–2pm, 7–10pm), price-checks before ordering.
- **Tastifyy Value Proposition**: AI-assisted, budget-aware discovery with transparent tracking and rewards for loyalty.

### Persona 2 — Restaurant Owner / Manager
- **Profile**: Owner or manager of an independent restaurant, cloud kitchen, or small local chain.
- **Goals**: Increase order volume, reduce dependence on any single platform, minimize food waste.
- **Problems**: Low digital visibility, thin margins after commissions, limited data on what's actually selling.
- **Needs**: Simple order management, controllable promotions, understandable analytics, fair commission.
- **Typical Behavior**: Manages orders during service hours, checks daily sales at closing, occasionally runs promotions.
- **Tastifyy Value Proposition**: A dedicated partner panel with configurable promotions, AI-summarized reviews, and a Last-Minute Deals tool to sell surplus food instead of discarding it.

### Persona 3 — Delivery Partner
- **Profile**: Full-time or part-time riders, often students, gig workers, or those seeking supplemental income.
- **Goals**: Maximize earnings per hour, work flexible shifts, get assigned nearby orders.
- **Problems**: Unclear earnings before accepting an order, inefficient assignment, delayed payouts.
- **Needs**: Transparent per-order earnings, flexible online/offline and availability scheduling, fast payouts.
- **Typical Behavior**: Goes online during peak meal windows, prefers short-distance orders when part-time.
- **Tastifyy Value Proposition**: Clear estimated earnings before accepting, part-time scheduling, and detailed earnings history.

### Persona 4 — Admin (Platform Operations)
- **Profile**: Internal Tastifyy operations, support, and business team members.
- **Goals**: Keep the marketplace healthy, fair, and profitable; resolve disputes quickly.
- **Problems**: Fraud/abuse risk, inconsistent restaurant quality, complaint backlog.
- **Needs**: Full visibility into orders, users, restaurants, and finances; configurable business rules.
- **Typical Behavior**: Monitors dashboards daily, approves new restaurants/partners, resolves escalations.
- **Tastifyy Value Proposition**: A centralized Admin Panel with configurable commissions, approvals, and complaint workflows.

### Persona 5 — Advertiser / Local Business Partner
- **Profile**: Local restaurants or nearby businesses (bakeries, grocery stores, event organizers) wanting visibility to a food-motivated local audience.
- **Goals**: Reach nearby customers cost-effectively; run short, measurable campaigns.
- **Problems**: Traditional local advertising is expensive and hard to measure.
- **Needs**: Affordable, location-targeted ad placements with clear performance reporting.
- **Typical Behavior**: Runs short campaigns around events, festivals, or new-menu launches.
- **Tastifyy Value Proposition**: Admin-approved, location-targeted advertisement slots (home banners, sponsored listings) with views/clicks reporting.

## 10. Product Ecosystem
Tastifyy is composed of four connected interfaces, all backed by a single central platform (data, order engine, payments, notifications, and AI services).
- **A. Customer App** — mobile-first app (and companion web experience) for discovery, ordering, and tracking.
- **B. Restaurant Partner Panel** — web/tablet dashboard for order and menu management, promotions, and analytics.
- **C. Delivery Partner Panel** — mobile app for accepting deliveries, navigation hand-off, and earnings.
- **D. Admin Panel** — internal web console for platform oversight, approvals, configuration, and finance.

**Textual Ecosystem Diagram**
`[ Customer App ] → places order → [ TASTIFYY CENTRAL PLATFORM ] → routes order → [ Restaurant Partner Panel ]`
`[ TASTIFYY CENTRAL PLATFORM ] → assigns delivery → [ Delivery Partner Panel ] → updates status → [ Customer App ] (live tracking)`
`[ Admin Panel ] ⇄ oversees & configures ⇄ [ TASTIFYY CENTRAL PLATFORM ] (users, restaurants, delivery partners, payments, ads, commissions)`

All four interfaces read from and write to the same central platform, ensuring order status, payments, and notifications stay synchronized in real time across every side of the marketplace.

## 11. Product Scope
This PRD defines the full target-state product across all four interfaces. Section 55/65 (MVP Scope) defines which parts ship first. Anything not explicitly listed as MVP should be treated as Phase 2 or Phase 3 unless stated otherwise.

## 12. Customer App — Complete Requirements
### 12.1 Authentication
- Mobile number login via OTP (primary method).
- Email login as an alternative.
- Google login (social sign-in).
- Guest browsing — allows menu/restaurant browsing without an account; account required at checkout.
- Profile management (name, photo, saved addresses, preferences).
- Logout and session management across devices.

### 12.2 Location
- Detect current location via device GPS.
- Manual location entry/search.
- Saved addresses labeled Home, Work, and Other (custom labels supported).
- Ability to switch active delivery location at any time before checkout.

### 12.3 Home Screen
- Search bar (normal + natural language, see Section 13).
- Food and cuisine categories.
- Active offers and promotions carousel.
- Nearby restaurants, sorted by relevance and distance.
- Popular food in the customer's area.
- Personalized recommended food (based on order history and preferences).
- Low-budget section (see Section 17).
- Last-minute deals section (see Section 18).
- Food Mood shortcuts (see Section 15).
- Weather-based recommendations, where available (see Section 16).
- Birthday/Party ordering section (see Section 31).

## 13. Smart Search
Tastifyy supports two complementary search modes so customers can search however feels natural to them.

Mode | Description | Examples
--- | --- | ---
**A. Normal Search** | Keyword-based search across food items, cuisines, and restaurant names, with standard filters and sorting. | "Pizza", "Biryani", "Cafe near me"
**B. Natural Language Search** | Free-text queries interpreted for intent — budget, dietary preference, mood, location, and group size. | "Best biryani nearby", "Veg pizza under ₹300", "I have ₹200, suggest food", "Spicy food for two"

- **Search Behavior**: Results update as the user types (with debouncing) for normal search. Natural language queries are parsed for: budget, cuisine/food type, location scope, spice/dietary preference, and party size. If intent cannot be confidently parsed, Tastifyy falls back to keyword search and shows an option to refine.
- **Filters & Sorting**: Filters: price range, cuisine, veg/non-veg, rating, delivery time, offers, open now. Sorting: relevance, distance, rating, price (low to high / high to low), delivery time.
- **Understanding Rules**: Budget understanding: extracts a numeric ceiling (e.g., "under ₹300", "I have ₹200") and filters results accordingly. Location understanding: defaults to the customer's active saved/detected location unless another area is named. Food preference understanding: recognizes cuisine, spice level, veg/non-veg, and dietary keywords (e.g., "healthy", "spicy").

## 14. Tastifyy AI Food Assistant
Tastifyy AI is a conversational and contextual recommendation layer that helps customers decide what to eat rather than simply listing restaurants.
- **User Interaction**: Accessible from the home screen and search bar; supports free-text and quick-reply prompts (budget, mood, cuisine).
- **Recommendation Process**: Combines the customer's stated intent with contextual signals (see Inputs) to rank a shortlist of real menu items and restaurants.
- **Inputs**: Budget, location, previous orders, favorite foods, restaurant rating, delivery time, current availability, time of day, and weather (where available).
- **Outputs**: A ranked shortlist (typically 3–6 options) of specific dishes or restaurants, each with a short reason ("Because you liked X", "Fits your ₹200 budget").
- **Personalization**: Improves over time using order history, ratings given, and explicitly saved favorites/preferences.
- **Safety & Accuracy Rules**: Tastifyy AI must only recommend restaurants and food items that currently exist and are available in Tastifyy's live database — it must never invent or hallucinate a restaurant, dish, or price.

## 15. Food Mood
Food Mood is a one-tap discovery shortcut that maps an emotional or situational craving to a curated set of results.
- **Moods**: Hungry, Spicy, Fast Food, Healthy, Sweet, Budget, Party, Comfort Food.
- **User Journey**: Customer taps a Food Mood tile on the Home screen. Tastifyy filters nearby, currently-open restaurants/items matching that mood. Results are shown in the standard restaurant/food listing UI with the mood retained as an active filter. Customer can further refine with normal filters (price, rating, veg/non-veg) before ordering.

## 16. Weather-Based Recommendation
Weather-based recommendations surface food that fits current local conditions, adding a layer of contextual relevance to the Home screen.
- **Examples**: Rain (Soup, chai, pakoda), Summer / Hot (Ice cream, cold drinks), Winter / Cold (Soup, hot snacks).
- This feature depends on the availability and accuracy of a third-party weather API for the customer's active location. If weather data is unavailable, this section of the Home screen is hidden rather than shown with stale or default data.

## 17. Low-Budget Food
Marketing name: "Eat More, Spend Less."
- **Budget Filters**: Under ₹99, Under ₹149, Under ₹199, Under ₹299, Custom budget entry (free numeric input).
- This mode filters the entire catalog (search, restaurant listings, and AI recommendations) to only show items at or below the selected budget, inclusive of item price before delivery/platform fees unless stated otherwise on the item card.

## 18. Last-Minute Food Deals / Food Waste Reduction
"Last Minute Deals" lets restaurants discount surplus, soon-to-expire, or excess-prepared food instead of discarding it, turning near-waste into affordable meals for customers.
- **Why This Feature Exists**: Reduces restaurant food waste, recovers partial revenue on surplus stock, and gives budget-conscious customers steep discounts.
- **Restaurant Workflow**: Restaurant marks an existing menu item (or a surplus batch) as a Last-Minute Deal, sets a discounted price, available quantity, and a time window.
- **Discount Rules**: Restaurant-set discount percentage or flat price, subject to a platform-configured minimum discount to qualify for the Last-Minute Deals section.
- **Quantity**: Restaurant sets a finite quantity; the deal is automatically removed once quantity reaches zero.
- **Availability Period**: Deal is time-boxed (e.g., "today only", "next 2 hours") and expires automatically at the end of the window.
- **Customer Purchase Flow**: Deal appears in the Last-Minute Deals section and search; customer orders like a normal item, with reduced or no customization.
- **Admin Monitoring**: Admin can view active deals, redemption rates, and flag restaurants that misuse the feature (e.g., artificially inflating original price).
- **Food Waste Reduction Metrics**: Platform tracks estimated meals saved from waste, restaurant participation rate, and deal redemption rate as reportable KPIs.

## 19. Restaurant Discovery
Nearby, Popular, Top Rated, Fast Delivery, Budget Friendly, New Restaurants, Offers, Pure Veg / Non-Veg, Open Now, Last-Minute Deals.
Filters and sorting from Section 13 apply consistently across all discovery views.

## 20. Restaurant Details & Menu
- Restaurant profile: name, cover image, logo, address, contact.
- Restaurant rating and review summary.
- Cuisine tags.
- Estimated delivery time and distance.
- Active offers specific to the restaurant.
- Menu organized into categories.
- Individual food items with images, price, description, and veg/non-veg indicator.
- Item customization (size, add-ons, spice level, variants) where applicable.
- Bestseller and recommended-item badges.

## 21. Cart & Checkout
- **Checkout Flow**: Restaurant → Food → Cart → Coupon → Address → Delivery Option → Schedule Option (if applicable) → Payment → Order Confirmation.
- **Price Breakdown**: Item subtotal, Delivery fee, Platform / convenience fee, Discounts (coupon and/or automatic offer), Applicable taxes, Final payable amount.
- The full price breakdown must be visible before payment is confirmed — no hidden fees may appear only after payment.

## 22. Group Order
- Any participant creates a group order from a chosen restaurant.
- Tastifyy generates a shareable link/code for that group order.
- Other participants join using the link/code (app account required to add items).
- All participants add items to a shared cart in real time.
- The organizer sees the live participant list and combined cart.
- The organizer (or a designated payer) finalizes and pays for the full order.
- The order proceeds through the normal checkout and tracking flow.

## 23. Split Bill
- **Equal Split**: total divided evenly across all participants.
- **Own-Item Payment**: each participant pays only for the items they added.
- **Custom Amount**: organizer manually assigns amounts per participant.
- Split Bill can be used within a Group Order or applied after checkout as a payment-collection request among participants (each participant pays their share via their own preferred payment method).

## 24. Coupons & Offers
- Coupon system supporting percentage and flat-value discounts.
- Automatic coupon suggestions surfaced at checkout when eligible.
- Restaurant-specific offers (funded by the restaurant).
- Platform-wide offers (funded by Tastifyy).
- Minimum order value requirements per coupon.
- Expiry date/time per coupon.
- Eligibility rules (e.g., first order only, specific restaurants, specific user segments).
- Usage limits (per user and/or total redemptions).

## 25. Share & Earn / Referral
- Unique referral code per user.
- Shareable referral link (via WhatsApp, SMS, social apps).
- Reward for the new user upon qualifying first order.
- Reward for the referrer upon the referred user's qualifying action.
- Referral history showing invited users and their status.
- Reward status: Pending, Credited, Expired.

## 26. Tastifyy Coins
Tastifyy Coins is the platform loyalty currency, designed to reward engagement beyond just discounting.
- **Earning Coins**: Completing orders, Leaving reviews, Successful referrals, First order bonus, Platform campaigns and challenges, Birthday rewards.
- **Redemption Rules**: Coins can be redeemed toward the item subtotal at checkout, up to a platform-configured maximum percentage of the order value. Coins may have an expiry window to encourage active use. Coin value (₹ per coin) and redemption caps are configurable by Admin.

## 27. Live Order Tracking
- **Order Confirmed → Restaurant Confirmed → Preparing → Ready → Rider Assigned → Pickup → Out for Delivery → Delivered**
- Estimated time of arrival (ETA), updated as the order progresses.
- Assigned rider's name, photo, and contact option.
- Live map view of the delivery partner's location relative to the customer.
- Push notification at every status change.

## 28. Order History & Reorder
- Active orders (in progress), Completed orders, Cancelled orders, Scheduled orders (upcoming).
- Full order detail view (items, price breakdown, restaurant, rider, timestamps).
- One-tap reorder that rebuilds the cart from a past order, adjusting for any items or prices no longer available.

## 29. Scheduled Order
- Schedule for Today (a future time slot), Tomorrow, or a Custom Date.
- Custom time selection within the restaurant's operating hours.
- Reminder notification ahead of the scheduled preparation/delivery time.
- Ability to cancel or reschedule before the restaurant begins preparation.

## 30. Payments
- **Supported Methods**: UPI, Credit/Debit Cards, Net Banking, Tastifyy Wallet, Cash on Delivery (where enabled by Admin/serviceable area).
- **Payment Statuses**: Pending, Processing, Success, Failed, Refunded.
- **Reliability Requirements**: Automatic retry flow for failed payments before the order is cancelled. Duplicate-order prevention — the system must detect and block a second charge for the same cart submission (e.g., double-tap, network retry). Clear in-app messaging distinguishing "payment failed" from "payment pending confirmation".

## 31. Birthday & Party Order
- A dedicated ordering mode for celebration occasions, combining multiple categories into one guided flow: Birthday cakes, Candles, Pizza, Burgers, Snacks, Combo packs, Desserts, Drinks.
- Supports scheduled ordering so celebration food arrives at a specific date and time.

## 32. Customer Support
- FAQ / self-help center.
- Categorized support topics.
- Ticket creation from any order or account issue.
- Ticket status tracking.
- Refund request flow.
- Support Categories: Missing item, Wrong item, Payment issue, Delivery issue, Restaurant issue, Account issue.

## 33. Customer Ratings & Reviews
- Customers can rate Food, Restaurant, and Delivery separately.
- Star rating (1–5) required; written review optional.
- Photo attachments supported.
- Quick-select tags (e.g., "Great taste", "Late delivery", "Cold food") to speed up feedback.

## 34. Restaurant Partner Panel
- **Dashboard**: Live orders (Pending, Preparing, Ready, Completed), Sales summary, Earnings summary, Current rating.
- **Restaurant Profile**: Name, Logo, Photo gallery, Address, Contact details, Operating timings, Cuisine tags, Delivery radius.

## 35. Restaurant Order Management
- Accept order, Reject order (with reason), Mark as Preparing, Mark as Ready for pickup.
- Every action must trigger a real-time status sync to the Customer App and, where relevant, the Delivery Partner Panel.

## 36. Restaurant Menu Management
- Add / edit / delete food items. Change price. Upload item images. Add item description.
- Set category. Set veg / non-veg. Enable / disable item availability.
- Configure customization options (size, add-ons, spice level).

## 37. Restaurant Inventory
- Stock/availability tracking per item.
- Low-stock alerts to the restaurant.
- Automatic "Out of Stock" labeling and removal from active ordering when depleted.

## 38. Restaurant Promotions
- Percentage discount, Flat discount, Buy 1 Get 1, Combo offers, Happy hour pricing.
- Last-Minute Deal (Section 18).
- Restaurant-funded coupon codes.

## 39. Restaurant Analytics
- Daily / weekly / monthly sales, Total orders, Average order value.
- Best-selling food items, Peak ordering hours, Cancellation rate, Customer retention rate.
- **AI Insights (Restaurant-Facing)**: Best-selling item highlight, Peak ordering time detection, Low-performing item flagging, Review summary.

## 40. AI Review Summary
Tastifyy AI condenses a restaurant's recent customer reviews into a short, plain-language summary rather than requiring the owner to read every review individually.
Example: "Customers love the taste and quantity. Some customers mention delays during peak hours."

## 41. Restaurant Subscription
- **Starter (₹0/month)**: Core order management and menu tools — free entry point for every restaurant.
- **Growth (₹499/month)**: Adds promotions, enhanced analytics, and priority placement eligibility.
- **Pro (₹999/month)**: Adds full analytics suite, AI insights, advertising discounts, and top placement eligibility.
All subscription prices must be configurable by Admin, not hard-coded.

## 42. Delivery Partner Panel
- **Registration**: Name, Mobile number, Email, Address, Profile photo, ID verification (government ID), Vehicle details, Driving license (where applicable), Bank / payment account information.
- **Status**: Online — available to receive delivery requests. Offline — not receiving requests.

## 43. Delivery Request
When a request is offered to a delivery partner, it must display all of the following before the partner decides:
- Restaurant name and pickup location
- Customer's delivery location (approximate until accepted)
- Distance for pickup and drop
- Estimated earning for this delivery
- Order information (item count, special notes if any)
- Accept / Reject options.

## 44. Delivery Workflow
Accepted → Navigate to Restaurant → Arrive at Restaurant → Pickup Verification → Navigate to Customer → Customer OTP Verification → Delivered

## 45. Delivery Partner Earnings
- Base earning per delivery
- Distance-based incentive
- Peak-hour incentive
- Bonus payouts (campaigns, milestones)
- Daily / weekly / monthly earnings summary
- Order history & Payout history

## 46. Part-Time Delivery
- Delivery partners choose Full-Time or Part-Time status.
- Part-time partners set an availability schedule (e.g., 6 PM – 10 PM).
- The platform only assigns orders to a partner when they are Online and within their configured availability window.

## 47. Admin Panel
- **Dashboard Metrics**: Total users, Total restaurants, Total delivery partners, Order volume, Gross Merchandise Value (GMV), Platform revenue, Commission revenue, Active advertisements, Active subscriptions, Refunds issued, Active deliveries in progress, Open complaints.

## 48. User Management
- View and search users. Filter by status/activity.
- View user profile and order history.
- Block / unblock accounts. Handle user complaints.

## 49. Restaurant Management
- Approve / reject new restaurant applications.
- Verify restaurant details and documents.
- Suspend / activate restaurants.
- Manage per-restaurant commission rate.
- Manage subscription plan assignment.
- View restaurant performance.

## 50. Delivery Partner Management
- Approve new delivery partners. Verify submitted documents.
- Activate / deactivate partners. View partner performance.
- Monitor active deliveries. Manage incentive rules. Manage and review payouts.

## 51. Advertisement System
An Admin-controlled advertising system that lets restaurants and local businesses pay for extra visibility.
- **Ad Types**: Home banner, Sponsored restaurant listing, Featured food item, Promotional campaign, Location-based advertisement.
- Example Pricing Tiers: ₹200, ₹300, ₹500, ₹1,000+ (Admin-configurable).
- **Admin Controls**: Price, Duration, Start date, End date, Target location, Approval workflow, Views tracking, Clicks tracking, Revenue reporting.

## 52. Commission & Revenue Model
- **Revenue Sources**: Restaurant commission on completed orders, Delivery margin, Platform / convenience fee (customer-facing), Restaurant subscription plans, Sponsored listings, Advertisements, Premium membership (future phase), Promotional campaign fees.
- Suggested restaurant commission: 10–15% of order value, but the exact rate must be configurable per-restaurant by Admin.

## 53. ₹1 Lakh/Month Business Target
An illustrative initial revenue model for a single launch market, intended as a directional business target rather than a guaranteed outcome.
- **Restaurant Commission**: ₹55,000
- **Restaurant Subscription**: ₹12,500
- **Sponsored Listings**: ₹20,000
- **Delivery Margin**: ₹15,000
- **Total Target Revenue**: ₹1,02,500

## 54. Food Competition / Community
Optional engagement features to build local brand affinity beyond transactional ordering: Best restaurant voting, Best dish voting, Local food polls, Food competitions, Trending food leaderboard. Example: "Vote for the Best Biryani in Sakoli".

## 55. Notification System
Login / new-device alert, Order confirmation, Restaurant acceptance, Food preparation update, Rider assignment, Pickup confirmation, Out for delivery, Delivery confirmation, Offers and coupons, Referral rewards, Tastifyy Coins earned/expiring, Scheduled order reminders, Birthday offers, Support ticket updates.

## 56. Availability & Operating-Hours Logic
Tastifyy must NOT claim 24/7 delivery by default. Availability is determined dynamically from real operating data, not assumed.
- Restaurant availability — based on restaurant-set operating hours and manual open/closed toggles.
- Delivery partner availability — based on online status and, for part-time partners, their scheduled window.
- Service area coverage — based on Admin-configured delivery zones.
The current state is always shown honestly to the customer: "Delivery Available" or "Currently Unavailable".

## 57. Location & Service Area
Current (GPS) location, Manual location entry, Nearby-restaurant search radius, Restaurant delivery radius, Customer delivery location, Delivery partner live location, Admin-configurable service areas (zones where Tastifyy actively operates).

## 58. Security & Privacy Requirements
- Strong authentication (OTP/social login) with session management.
- Role-based authorization across Customer, Restaurant, Delivery Partner, and Admin roles.
- Secure, PCI-aware handling of payment data (no raw card data stored on Tastifyy servers).
- Encryption of sensitive data at rest and in transit.
- Secure, authenticated APIs for every client (mobile apps, panels).
- Restricted Admin access with audit logging of sensitive actions.
- Restaurant and delivery partner access limited strictly to their own data.
- Customer privacy — location and contact data shared with a delivery partner only for the duration and purpose of an active order.
- No exposure of sensitive personal or financial information in any client-facing response.

## 59. Non-Functional Requirements
- **Performance**: Core screens (Home, Search, Restaurant, Cart) should load quickly even on constrained networks.
- **Scalability**: Architecture should support growth from one local market to multiple cities without redesign.
- **Availability**: Order-critical services (checkout, payments, tracking) should target high uptime with graceful degradation.
- **Security**: See Section 58 in full.
- **Reliability**: Order state must remain consistent across Customer, Restaurant, and Delivery Partner views at all times.
- **Accessibility**: Legible typography, sufficient color contrast, and support for standard screen readers where feasible.
- **Usability**: First-time users should be able to complete an order without instructions.
- **Maintainability**: Modular services so features (e.g., AI Assistant, Ads) can evolve independently.
- **Observability**: Logging, monitoring, and alerting across order, payment, and delivery pipelines.
The application must remain usable on low bandwidth, mid-range Android devices, and slow network connections — this is a core design constraint, not an edge case, given the target local markets.

## 60. UI/UX Requirements
Brand: TASTIFYY — "Discover. Order. Enjoy."
- **Visual Direction**: Premium, Modern, Friendly, Food-focused, Clean, Fast, Indian startup feel.
- **Suggested Palette**: Primary Orange (`#E86A22`), Secondary Warm Orange (`#C1531A`), Dark (`#171717`), Background (Warm White).
- **UI Patterns**: Rounded cards, High-quality food photography, Clean, readable typography, Bottom navigation on mobile, Smooth, purposeful animations, Skeleton loaders during data fetch, Designed empty/error/loading states.
Tastifyy's UI must not duplicate the exact branding or interface layout of existing food-delivery competitors.

## 61. Navigation Structure
- **Customer App**: Primary: Home · Search · Favorites · Orders · Profile. Secondary: Cart · AI Assistant · Rewards · Offers · Group Order · Support.
- **Restaurant Partner Panel**: Dashboard · Orders · Menu · Inventory · Offers · Analytics · Reviews · Profile.
- **Delivery Partner Panel**: Home · Orders · Earnings · History · Profile.
- **Admin Panel**: Dashboard · Users · Restaurants · Delivery Partners · Orders · Advertisements · Coupons · Payments · Revenue · Analytics · Complaints · Settings.

## 62. Complete User Journeys
*(Journeys outline the primary end-to-end paths through Tastifyy, including Customer Registration, Restaurant Discovery, AI Recommendation, Last-Minute Deal, Group Ordering, Payment, Delivery, and Admin Approvals, which should be validated during design and QA).*

## 63. Edge Cases
Handles scenarios such as: Restaurant rejects order, Restaurant closes after order placed, Food item becomes unavailable mid-order, No rider available, Payment failure, Duplicate payment, Customer/Restaurant cancels order, Delivery delay, Wrong/missing item delivered, Refund processing, Network failure during checkout, Location unavailable, Invalid coupon, Group order member leaves/cancels.

## 64. Business Rules
- **Restaurant Commission**: Configurable per-restaurant percentage, Admin-controlled; default range 10–15%.
- **Delivery Fee**: Calculated from distance and, optionally, demand; Admin-configurable base and per-km rate.
- **Platform Fee**: Small fixed or percentage-based convenience fee shown transparently at checkout.
- **Coupon**: Must respect minimum order value, eligibility, expiry, and usage-limit rules before applying.
- **Refund**: Refund eligibility and amount depend on order stage and cancellation reason; processed to original payment method or wallet.
- **Cancellation**: Free cancellation before restaurant acceptance; reduced or no refund after preparation has started, per policy.
- **Referral**: Reward credited only after the referred user completes a qualifying first order.
- **Tastifyy Coins**: Earned per configurable actions; redemption capped at a configurable percentage of order value; may expire.
- **Restaurant Subscription**: Plan price and feature access are Admin-configurable and can change without requiring app updates.
- **Advertisement**: All campaigns require Admin approval before going live; pricing is Admin-configurable.
- **Sponsored Listing**: Paid placement is visually labeled as sponsored/promoted to maintain user trust.
- **Delivery Incentives**: Peak-hour and distance incentives are Admin-configurable and can vary by zone.
- **Last-Minute Deals**: Must meet a platform-configured minimum discount threshold to be listed.
All configurable financial values must be adjustable from the Admin Panel without requiring a new app release.

## 65. MVP Scope (Phase 1)
Phase 1 includes only what is essential to validate the core three-sided marketplace in a single local market.
- **Included in MVP**: Customer registration & location, Restaurant listing & search (normal), Restaurant menu, cart, checkout, payment, Order management (restaurant side), Basic delivery workflow, Restaurant Partner Panel (core), Delivery Partner Panel (core), Admin Panel (core: approvals, orders, users), Notifications (order lifecycle), Ratings & reviews.

## 66. Phase 2
- AI Food Assistant, Natural language search, Tastifyy Coins, Referral / Share & Earn, Group order, Split bill, Scheduled orders, Last-Minute Deals, Restaurant analytics.
Rationale: these features materially improve retention and differentiation but depend on having real usage data (Phase 1) to be effective.

## 67. Phase 3
- Weather-based recommendations, Advanced AI personalization, Community competitions, Premium membership, Advanced advertising system, Multi-city expansion, Advanced business intelligence.
Rationale: these features either depend on scale or are enhancements layered on top of an already-proven core.

## 68. Success Metrics / KPIs
- **Customer KPIs**: Registered users, Active users (DAU/MAU), Orders per user, Repeat order rate, Customer retention rate, Average order value (AOV).
- **Restaurant KPIs**: Active restaurants, Orders per restaurant, Restaurant retention rate, Restaurant GMV contribution.
- **Delivery KPIs**: Active delivery partners, Orders per partner, Order acceptance rate, Order completion rate.
- **Business KPIs**: GMV, Total platform revenue, Commission revenue, Subscription revenue, Advertisement revenue, Delivery revenue, Customer Acquisition Cost (CAC), Customer retention, Monthly active customers, Monthly order volume.

## 69. Competitive Differentiation
Tastifyy is not positioned as "another food delivery app." Its differentiation rests on: AI Food Assistant that recommends from real inventory, Natural Language Budget Search, Food Mood, Weather-based recommendations, Low-Budget food discovery as a first-class mode, Last-Minute food-waste-reduction deals, Group Ordering & Split Bill, Tastifyy Coins, Deep local food discovery, Part-time delivery opportunities, and Local advertising.

## 70. Future Scalability
Multiple cities, Multiple states, Cloud kitchen partnerships, Grocery delivery, Bakery delivery, Catering orders, Corporate food ordering, College / event food ordering, Local business advertising beyond restaurants, Premium memberships.

## 71. Risks & Mitigation
- **Low restaurant supply at launch**: Manually onboard local restaurants; offer free Starter plan.
- **Low delivery partner availability**: Offer transparent, competitive earnings and flexible scheduling.
- **Payment failures / disputes**: Robust payment-status handling, retry flow, and duplicate-order prevention.
- **Food quality complaints**: Restaurant verification workflow; ratings system; rapid Admin escalation.
- **Over-reliance on discounting**: Diversify retention via Tastifyy Coins and Last-Minute Deals.
- **AI recommending unavailable items**: AI Assistant only queries from live inventory.
- **Fraudulent orders/reviews**: Admin monitoring tools, rate-limiting, manual reviews.
- **Slow adoption in low-bandwidth areas**: Performance and low-bandwidth design treated as core requirements.

## 72. Assumptions & Dependencies
- **Assumptions**: Launch begins in a single local market. Restaurants provide digital menu data. Delivery partners can be recruited locally. Customers have smartphone and digital payment access.
- **Dependencies**: Third-party weather API, Third-party maps/geolocation service, Payment gateway supporting UPI/cards/net banking/wallet, SMS/OTP provider, Push notification infrastructure.

## 73. Final Product Summary
Tastifyy is a locally-rooted, technology-driven food discovery, ordering, and delivery platform built around four connected products — Customer App, Restaurant Partner Panel, Delivery Partner Panel, and Admin Panel — unified by a central platform and an AI recommendation layer. Its differentiation is deliberate: budget-aware and mood-aware discovery, a food-waste-reduction marketplace, group ordering built for real shared meals, and a loyalty system designed for long-term engagement rather than short-term discounting. This document is the single source of truth for Tastifyy's initial build.

---

# 74. PRD v2.0 — New Requirements & Feature Integration
**Purpose**: This section integrates the newly supplied requirements into the Tastifyy product baseline. It extends the existing v1.0 requirements and is authoritative wherever it adds or clarifies a feature.

### 74.1 Updated Product Roles
- **Customer**: Discover, compare, order, schedule, split and track food orders. (Customer App)
- **Restaurant Partner**: Onboard restaurant/home kitchen; manage menu, timings, location, inventory, orders and offers. (Restaurant Partner Panel)
- **Delivery Partner**: Accept and deliver orders with full-time or part-time availability. (Delivery Partner Panel)
- **Admin**: Approve and manage users, restaurants, delivery partners, payments, complaints, offers and platform rules. (Admin Panel)

### 74.2 Nearby Discovery & Free Food-Finding Facility
- Nearby restaurant and food discovery is a core, low-friction facility. Customers can locate nearby restaurants, food items and active deals using GPS, manual location search and map-based discovery.
- Customers can switch between list and map views, see restaurants relative to their current location, open restaurant details from map markers, and filter by distance, rating, price and availability.
- The map supports discovery and navigation assistance; delivery availability is still determined by restaurant operating hours, delivery-partner availability and service-area rules.

### 74.3 24/7 App Accessibility vs. 24/7 Delivery
- Tastifyy should remain accessible as an application 24/7 so students, workers and part-time users can browse, search, view order history, manage profiles and prepare or schedule orders whenever the app is available.
- Tastifyy must not promise 24/7 food delivery. Restaurant and delivery availability continues to be calculated dynamically from real operating hours, partner availability and service zones.
- Restaurants and home kitchens can define their own operating windows, including late-night or limited-hour service, while delivery partners can define part-time availability windows.

### 74.4 Restaurant & Home-Kitchen Onboarding
- Restaurant onboarding shall support traditional restaurants, cloud kitchens and verified home kitchens/part-time food businesses.
- Restaurant profile fields shall include restaurant type, owner/manager details, address/location, service radius, cuisine, operating days and timings, contact details, menu and required verification documents.
- Home kitchens must be clearly labelled to customers and must pass platform approval, food-safety/document verification and quality controls applicable to the launch market.
- Restaurant partners can temporarily open/close ordering, define preparation times, configure item availability and specify special operating windows.

### 74.5 Smart AI Food Search — Item-Level Understanding
- The AI Assistant and natural-language search must understand direct food-item requests, not only restaurant or category queries.
- Example: if a customer says "I want tomato", the system should interpret the intent and return currently available menu items containing tomato or relevant tomato-based dishes, subject to location and other active constraints.
- AI results must be grounded in Tastifyy's live menu database. The assistant must not invent food items, restaurants, prices or availability.
- The assistant should ask a concise clarification question when a term is ambiguous.

### 74.6 Budget-Based Price Comparison & Cheap Alternatives
- Tastifyy shall provide a price-comparison experience across eligible restaurants for the same or similar food intent.
- Comparison should consider item price, applicable discounts/coupons, delivery fee, platform/convenience fee and the final payable amount where sufficient information is available.
- The customer should be able to select a 'Cheapest Option' or 'Best Value' view. Best Value may balance price, rating, distance and delivery time rather than selecting the lowest item price alone.
- Price comparison must clearly distinguish item price from final payable price so that low advertised prices do not create misleading expectations.

### 74.7 Order-History-Based Recommendations
- The recommendation engine shall use completed-order history, repeat frequency, ratings, favorites and previously purchased categories to improve future suggestions.
- Examples include 'Order Again', 'You may also like', 'Similar to your last order' and personalized recommendations during relevant meal windows.
- Recommendations must respect current restaurant opening status, menu availability, customer location, budget and applicable dietary preferences.

### 74.8 Coupons, Offers & Birthday Benefits
- Coupons remain available as restaurant-funded and platform-funded promotions, with configurable eligibility, minimum order value, expiry and usage limits.
- Birthday benefits shall be surfaced through the Birthday/Party ordering experience and notification system. Offers may include eligible cake discounts, coupons, Tastifyy Coins or restaurant-specific birthday promotions.
- Birthday offers must be subject to configurable eligibility and anti-abuse rules and must not be assumed to apply universally.

### 74.9 Group Ordering & Split Bill Enhancement
- Group ordering shall support a shareable link/code so friends or colleagues can join the same order without manually exchanging item lists.
- Participants can add items to a shared cart in real time. The organizer can see participant status, item totals and the combined order.
- Split Bill shall support equal split, own-item payment and custom amount allocation. Each participant should receive a payment request/status for their assigned share.
- The platform must prevent duplicate payment collection and show which participants have paid, are pending or failed.

### 74.10 Scheduled Orders
- Customers can schedule an order for a supported future date and time within restaurant operating and preparation constraints.
- The restaurant must receive the scheduled order with the required preparation time and an explicit scheduled timestamp.
- Customers receive reminders and may cancel/reschedule before the defined preparation lock time.

### 74.11 Razorpay Payment Integration
- Razorpay is designated as the initial payment-gateway integration for Tastifyy, subject to account approval, supported payment methods and production readiness.
- Supported payment options should include the methods enabled through the configured Razorpay integration, while Tastifyy's existing payment model may retain COD or other methods where Admin/service-area rules permit.
- Payment flows must retain clear pending/success/failure states, retry handling, refund handling and duplicate-order prevention.

### 74.12 Last-Minute / Surplus Food Deals
- Restaurants can list surplus, excess-prepared or time-sensitive food at a reduced price for a limited quantity and time window.
- The deal must show original/reference price where appropriate, discounted price, quantity remaining and expiry time.
- Admin must be able to monitor suspicious discounting or artificial price inflation and remove non-compliant deals.

### 74.13 Customer Support — Quick Response Layer
- The existing ticket and FAQ system shall be supplemented by a quick-response support layer for active-order issues.
- Customers should first receive contextual self-service options based on the active order, such as delayed delivery, missing item, wrong item or payment status.
- Escalation to a human/admin support queue must be available when the automated flow cannot resolve the issue.
- Support interactions should be linked to the relevant order and retain status, timestamps and resolution history.

### 74.14 Rent & Earn — Proposed Future Concept
*Status. Concept / Phase 3 candidate. The original request says 'Rent and earn (??)', so the following is a proposed interpretation, not a finalized requirement.*
- Verified restaurants or home-kitchen partners may list unused kitchen capacity, approved equipment or time slots for rental by eligible food businesses.
- Listings would include availability, location, rental price, permitted use, capacity and verification status.
- Admin approval, safety/compliance checks, booking rules, payments, cancellations and dispute handling would be required before launch.
- This feature should remain outside the core food-ordering MVP until the business model and legal/operational requirements are validated.

### 74.15 Updated Customer Home Screen
- **Primary**: Search / AI Food Assistant
- **Discovery**: Nearby restaurants, map discovery and Popular Food Near Me
- **Value**: Low Budget, Cheapest Options and Last-Minute Deals
- **Personalization**: Order Again and history-based recommendations
- **Context**: Weather-based recommendations where weather data is available
- **Social**: Group Order and Split Bill
- **Offers**: Coupons, active restaurant offers and birthday benefits
- **Utility**: Scheduled Orders, Orders/Tracking and Support

### 74.16 Updated Restaurant Requirements
- Restaurant onboarding must support restaurant type selection: Restaurant, Cloud Kitchen or Home Kitchen.
- Restaurant profile must capture operating timings, location, service radius and availability status.
- Restaurants can create coupons, low-budget offers, Last-Minute Deals and other promotional campaigns subject to Admin rules.
- Restaurants should receive demand signals such as popular items, repeat-order patterns and low-performing items through analytics where enabled.
- Restaurants must accurately maintain menu availability because AI, price comparison and recommendations depend on live inventory/menu data.

### 74.17 Updated Delivery Partner Requirements
- Delivery partners may operate full-time or part-time and define their availability schedule.
- The delivery request must show estimated earnings, pickup/drop distance and relevant order information before acceptance.
- Part-time availability is especially intended to support students, workers and people seeking supplemental income.
- Delivery assignment must only occur when the partner is online, eligible and within their configured availability/service area.

### 74.18 Updated Admin Controls
- Manage restaurant types, including home kitchens and part-time restaurants.
- Approve or reject restaurant/home-kitchen onboarding and verification documents.
- Configure coupon, birthday-offer, Last-Minute Deal and price-comparison rules.
- Configure payment gateway settings and monitor payment/refund states.
- Monitor AI search quality, unavailable-item recommendation incidents and customer support escalations.
- Configure service areas, operating rules, commissions, subscription plans and advertisement policies.
- Manage and audit any future Rent & Earn listings, participants, transactions and disputes.

### 74.19 Feature Priority Matrix
- **P0 / Phase 1**: Nearby/map food discovery, Restaurant/home-kitchen onboarding, Coupons/offers, Razorpay integration.
- **P1 / Phase 2**: Order scheduling, Group order + split bill, Order-history recommendations, AI item-level search, Price comparison/cheap alternatives, Birthday benefits, Quick-response support, Last-Minute Deals.
- **P2 / Phase 3**: Weather recommendations, Advanced AI personalization.
- **P3 / Phase 3 / Validation**: Rent & Earn (New business model requiring validation).

### 74.20 Updated User Journeys
1. **Nearby Discovery** — open Home → allow location → view nearby restaurants/map → filter by price/distance/open status → select restaurant/item.
2. **AI Item Search** — open AI Assistant → enter food request such as 'I want tomato' → interpret intent → retrieve live matching items → show ranked results → add to cart.
3. **Price Comparison** — enter food intent → compare eligible restaurants → view item and final payable estimates → select cheapest or best-value option.
4. **Home Kitchen Order** — search nearby → identify verified Home Kitchen → view profile/menu/timings → order within active service window.
5. **Birthday Order** — open Birthday/Party → choose cake/food/combos → apply eligible birthday offer → schedule if required → pay → track.
6. **Group Order** — create group → share link → participants add items → organizer reviews → split bill → participants pay → order confirmed.
7. **Scheduled Order** — choose restaurant → add items → select future time → confirm payment/order → reminder → restaurant prepares → delivery.
8. **Last-Minute Deal** — open deals → choose discounted surplus item → confirm quantity/expiry → order → delivery/pickup as supported.
9. **Support Escalation** — active order → select issue → quick-response options → automated resolution or human escalation → ticket status → resolution/refund.

### 74.21 Updated Business & Revenue Considerations
- The existing revenue model remains based on restaurant commissions, delivery margin, platform/convenience fees, restaurant subscriptions, sponsored listings, advertising and future premium membership.
- Coupons and birthday offers must support explicit funding ownership: restaurant-funded, platform-funded or shared campaign where configured.
- Last-Minute Deals are primarily a customer-value and food-waste reduction mechanism; platform economics should be tracked separately from normal orders.
- Rent & Earn, if validated, may introduce booking/rental commissions or service fees, but no revenue target should be assumed until the model is tested.

### 74.22 Updated Success Metrics
- **Discovery**: Nearby search → restaurant view rate (Measures local discovery usefulness).
- **AI**: AI query → item click/add-to-cart rate (Measures search/recommendation quality).
- **Budget**: Low-budget/cheapest-option conversion rate (Measures affordability proposition).
- **Personalization**: Repeat-order recommendation conversion (Measures history-based personalization).
- **Social**: Group order completion rate (Measures group ordering utility).
- **Payments**: Razorpay payment success rate (Measures checkout reliability).
- **Offers**: Coupon redemption rate (Measures promotion effectiveness).
- **Waste**: Meals sold through Last-Minute Deals (Measures food-waste impact).
- **Support**: Median first-response time (Measures support responsiveness).
- **Supply**: Active restaurants/home kitchens (Measures marketplace depth).

### 74.23 Updated Acceptance Criteria
- Customer can discover nearby restaurants and food items from both list and map views.
- Restaurant onboarding supports location, operating hours and verified restaurant/home-kitchen type.
- Customer can search natural-language food requests and receive only live, available matching items.
- AI can interpret ingredient/item-oriented requests such as 'I want tomato' and return relevant available menu items.
- Customer can compare eligible food options by effective price and choose a cheap/best-value alternative.
- Order history influences future recommendations and reorder suggestions.
- Group order supports a shareable link/code and shared cart.
- Split bill supports equal, own-item and custom amount modes.
- Scheduled orders enforce restaurant operating/preparation constraints.
- Razorpay payment flow handles success, failure, pending, retry and refund states without duplicate charges.
- Coupons and birthday benefits enforce configurable eligibility and usage rules.
- Last-Minute Deals enforce quantity and expiry limits.
- Customer support provides an order-linked quick-response path with escalation.
- 24/7 app access is not represented as 24/7 delivery; availability is always based on real operating data.

*Document status: PRD v2.0 — Updated with the newly requested features and proposed prioritization. The Rent & Earn concept is explicitly marked as unfinalized and should be validated before implementation.*
