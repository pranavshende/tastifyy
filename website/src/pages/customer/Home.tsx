import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import api from '../../api/axios';
import Header from '../../components/customer/Header';
import RestaurantCard from '../../components/customer/RestaurantCard';
import { Search, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Restaurant {
  id: string;
  name: string;
  city: string;
  is_pure_veg: boolean;
  cuisine_tags: string[];
  cover_image_url?: string;
  logo_url?: string;
  is_open: boolean;
  avg_preparation_time_mins?: number;
  rating?: number;
  distance_km?: number;
  reviews_count?: number;
  latitude?: number;
  longitude?: number;
  menu_items?: Array<{ id: string; name: string; price: number; image_url?: string; is_veg?: boolean }>;
}

const CUISINE_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🍽️', bg: 'bg-[#FF5B33]', text: 'text-white' },
  { id: 'burger', name: 'Burgers', icon: '🍔', bg: 'bg-orange-100', text: 'text-orange-700' },
  { id: 'pizza', name: 'Pizza', icon: '🍕', bg: 'bg-rose-100', text: 'text-rose-700' },
  { id: 'indian', name: 'Indian', icon: '🍛', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { id: 'sushi', name: 'Sushi', icon: '🍣', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { id: 'desserts', name: 'Desserts', icon: '🍰', bg: 'bg-pink-100', text: 'text-pink-700' },
  { id: 'beverages', name: 'Beverages', icon: '🥤', bg: 'bg-cyan-100', text: 'text-cyan-700' },
];

const OFFER_SLIDES = [
  {
    id: 1,
    tag: 'LIMITED TIME DEAL',
    title: '50% OFF',
    subtitle: 'Up to ₹200 off on your first delicious order',
    cta: 'Order Now',
    link: '/customer/restaurants',
    gradient: 'from-[#FF4112] via-[#FF5B33] to-[#FF7B33]',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 2,
    tag: 'FREE DELIVERY',
    title: 'Zero Delivery Fee',
    subtitle: 'Enjoy lightning-fast delivery on orders above ₹199',
    cta: 'Explore Deals',
    link: '/customer/restaurants',
    gradient: 'from-[#171717] via-[#242424] to-[#383838]',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 3,
    tag: 'CHEFS SPECIAL',
    title: 'Taste of Sakoli',
    subtitle: 'Fresh combos & authentic flavors from top local spots',
    cta: 'Discover More',
    link: '/customer/restaurants',
    gradient: 'from-[#16A34A] via-[#15803D] to-[#14532D]',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=600&auto=format&fit=crop',
  },
];

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizeRestaurant(restaurant: Record<string, unknown>): Restaurant {
  return {
    id: String(restaurant.id),
    name: typeof restaurant.name === 'string' ? restaurant.name : 'Restaurant',
    city: typeof restaurant.city === 'string' ? restaurant.city : '',
    is_pure_veg: Boolean(restaurant.is_pure_veg),
    cuisine_tags: Array.isArray(restaurant.cuisine_tags)
      ? restaurant.cuisine_tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    cover_image_url: typeof restaurant.cover_image_url === 'string' ? restaurant.cover_image_url : undefined,
    logo_url: typeof restaurant.logo_url === 'string' ? restaurant.logo_url : undefined,
    is_open: restaurant.is_open !== false,
    avg_preparation_time_mins: toFiniteNumber(restaurant.avg_preparation_time_mins),
    rating: toFiniteNumber(restaurant.rating) ?? 4.5,
    reviews_count: toFiniteNumber(restaurant.reviews_count) ?? 120,
    latitude: toFiniteNumber(restaurant.latitude),
    longitude: toFiniteNumber(restaurant.longitude),
    distance_km: toFiniteNumber(restaurant.distance_km) ?? toFiniteNumber(restaurant.distance),
    menu_items: Array.isArray(restaurant.menu_items) ? (restaurant.menu_items as any) : undefined,
  };
}

export default function CustomerHome() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Offer scrolling window state
  const [activeOffer, setActiveOffer] = useState(0);
  const [isOfferPaused, setIsOfferPaused] = useState(false);

  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Auto-scroll promotional window carousel
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!isOfferPaused) {
        setActiveOffer((curr) => (curr + 1) % OFFER_SLIDES.length);
      }
    }, 4500);

    return () => window.clearInterval(interval);
  }, [isOfferPaused]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get<Record<string, unknown>[]>('/restaurants');
        setRestaurants(response.data.map(normalizeRestaurant));
      } catch (err: unknown) {
        console.error('Failed to load restaurants', err);
        const message = isAxiosError<{ error?: { message?: string } }>(err)
          ? err.response?.data?.error?.message
          : undefined;
        setError(message || 'Failed to load restaurants nearby. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [user]);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      // Category filter
      if (activeCategory !== 'all') {
        const text = `${restaurant.name} ${restaurant.cuisine_tags.join(' ')}`.toLowerCase();
        if (activeCategory === 'burger' && !text.includes('burger') && !text.includes('fast food')) return false;
        if (activeCategory === 'pizza' && !text.includes('pizza') && !text.includes('italian')) return false;
        if (activeCategory === 'indian' && !text.includes('indian') && !text.includes('biryani') && !text.includes('thali')) return false;
        if (activeCategory === 'sushi' && !text.includes('sushi') && !text.includes('japanese') && !text.includes('asian')) return false;
        if (activeCategory === 'desserts' && !text.includes('dessert') && !text.includes('cake') && !text.includes('sweet') && !text.includes('ice cream')) return false;
        if (activeCategory === 'beverages' && !text.includes('beverage') && !text.includes('drink') && !text.includes('coffee') && !text.includes('tea')) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = restaurant.name.toLowerCase().includes(query);
        const matchesCuisine = restaurant.cuisine_tags.some((tag) => tag.toLowerCase().includes(query));
        const matchesDishes = (restaurant.menu_items || []).some((dish) => dish.name.toLowerCase().includes(query));
        if (!matchesName && !matchesCuisine && !matchesDishes) return false;
      }

      return true;
    });
  }, [activeCategory, restaurants, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-gray-900 flex flex-col pb-28 md:pb-16">
      <Header showSearch={false} />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6">
        {/* Hero Banner Window */}
        <section className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg bg-[#111315] text-white">
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1200&auto=format&fit=crop"
              alt="Delicious Food"
              className="w-full h-full object-cover object-right opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/30" />
          </div>

          <div className="relative z-10 px-5 py-6 sm:px-8 sm:py-10 max-w-xl">
            <p className="text-[11px] sm:text-xs font-bold text-gray-300 tracking-wider uppercase mb-1 sm:mb-1.5">
              Good Food • Great Mood
            </p>
            <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-tight mb-1 sm:mb-2">
              Multiple Restaurants<br />
              <span className="text-[#FF5B33]">One Platform</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 font-medium mb-4 sm:mb-6 max-w-sm">
              Explore a variety of cuisines from your favorite restaurants.
            </p>

            {/* Embedded Search Pill */}
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md bg-white rounded-full flex items-center p-1.5 sm:p-2 shadow-md">
              <div className="pl-3 sm:pl-3.5 pr-2 flex items-center pointer-events-none">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="flex-1 w-full py-1.5 sm:py-2 bg-transparent focus:outline-none text-xs sm:text-sm font-semibold text-gray-900 placeholder-gray-400"
                placeholder="Search for restaurants or cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        </section>

        {/* Cuisines Horizontal Scrolling Window */}
        <section className="mt-5 sm:mt-7">
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center">
            {CUISINE_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex flex-col items-center group shrink-0 focus:outline-none transition-transform active:scale-95"
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-[#FF5B33] text-white shadow-[#FF5B33]/30 shadow-md ring-2 ring-[#FF5B33] ring-offset-2'
                        : `${cat.bg} group-hover:scale-105`
                    }`}
                  >
                    <span>{cat.icon}</span>
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-bold mt-2 transition-colors ${
                      isActive ? 'text-[#FF5B33]' : 'text-gray-600 group-hover:text-gray-900'
                    }`}
                  >
                    {cat.name}
                  </span>
                  {isActive && (
                    <div className="w-5 h-0.5 bg-[#FF5B33] rounded-full mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Promotional Scrolling Window Carousel */}
        <section className="mt-6 sm:mt-8">
          <div
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-md border border-gray-100 bg-white"
            onMouseEnter={() => setIsOfferPaused(true)}
            onMouseLeave={() => setIsOfferPaused(false)}
          >
            {/* Sliding Container */}
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeOffer * 100}%)` }}
            >
              {OFFER_SLIDES.map((slide) => (
                <div
                  key={slide.id}
                  className={`min-w-full relative overflow-hidden bg-gradient-to-r ${slide.gradient} text-white p-5 sm:p-8 flex items-center justify-between gap-4`}
                >
                  <div className="relative z-10 max-w-sm sm:max-w-md">
                    <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider text-white mb-2">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      {slide.tag}
                    </span>
                    <h3 className="text-xl sm:text-3xl font-black tracking-tight leading-tight mt-1 mb-1">
                      {slide.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/90 font-medium mb-3">
                      {slide.subtitle}
                    </p>
                    <Link
                      to={slide.link}
                      className="inline-flex items-center gap-1.5 bg-white text-gray-900 font-bold rounded-full px-4 py-2 text-xs sm:text-sm shadow-md hover:bg-gray-100 transition-colors"
                    >
                      <span>{slide.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="relative h-24 w-24 sm:h-36 sm:w-36 shrink-0">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="h-full w-full object-cover rounded-full border-2 sm:border-4 border-white/30 shadow-lg"
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Previous/Next Scrolling Buttons */}
            <button
              type="button"
              aria-label="Previous offer"
              onClick={() =>
                setActiveOffer((curr) => (curr - 1 + OFFER_SLIDES.length) % OFFER_SLIDES.length)
              }
              className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-1.5 text-gray-900 shadow hover:bg-white transition-all hidden sm:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next offer"
              onClick={() => setActiveOffer((curr) => (curr + 1) % OFFER_SLIDES.length)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-white/80 backdrop-blur-sm p-1.5 text-gray-900 shadow hover:bg-white transition-all hidden sm:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {OFFER_SLIDES.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Slide ${index + 1}`}
                  onClick={() => setActiveOffer(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeOffer === index ? 'w-6 bg-white' : 'w-1.5 bg-white/60 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Top Restaurants Section */}
        <section className="mt-7 sm:mt-10">
          <div className="flex items-end justify-between mb-3.5 sm:mb-5">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                Top Restaurants
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                Discover the best food from top restaurants near you.
              </p>
            </div>
            <Link
              to="/customer/restaurants"
              className="text-xs sm:text-sm font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1 transition-colors shrink-0"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Restaurant Cards Container */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl sm:rounded-3xl p-4 border border-gray-100 shadow-sm animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="w-2/3 h-4 bg-gray-200 rounded" />
                      <div className="w-1/2 h-3 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="flex gap-2.5 mt-4 pt-3 border-t border-gray-50 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-24 shrink-0 space-y-1.5">
                        <div className="w-full aspect-[4/3] rounded-lg bg-gray-200" />
                        <div className="w-3/4 h-2.5 bg-gray-200 rounded" />
                        <div className="w-1/2 h-2.5 bg-gray-100 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => window.location.reload()}
                className="font-bold underline ml-2"
              >
                Try Again
              </button>
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-500 font-semibold text-sm">
                No restaurants found for this category.
              </p>
              <button
                onClick={() => setActiveCategory('all')}
                className="mt-3 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-full shadow-sm"
              >
                Show All Restaurants
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  id={restaurant.id}
                  name={restaurant.name}
                  logo={restaurant.logo_url}
                  coverImage={restaurant.cover_image_url}
                  cuisineTags={restaurant.cuisine_tags}
                  rating={restaurant.rating}
                  prepTime={restaurant.avg_preparation_time_mins}
                  isOpen={restaurant.is_open}
                  reviewsCount={restaurant.reviews_count ? String(restaurant.reviews_count) : undefined}
                  menuItems={restaurant.menu_items}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recommended For You: Horizontal Scrolling Window of Restaurants */}
        {!loading && filteredRestaurants.length > 2 && (
          <section className="mt-10 sm:mt-14 pt-6 border-t border-gray-100">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                  Recommended For You
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                  Popular handpicked spots loved by foodies nearby
                </p>
              </div>
            </div>

            {/* Horizontal Scrolling Window */}
            <div className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none pb-3 snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
              {filteredRestaurants.slice(0, 6).map((restaurant) => (
                <div
                  key={`rec-${restaurant.id}`}
                  className="w-[280px] sm:w-[320px] shrink-0 snap-start"
                >
                  <RestaurantCard
                    id={restaurant.id}
                    name={restaurant.name}
                    logo={restaurant.logo_url}
                    coverImage={restaurant.cover_image_url}
                    cuisineTags={restaurant.cuisine_tags}
                    rating={restaurant.rating}
                    prepTime={restaurant.avg_preparation_time_mins}
                    isOpen={restaurant.is_open}
                    reviewsCount={restaurant.reviews_count ? String(restaurant.reviews_count) : undefined}
                    menuItems={restaurant.menu_items}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
