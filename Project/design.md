# UI/UX Design

*Cross-reference: UI/UX structure, screens, components, and style decisions.*

## Brand
- **Name**: TASTIFYY
- **Tagline**: Discover. Order. Enjoy.

## Visual Direction
Premium, modern, friendly, food-focused, clean, fast, Indian startup feel.

### Palette
- **Primary**: Orange (`#E86A22`)
- **Secondary**: Warm Orange (`#C1531A`)
- **Dark**: `#171717`
- **Background**: Warm White

### UI Patterns
- Rounded cards
- High-quality food photography
- Clean, readable typography
- Bottom navigation on mobile
- Smooth, purposeful animations
- Skeleton loaders during data fetch
- Designed empty/error/loading states

## Navigation Structure (Role-Based)
The UI adapts based on the active authenticated role within the Unified App or Website:
- **Customer Experience**: Home · Search · Favorites · Orders · Profile (Secondary: Cart, AI Assistant, Rewards, etc.)
- **Restaurant Partner Experience**: Dashboard · Orders · Menu · Inventory · Offers · Analytics · Reviews · Profile
- **Delivery Partner Experience**: Home · Orders · Earnings · History · Profile
- **Admin Experience**: Dashboard · Users · Restaurants · Delivery Partners · Orders · Advertisements · Coupons · Payments · Revenue · Analytics · Complaints · Settings

*(Specific component specs to be defined during implementation)*
