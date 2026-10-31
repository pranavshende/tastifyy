import { Link } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';

interface RestaurantCardProps {
  id: string;
  name: string;
  coverImage?: string;
  logo?: string;
  cuisineTags?: string[];
  rating?: number;
  prepTime?: number;
  isOpen?: boolean;
  isPureVeg?: boolean;
  city?: string;
  distance?: string;
  reviewsCount?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  menuItems?: Array<{ id: string; name: string; price: number; image_url?: string; is_veg?: boolean }>;
}

// Cuisine-specific fallback dishes for restaurants that haven't added menu items yet
const DEFAULT_PREVIEW_DISHES: Record<string, Array<{ name: string; price: number; image: string }>> = {
  indian: [
    { name: 'Butter Chicken', price: 179, image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=300&auto=format&fit=crop' },
    { name: 'Chicken Biryani', price: 149, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=300&auto=format&fit=crop' },
    { name: 'Paneer Tikka', price: 129, image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=300&auto=format&fit=crop' },
    { name: 'Dal Makhani', price: 119, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=300&auto=format&fit=crop' },
  ],
  burger: [
    { name: 'Classic Veg Burger', price: 99, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300&auto=format&fit=crop' },
    { name: 'Cheese Burger', price: 129, image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=300&auto=format&fit=crop' },
    { name: 'Peri Peri Fries', price: 79, image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?q=80&w=300&auto=format&fit=crop' },
    { name: 'Cold Coffee', price: 69, image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=300&auto=format&fit=crop' },
  ],
  pizza: [
    { name: 'Margherita Pizza', price: 179, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=300&auto=format&fit=crop' },
    { name: 'Farmhouse Pizza', price: 229, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop' },
    { name: 'Pasta Alfredo', price: 149, image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?q=80&w=300&auto=format&fit=crop' },
    { name: 'Garlic Bread', price: 79, image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?q=80&w=300&auto=format&fit=crop' },
  ],
};

function getCuisineTheme(tags: string[] = [], name: string = '') {
  const text = `${name} ${tags.join(' ')}`.toLowerCase();
  if (text.includes('burger') || text.includes('fast food') || text.includes('sandwich')) {
    return {
      dishes: DEFAULT_PREVIEW_DISHES.burger,
      bg: 'bg-amber-950',
      icon: '🍔',
    };
  }
  if (text.includes('pizza') || text.includes('italian') || text.includes('pasta')) {
    return {
      dishes: DEFAULT_PREVIEW_DISHES.pizza,
      bg: 'bg-red-800',
      icon: '🍕',
    };
  }
  return {
    dishes: DEFAULT_PREVIEW_DISHES.indian,
    bg: 'bg-[#6D1B1B]',
    icon: '🍛',
  };
}

export default function RestaurantCard({
  id,
  name,
  logo,
  coverImage,
  cuisineTags = [],
  rating = 4.5,
  prepTime,
  isOpen = true,
  reviewsCount,
  menuItems,
}: RestaurantCardProps) {
  const theme = getCuisineTheme(cuisineTags, name);

  // Use live dynamic menu items if available, else cuisine-aware preview dishes
  const displayDishes =
    menuItems && menuItems.length > 0
      ? menuItems.slice(0, 4).map((m) => ({
          name: m.name,
          price: m.price,
          image:
            m.image_url ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop',
        }))
      : theme.dishes;

  const cuisinesString =
    cuisineTags.length > 0
      ? cuisineTags.slice(0, 3).join(' • ')
      : 'Indian • Fast Food • Snacks';

  const formattedReviews = reviewsCount
    ? `(${reviewsCount})`
    : `(${Math.floor(((rating || 4.5) * 230) % 900) + 100}+)`;

  const formattedTime = prepTime ? `${prepTime}-${prepTime + 10} min` : '25-40 min';

  return (
    <Link
      to={`/customer/restaurants/${id}`}
      className="group block bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100 transition-all duration-300"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2.5">
        {/* Left: Avatar */}
        <div className="shrink-0">
          {logo || coverImage ? (
            <img
              src={logo || coverImage}
              alt={name}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-gray-100 shadow-sm"
              loading="lazy"
            />
          ) : (
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full ${theme.bg} flex flex-col items-center justify-center text-white text-center shadow-sm`}
            >
              <span className="text-sm leading-none">{theme.icon}</span>
              <span className="text-[8px] font-bold uppercase tracking-tight leading-tight mt-0.5 max-w-[40px] truncate">
                {name.split(' ')[0]}
              </span>
            </div>
          )}
        </div>

        {/* Center: Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] sm:text-base font-black text-gray-900 group-hover:text-brand-primary transition-colors truncate leading-snug">
            {name}
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate mt-0.5">
            {cuisinesString}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-600 mt-1">
            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{rating ? rating.toFixed(1) : '4.5'}</span>
            </span>
            <span className="text-gray-400 font-normal">{formattedReviews}</span>
            <span className="text-gray-300">•</span>
            <span className="flex items-center gap-1 text-gray-500">
              <span>🛵</span>
              <span>{formattedTime}</span>
            </span>
          </div>
        </div>

        {/* Right: Open Badge & Chevron */}
        <div className="shrink-0 flex items-center gap-1">
          <span
            className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md ${
              isOpen
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-400 text-white'
            }`}
          >
            {isOpen ? 'Open' : 'Closed'}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Bottom Dishes Row */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5 mt-3 pt-2.5 border-t border-gray-50">
        {displayDishes.map((dish, idx) => (
          <div key={idx} className="flex flex-col min-w-0">
            <div className="w-full aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] relative group-hover:shadow transition-shadow">
              <img
                src={dish.image}
                alt={dish.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-800 truncate mt-1 leading-tight">
              {dish.name}
            </p>
            <p className="text-[11px] sm:text-xs font-black text-brand-primary mt-0.5">
              ₹{dish.price}
            </p>
          </div>
        ))}
      </div>
    </Link>
  );
}
