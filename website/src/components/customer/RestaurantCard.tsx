import { Link } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';
import { getStorageUrl } from '../../lib/supabase';

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

/**
 * Dish photo resolver:
 * 1. Checks if a real uploaded photo exists (resolves Supabase storage path or full URL).
 * 2. If null/empty, matches the dish name to an authentic, appetizing photo of THAT specific dish.
 */
function resolveDishPhoto(dishName: string, rawImageUrl?: string | null): string {
  // If real uploaded image is provided, resolve and return it
  if (rawImageUrl && rawImageUrl.trim()) {
    const resolved = getStorageUrl(rawImageUrl.trim());
    if (resolved) return resolved;
  }

  const name = dishName.toLowerCase();

  // Pizza variations
  if (name.includes('margarita') || name.includes('margherita')) {
    return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=300&auto=format&fit=crop';
  }
  if (name.includes('onion')) {
    return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=300&auto=format&fit=crop';
  }
  if (name.includes('cheese corn') || name.includes('corn')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&auto=format&fit=crop';
  }
  if (name.includes('paneer') && name.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?q=80&w=300&auto=format&fit=crop';
  }
  if (name.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?q=80&w=300&auto=format&fit=crop';
  }

  // Burgers & Sandwiches
  if (name.includes('burger')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300&auto=format&fit=crop';
  }
  if (name.includes('fries') || name.includes('peri peri')) {
    return 'https://images.unsplash.com/photo-1576107232684-1279f3908594?q=80&w=300&auto=format&fit=crop';
  }
  if (name.includes('sandwich')) {
    return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=300&auto=format&fit=crop';
  }

  // Maggi & Noodles
  if (name.includes('maggi') || name.includes('noodle') || name.includes('chowmein')) {
    return 'https://images.unsplash.com/photo-1612927601601-6638404737ce?q=80&w=300&auto=format&fit=crop';
  }

  // Indian Curries, Paneer & Tikka
  if (name.includes('paneer') || name.includes('tikka')) {
    return 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=300&auto=format&fit=crop';
  }
  if (name.includes('butter chicken') || name.includes('chicken curry') || name.includes('chicken')) {
    return 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?q=80&w=300&auto=format&fit=crop';
  }
  if (name.includes('dal') || name.includes('makhani')) {
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=300&auto=format&fit=crop';
  }
  if (name.includes('biryani') || name.includes('biriyani') || name.includes('rice') || name.includes('pulao')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=300&auto=format&fit=crop';
  }

  // Momos
  if (name.includes('momo')) {
    return 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?q=80&w=300&auto=format&fit=crop';
  }

  // Cakes & Desserts
  if (name.includes('cake') || name.includes('chocolate') || name.includes('pastry') || name.includes('dessert') || name.includes('brownie')) {
    return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=300&auto=format&fit=crop';
  }

  // Beverages & Coffee
  if (name.includes('coffee') || name.includes('shake') || name.includes('cold') || name.includes('beverage') || name.includes('tea')) {
    return 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=300&auto=format&fit=crop';
  }

  // Default food photo
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop';
}

function getCuisineTheme(tags: string[] = [], name: string = '') {
  const text = `${name} ${tags.join(' ')}`.toLowerCase();
  if (text.includes('burger') || text.includes('fast food') || text.includes('sandwich')) {
    return {
      bg: 'bg-amber-950',
      icon: '🍔',
    };
  }
  if (text.includes('pizza') || text.includes('italian') || text.includes('pasta')) {
    return {
      bg: 'bg-red-800',
      icon: '🍕',
    };
  }
  if (text.includes('cake') || text.includes('bakery') || text.includes('dessert')) {
    return {
      bg: 'bg-pink-900',
      icon: '🎂',
    };
  }
  return {
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

  // If real menu items are available, sort items with real uploaded photos first!
  const sortedMenuItems = menuItems && menuItems.length > 0
    ? [...menuItems].sort((a, b) => {
        const aHas = Boolean(a.image_url && a.image_url.trim());
        const bHas = Boolean(b.image_url && b.image_url.trim());
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        return 0;
      })
    : [];

  // Take up to 6 dishes for the scrolling window
  const displayDishes = sortedMenuItems.slice(0, 6).map((m) => ({
    name: m.name,
    price: m.price,
    image: resolveDishPhoto(m.name, m.image_url),
  }));

  const cuisinesString =
    cuisineTags.length > 0
      ? cuisineTags.slice(0, 3).join(' • ')
      : 'Indian • Fast Food • Snacks';

  const formattedReviews = reviewsCount
    ? `(${reviewsCount})`
    : `(${Math.floor(((rating || 4.5) * 230) % 900) + 100}+)`;

  const formattedTime = prepTime ? `${prepTime}-${prepTime + 10} min` : '25-40 min';
  const resolvedLogo = getStorageUrl(logo) || getStorageUrl(coverImage);

  return (
    <Link
      to={`/customer/restaurants/${id}`}
      className="group block bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-100 transition-all duration-300"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2.5">
        {/* Left: Avatar */}
        <div className="shrink-0">
          {resolvedLogo ? (
            <img
              src={resolvedLogo}
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
              isOpen ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
            }`}
          >
            {isOpen ? 'Open' : 'Closed'}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Bottom Dishes Row: Smooth horizontal scrolling window */}
      {displayDishes.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none pt-2.5 mt-3 border-t border-gray-50 snap-x">
          {displayDishes.map((dish, idx) => (
            <div key={idx} className="w-[84px] sm:w-[96px] shrink-0 flex flex-col snap-start">
              <div className="w-full aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] relative group-hover:shadow transition-shadow">
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop';
                  }}
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
      )}
    </Link>
  );
}
