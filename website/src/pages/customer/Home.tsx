import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

// Type definitions based on Prisma schema
interface MenuItem {
  id: string;
  name: string;
  price: number;
  is_veg: boolean;
  image_url?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  menu_items: MenuItem[];
}

interface Restaurant {
  id: string;
  name: string;
  type: string;
  city: string;
  service_radius_km: number;
  is_pure_veg: boolean;
  cuisine_tags: string[];
  cover_image_url?: string;
  menu_categories?: MenuCategory[];
}

export default function CustomerHome() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // Assume GET /api/restaurants returns active restaurants
        const response = await api.get('/restaurants');
        setRestaurants(response.data);
      } catch (err: any) {
        console.error('Failed to load restaurants', err);
        setError('Failed to load restaurants nearby. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/customer/login');
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.cuisine_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/customer/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-brand-primary text-white flex items-center justify-center font-black shadow-md shadow-brand-primary/20">
              T
            </div>
            <span className="text-xl font-black tracking-tight">Tastifyy</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <span className="text-sm font-medium text-gray-600">Delivering to: <span className="text-brand-dark font-bold">Mumbai</span></span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors ml-4"
            >
              Log Out
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-secondary to-brand-primary text-white flex items-center justify-center font-bold shadow-md cursor-pointer hover:scale-105 transition-transform">
              C
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Hero Section */}
        <section className="mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            What are you craving <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">today?</span>
          </h1>
          <p className="text-gray-500 text-lg mb-8 max-w-2xl font-medium">
            Explore the best food spots around you. Freshly prepared and delivered in minutes.
          </p>
          
          <div className="relative max-w-2xl shadow-xl shadow-gray-200/40 rounded-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-2xl">🔍</span>
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-4 rounded-2xl border-0 focus:ring-2 focus:ring-brand-primary/50 text-lg font-medium text-gray-900 placeholder-gray-400 bg-white transition-all outline-none"
              placeholder="Search for restaurants or cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Restaurant Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Nearby Favourites</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-white rounded-full text-xs font-bold shadow-sm border border-gray-100 cursor-pointer hover:border-brand-primary transition-colors">All</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-bold shadow-sm border border-gray-100 cursor-pointer hover:border-brand-primary transition-colors">Pure Veg</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-white rounded-3xl h-64 shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
                  <div className="w-full h-32 bg-gray-100 rounded-2xl"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-500 p-6 rounded-2xl font-medium text-center border border-red-100">
              {error}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center shadow-sm">
              <div className="text-5xl mb-4">🍽️</div>
              <h3 className="text-xl font-bold mb-2">No restaurants found</h3>
              <p className="text-gray-500 font-medium">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-brand-primary/10 transition-all duration-300 border border-gray-100 flex flex-col cursor-pointer">
                  {/* Card Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    {/* Placeholder image since we don't have real cover images yet */}
                    <img 
                      src={`https://source.unsplash.com/600x400/?food,${restaurant.cuisine_tags[0] || 'meal'}`} 
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback gradient if unsplash fails
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-orange-100', 'to-red-100');
                      }}
                    />
                    {restaurant.is_pure_veg && (
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-green-500 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Pure Veg</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-xl shadow-md font-bold text-sm flex items-center gap-1">
                      ⭐ 4.5
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-primary transition-colors">
                        {restaurant.name}
                      </h3>
                    </div>
                    <div className="text-sm text-gray-500 font-medium mb-4 flex-1">
                      {restaurant.cuisine_tags.join(' • ')}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-1 font-bold text-gray-700">
                        <span>🕒</span> 30-40 mins
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 font-medium">
                        <span>📍</span> {restaurant.city}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
