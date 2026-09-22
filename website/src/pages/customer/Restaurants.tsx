import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import Header from '../../components/customer/Header';
import RestaurantCard from '../../components/customer/RestaurantCard';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import {
  Search, MapPin, Flame, Star, Zap, Tag, Leaf, Clock, SlidersHorizontal, X
} from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  city: string;
  cover_image_url: string;
  logo_url: string;
  is_pure_veg: boolean;
  cuisine_tags: string[];
  avg_preparation_time_mins: number;
  is_open: boolean;
  rating?: number;
  reviews_count?: number;
  has_offer?: boolean;
  active_offer?: any;
}

type Filter = 'all' | 'for_you' | 'trending' | 'top_rated' | 'fast_delivery' | 'offers' | 'veg';

const FILTERS: { key: Filter; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'all', label: 'All', icon: <SlidersHorizontal className="w-4 h-4" />, desc: 'All restaurants' },
  { key: 'for_you', label: 'For You', icon: <Star className="w-4 h-4" />, desc: 'Based on your orders' },
  { key: 'trending', label: 'Trending', icon: <Flame className="w-4 h-4" />, desc: 'Hot this week' },
  { key: 'top_rated', label: 'Top Rated', icon: <Star className="w-4 h-4" />, desc: 'Highest rated' },
  { key: 'fast_delivery', label: 'Fast Delivery', icon: <Zap className="w-4 h-4" />, desc: 'Ready fast' },
  { key: 'offers', label: 'Offers', icon: <Tag className="w-4 h-4" />, desc: 'Active coupons' },
  { key: 'veg', label: 'Pure Veg', icon: <Leaf className="w-4 h-4" />, desc: 'Veg only' },
];

export default function Restaurants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState<Filter>((searchParams.get('filter') as Filter) || 'all');
  const [isOpenOnly, setIsOpenOnly] = useState(false);

  const fetchRestaurants = useCallback(async (filter: Filter) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/customer/restaurants', { params: { filter } });
      setRestaurants(data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants(activeFilter);
  }, [activeFilter, fetchRestaurants]);

  // Sync search and filter to URL
  useEffect(() => {
    const params: any = {};
    if (searchQuery) params.search = searchQuery;
    if (activeFilter !== 'all') params.filter = activeFilter;
    setSearchParams(params);
  }, [searchQuery, activeFilter, setSearchParams]);

  const handleFilterChange = (f: Filter) => {
    setActiveFilter(f);
    setSearchQuery('');
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesOpen = !isOpenOnly || r.is_open;
    return matchesSearch && matchesOpen;
  });

  const currentFilter = FILTERS.find(f => f.key === activeFilter)!;

  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark flex flex-col pb-20">
      <Header showSearch={false} />

      {/* ─── Sticky filter bar ─────────────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          {/* Search row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl leading-5 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all text-sm font-medium"
                placeholder="Search restaurants, cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setIsOpenOnly(v => !v)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                isOpenOnly
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Open
            </button>
          </div>

          {/* Filter tabs — horizontally scrollable */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key)}
                className={`snap-start flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  activeFilter === f.key
                    ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 hover:border-brand-primary hover:text-brand-primary'
                }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">

        {/* Breadcrumb */}
        <div className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2">
          <a href="/customer/home" className="hover:text-brand-primary transition-colors">Home</a>
          <span>/</span>
          <span className="text-gray-900">Restaurants</span>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              {currentFilter.icon}
              {searchQuery ? `"${searchQuery}"` : currentFilter.label}
            </h1>
            <p className="text-sm text-gray-400 font-medium mt-0.5">{currentFilter.desc}</p>
          </div>
          <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {filteredRestaurants.length} places
          </span>
        </div>

        {/* Active filter badge */}
        {(activeFilter !== 'all' || isOpenOnly) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {activeFilter !== 'all' && (
              <button
                onClick={() => handleFilterChange('all')}
                className="flex items-center gap-1.5 px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-sm font-bold hover:bg-brand-primary/20 transition-colors"
              >
                {currentFilter.icon} {currentFilter.label}
                <X className="w-3 h-3" />
              </button>
            )}
            {isOpenOnly && (
              <button
                onClick={() => setIsOpenOnly(false)}
                className="flex items-center gap-1.5 px-3 py-1 bg-gray-900/10 text-gray-900 rounded-full text-sm font-bold hover:bg-gray-900/20 transition-colors"
              >
                <Clock className="w-3 h-3" /> Open Now
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => { handleFilterChange('all'); setIsOpenOnly(false); setSearchQuery(''); }}
              className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <LoadingSkeleton type="restaurant" count={8} />
          </div>
        ) : error ? (
          <EmptyState
            icon={<MapPin />}
            title="Unable to load restaurants"
            description={error}
            action={
              <button
                onClick={() => fetchRestaurants(activeFilter)}
                className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary transition-colors"
              >
                Try Again
              </button>
            }
          />
        ) : filteredRestaurants.length === 0 ? (
          <EmptyState
            icon={<Search />}
            title="No restaurants found"
            description={
              searchQuery
                ? `No results for "${searchQuery}" with the current filters.`
                : `No restaurants match the current filter.`
            }
            action={
              <button
                onClick={() => { handleFilterChange('all'); setIsOpenOnly(false); setSearchQuery(''); }}
                className="px-6 py-3 bg-white border-2 border-brand-primary text-brand-primary rounded-xl font-black hover:bg-brand-primary hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRestaurants.map(restaurant => (
              <RestaurantCard
                key={restaurant.id}
                id={restaurant.id}
                name={restaurant.name}
                coverImage={restaurant.cover_image_url}
                logo={restaurant.logo_url}
                cuisineTags={restaurant.cuisine_tags}
                isOpen={restaurant.is_open}
                isPureVeg={restaurant.is_pure_veg}
                city={restaurant.city}
                rating={restaurant.rating}
                prepTime={restaurant.avg_preparation_time_mins}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
