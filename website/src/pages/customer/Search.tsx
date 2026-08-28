import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Header from '../../components/customer/Header';
import RestaurantCard from '../../components/customer/RestaurantCard';
import { Loader2, ArrowLeft, Search as SearchIcon, ChefHat, Utensils } from 'lucide-react';

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
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: string;
  image_url?: string;
  is_veg: boolean;
  restaurant: {
    id: string;
    name: string;
    logo_url?: string;
    city: string;
  };
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Local state for header search input
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    setLocalQuery(query);
    if (!query) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    api.get(`/restaurants/search?q=${encodeURIComponent(query)}`)
      .then(res => {
        setRestaurants(res.data.data.restaurants || []);
        setMenuItems(res.data.data.menuItems || []);
        setError('');
      })
      .catch(err => {
        console.error(err);
        setError('Failed to fetch search results.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col pb-24">
      <Header 
        showSearch={true}
        searchQuery={localQuery}
        onSearchChange={setLocalQuery}

      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-8">
          Search results for "<span className="text-brand-primary">{query}</span>"
        </h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-brand-primary mb-4" />
            <p className="text-gray-500 font-bold">Searching kitchens...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-center font-bold">
            {error}
          </div>
        ) : (!restaurants.length && !menuItems.length) ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <SearchIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">No matches found</h2>
            <p className="text-gray-500 font-medium max-w-sm">We couldn't find any restaurants or dishes matching your search. Try different keywords.</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* RESTAURANTS SECTION */}
            {restaurants.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6">
                  <ChefHat className="w-6 h-6 text-brand-primary" /> Restaurants
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restaurants.map(r => (
                    <RestaurantCard
                      key={r.id}
                      id={r.id}
                      name={r.name}
                      coverImage={r.cover_image_url}
                      logo={r.logo_url}
                      cuisineTags={r.cuisine_tags}
                      isOpen={r.is_open !== false}
                      isPureVeg={r.is_pure_veg}
                      city={r.city}
                      rating={r.rating || 4.2}
                      prepTime={r.avg_preparation_time_mins}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* DISHES SECTION */}
            {menuItems.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6">
                  <Utensils className="w-6 h-6 text-brand-primary" /> Dishes
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {menuItems.map(item => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 hover:border-brand-primary/30 transition-colors cursor-pointer" onClick={() => navigate(`/customer/restaurants/${item.restaurant.id}`)}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-24 h-24 rounded-xl object-cover" />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300">
                          <Utensils className="w-8 h-8" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                          </span>
                          <h3 className="text-base font-black text-gray-900 truncate">{item.name}</h3>
                        </div>
                        <p className="text-gray-900 font-bold mb-2">₹{item.price}</p>
                        <p className="text-gray-400 text-xs font-medium truncate mb-2">{item.description || 'No description available'}</p>
                        
                        <div className="flex items-center gap-2 mt-auto">
                          {item.restaurant.logo_url && (
                            <img src={item.restaurant.logo_url} className="w-5 h-5 rounded-md object-cover" alt={item.restaurant.name} />
                          )}
                          <span className="text-xs font-bold text-gray-600 truncate">From {item.restaurant.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
          </div>
        )}
      </main>
    </div>
  );
}
