# Design System — Tastifyy

```
Last Updated: 2026-09-12
Source of Truth: website/src/index.css, website/src/pages/**, tastifyyApp/app/**
Status: Current (describes implemented design)
```

---

## Brand Identity

| Attribute | Value |
|---|---|
| Brand Name | Tastifyy |
| Brand Symbol | "T" in a rounded orange square |
| Primary Color | `#E86A22` (warm orange) |
| Secondary Color | `#C1531A` (darker orange) |
| Dark/Text Color | `#171717` (near-black) |
| Background Light | `#FFF8F5` (warm cream) |
| Brand Voice | Premium, energetic, warm, food-forward |

---

## Color Palette

| Token | HEX | Usage |
|---|---|---|
| `brand-primary` | `#E86A22` | Buttons, icons, active states, accents |
| `brand-secondary` | `#C1531A` | Button hover, secondary actions |
| `brand-dark` | `#171717` | Text, headings |
| `brand-light` | `#FFF8F5` | Page backgrounds |
| White | `#FFFFFF` | Cards, modals |
| Gray 200 | `#E5E7EB` | Borders, dividers |
| Gray 500 | `#6B7280` | Secondary text |

---

## Typography

- **Font Family:** System fonts (Inter/Roboto from Tailwind base). Google Fonts not explicitly loaded.
- **Website (Tailwind classes):**
  - `text-4xl font-black` — Hero headings
  - `text-3xl font-bold` — Page headings
  - `text-lg font-medium` — Subheadings
  - `text-sm font-medium` — Labels
- **Mobile (React Native):**
  - fontWeight: '900' for brand name
  - fontSize: 28 for brand, 36 for logo

---

## Component Library (Website)

### Logo Component (`components/ui/Logo.tsx`)
- Renders "T" in orange rounded square + "Tastifyy" text
- Supports `size` prop (sm/md/lg) and `invert` for light-on-dark

### Buttons
- **Primary:** Orange bg, white text, rounded-xl, shadow, hover-lift effect
  - `bg-brand-primary hover:bg-brand-secondary hover:-translate-y-0.5 shadow-lg shadow-brand-primary/30`
- **Disabled:** `opacity-70 cursor-not-allowed`
- **Loading state:** Spinning white circle + text change

### Cards
- `rounded-3xl shadow-2xl` for major containers (login cards)
- `rounded-xl` for content cards (restaurant cards, order cards)
- Hover: subtle scale + shadow elevation

### Forms / Inputs
- `rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20`
- Password toggle (Eye/EyeOff icons from Lucide)
- Error state: `bg-red-50 text-red-500 border border-red-100 rounded-xl`

### Navigation (Website)
- **Customer:** `Header.tsx` with sticky glassmorphism effect (backdrop-blur)
  - Desktop: Links + search + profile
  - Mobile: Hamburger menu + bottom nav (`MobileBottomNav.tsx`)
- **Restaurant:** Left sidebar in `DashboardLayout.tsx` (sticky, collapsible)
- **Admin:** Similar left sidebar
- **Delivery:** Simple top bar layout

### Page Layouts
- **Auth pages (Login/Register):** 2-column card layout (brand image + form)
  - Left: Brand gradient panel with quote
  - Right: Form panel
- **Customer Home:** Header + hero search + restaurant grid
- **Restaurant Dashboard:** Sidebar + content area with real-time order cards
- **Admin Dashboard:** Wide table-focused layout with KPI cards

---

## Mobile Design (tastifyyApp)

### Splash Screen
- Cream background (`#FFF8F5`)
- Orange rounded square with "T" (72x72, radius 20)
- "Tastifyy" brand name (28px, fontWeight 900)
- Orange spinner

### Navigation (Mobile)
- Tab-based navigation (expo-router layout groups)
- No shared bottom nav component — each role group has its own layout

### Colors (same brand, React Native)
- Primary: `#E86A22`
- Background: `#FFF8F5`, `#FFFFFF`
- Text: `#171717`

---

## Design Principles

1. **Premium First:** No MVP-looking layouts. Cards, gradients, and micro-animations everywhere.
2. **Food-Forward Warmth:** Orange as the dominant color; cream backgrounds feel warm and appetizing.
3. **Responsive by Default:** All customer pages have mobile breakpoints.
4. **Clear Role Isolation:** Restaurant dashboard looks distinctly different from customer portal.
5. **Glassmorphism Headers:** Customer header uses `backdrop-filter: blur` for a modern feel.
6. **Shadow Depth:** Cards use layered shadows for perceived elevation.

---

## Implemented vs Planned Design

| Area | Status | Notes |
|---|---|---|
| Customer Login page | IMPLEMENTED | Premium 2-column layout, Google button |
| Customer Register page | IMPLEMENTED | Multi-step form with Google pre-fill |
| Customer Home | IMPLEMENTED | Sticky header, restaurant grid, search hero |
| Customer Restaurant Detail | IMPLEMENTED | Full menu with categories, cart |
| Customer Checkout | IMPLEMENTED | Address select, coupon, Razorpay |
| Customer Orders | IMPLEMENTED | Order history list |
| Customer Order Detail | IMPLEMENTED | Full tracking + rating |
| Customer Profile | IMPLEMENTED | Photo upload, address management |
| Restaurant Dashboard | IMPLEMENTED | Sidebar layout, live order cards |
| Restaurant Menu Manager | IMPLEMENTED | Category/item CRUD with image upload |
| Restaurant Profile | IMPLEMENTED | Editable profile + hours |
| Restaurant Transactions | IMPLEMENTED | Earnings table |
| Delivery Dashboard (web) | IMPLEMENTED | Active orders, location toggle |
| Admin Dashboard (web) | IMPLEMENTED | KPIs, user/restaurant/order management |
| Mobile Customer Home | IMPLEMENTED | Restaurant discovery |
| Mobile Cart | IMPLEMENTED | Cart + checkout flow |
| Mobile Orders | IMPLEMENTED | Order history + detail |
| Mobile Profile | IMPLEMENTED | Profile edit + address management |
| Mobile Delivery Dashboard | IMPLEMENTED | Assignment, OTP confirmation |
| Notification inbox UI | NOT IMPLEMENTED | Table exists in DB |
| Dark mode | NOT IMPLEMENTED | Not in current design system |
| Restaurant owner mobile dashboard | PARTIAL | Basic dashboard, limited features |
| AI Assistant UI (mobile) | PARTIAL | Input + response display only |
| Cuisines / Offers pages | PARTIAL | Pages exist, limited backend data |
