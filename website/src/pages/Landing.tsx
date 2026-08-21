import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Bike, Search, CheckCircle, Clock, MapPin, ArrowRight, ShieldCheck, Zap, Star } from 'lucide-react';
import api from '../api/axios';
import RestaurantCard from '../components/customer/RestaurantCard';
import MobileBottomNav from '../components/customer/MobileBottomNav';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { useAuthStore } from '../store/authStore';

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
  status: string;
  rating?: number;
}

export default function Landing() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.get('/restaurants');
        // Grab top 4 for the landing page
        setRestaurants(response.data.slice(0, 4));
      } catch (err) {
        console.error('Failed to load restaurants', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/home?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categories = [
    { name: 'Biryani', icon: '🥘' },
    { name: 'Pizza', icon: '🍕' },
    { name: 'Burgers', icon: '🍔' },
    { name: 'Chinese', icon: '🥡' },
    { name: 'South Indian', icon: '🍛' },
    { name: 'Desserts', icon: '🍰' },
    { name: 'Healthy', icon: '🥗' },
    { name: 'Drinks', icon: '🥤' }
  ];

  return (
    <div className="min-h-screen bg-[#FFFCF8] font-sans text-brand-dark selection:bg-brand-primary selection:text-white flex flex-col pb-16 md:pb-0">
      
      {/* 1. Header */}
      <header className="fixed w-full z-50 top-0 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          {/* Left: Logo & Location */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <span className="text-white font-black text-lg">T</span>
              </div>
              <span className="text-xl md:text-2xl font-black tracking-tight text-brand-dark">Tastifyy</span>
            </Link>

            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 hover:text-brand-primary transition-colors cursor-pointer group">
              <MapPin className="w-4 h-4 text-brand-primary group-hover:animate-bounce" />
              <span className="font-bold border-b border-dashed border-gray-300">Mumbai</span>
              <span className="text-gray-400">Maharashtra</span>
            </div>
          </div>

          {/* Right: Nav Links */}
          <div className="flex items-center gap-4 md:gap-8 font-medium text-gray-600">
            <a href="#how-it-works" className="hidden md:block text-sm hover:text-brand-primary transition-colors">How it works</a>
            <Link to="/customer/restaurants" className="hidden md:block text-sm hover:text-brand-primary transition-colors">Explore</Link>
            
            {user ? (
              <Link to="/customer/home" className="px-5 py-2 rounded-full bg-brand-primary text-white hover:bg-brand-secondary transition-transform hover:-translate-y-0.5 shadow-md font-bold text-sm">
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center bg-gray-100 rounded-full p-1 shadow-inner border border-gray-200">
                <Link to="/customer/login" className="px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-sm font-bold text-gray-700 hover:bg-white hover:text-brand-primary hover:shadow-sm transition-all">
                  Customer
                </Link>
                <div className="w-[1px] h-4 bg-gray-300 mx-0.5"></div>
                <Link to="/restaurant/login" className="px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-sm font-bold text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all">
                  Partner
                </Link>
                <div className="w-[1px] h-4 bg-gray-300 mx-0.5"></div>
                <Link to="/delivery/login" className="px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-sm font-bold text-gray-700 hover:bg-white hover:text-orange-600 hover:shadow-sm transition-all">
                  Rider
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 mt-16">
        
        {/* 2. Hero Section */}
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="z-10 text-center lg:text-left pt-8 md:pt-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-brand-primary text-xs font-bold tracking-wide uppercase mb-6 border border-orange-100">
                <Bike className="w-3.5 h-3.5" /> Fast delivery in Mumbai
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-[4rem] font-black tracking-tight leading-[1.1] mb-6 text-gray-900">
                Your favorite food, <br className="hidden lg:block" />
                <span className="text-brand-primary">delivered</span> to your door.
              </h1>
              
              <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto lg:mx-0 font-medium">
                Discover local restaurants, explore delicious dishes, and get your favorite meals delivered quickly and securely.
              </p>

              <form onSubmit={handleSearch} className="relative max-w-xl mx-auto lg:mx-0 flex items-center shadow-lg shadow-gray-200/50 rounded-2xl bg-white border border-gray-100 p-2 focus-within:ring-2 ring-brand-primary/20 transition-all">
                <div className="pl-3 hidden sm:flex">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-4 sm:pl-3 pr-4 py-3 bg-transparent focus:outline-none text-gray-900 font-medium placeholder-gray-400"
                  placeholder="Search for restaurants, cuisines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="bg-brand-primary hover:bg-brand-secondary text-white px-6 py-3 rounded-xl font-bold transition-colors whitespace-nowrap">
                  Find Food
                </button>
              </form>
            </div>

            {/* Right Image */}
            <div className="relative hidden md:block">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-100/50 rounded-full blur-3xl -z-10"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100/50 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop" 
                  alt="Delicious food spread" 
                  className="w-full h-[500px] object-cover"
                />
                
                {/* Floating Cards */}
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/20 flex items-center gap-2 animate-bounce-slow">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <div>
                    <div className="text-sm font-black text-gray-900">4.8 Rating</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Top Rated</div>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/20 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-900">30 Min</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Avg Delivery</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 3. Horizontal Categories */}
        <section className="py-8 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-black text-gray-900">What are you craving?</h2>
              <Link to="/customer/restaurants" className="text-brand-primary text-sm font-bold flex items-center hover:underline">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x">
              {categories.map((cat, i) => (
                <Link key={i} to={`/customer/restaurants?category=${cat.name}`} className="snap-start shrink-0 flex flex-col items-center gap-3 group w-20 md:w-24">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-50 flex items-center justify-center text-3xl shadow-sm border border-gray-100 group-hover:bg-orange-50 group-hover:border-brand-primary/30 group-hover:-translate-y-1 transition-all duration-300">
                    {cat.icon}
                  </div>
                  <span className="text-xs md:text-sm font-bold text-gray-700 group-hover:text-brand-primary transition-colors text-center">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Trending Restaurants */}
        <section className="py-16 bg-[#FFFCF8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-8">Trending Near You</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="bg-white rounded-2xl p-3 border border-gray-100 h-[280px]">
                    <LoadingSkeleton className="h-40 w-full rounded-xl mb-4" />
                    <LoadingSkeleton className="h-5 w-3/4 mb-2" />
                    <LoadingSkeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : restaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {restaurants.map(restaurant => (
                  <RestaurantCard
                    key={restaurant.id}
                    id={restaurant.id}
                    name={restaurant.name}
                    coverImage={restaurant.cover_image_url}
                    logo={restaurant.logo_url}
                    cuisineTags={restaurant.cuisine_tags}
                    rating={restaurant.rating}
                    prepTime={restaurant.avg_preparation_time_mins}
                    isOpen={restaurant.is_open}
                    isPureVeg={restaurant.is_pure_veg}
                    city={restaurant.city}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
                <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No restaurants found</h3>
                <p className="text-gray-500 mb-6">We are currently expanding to your area. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        {/* 5. Offers Section */}
        <section className="py-12 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-8">Offers Just For You</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-brand-primary to-orange-600 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden flex flex-col justify-between h-48 md:h-56 shadow-lg shadow-orange-500/20 group cursor-pointer">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="text-sm font-bold uppercase tracking-wider mb-1 opacity-90">First Order</div>
                  <div className="text-4xl md:text-5xl font-black mb-2">50% OFF</div>
                  <div className="text-sm font-medium bg-white/20 inline-block px-3 py-1 rounded-lg backdrop-blur-sm border border-white/20">Use code <span className="font-bold">WELCOME50</span></div>
                </div>
                <div className="relative z-10 self-start">
                  <Link to="/customer/restaurants" className="text-sm font-bold bg-white text-brand-primary px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center">
                    Order Now <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden flex flex-col justify-between h-48 md:h-56 shadow-lg shadow-gray-900/20 group cursor-pointer">
                <div className="absolute right-0 bottom-0 w-40 h-40 bg-brand-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="text-sm font-bold uppercase tracking-wider mb-1 text-gray-400">Above ₹299</div>
                  <div className="text-3xl md:text-4xl font-black mb-2 text-brand-primary">FREE DELIVERY</div>
                  <div className="text-sm font-medium bg-white/10 inline-block px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10">Auto-applied at checkout</div>
                </div>
                <div className="relative z-10 self-start">
                  <Link to="/customer/restaurants" className="text-sm font-bold bg-brand-primary text-white px-5 py-2.5 rounded-xl hover:bg-brand-secondary transition-colors inline-flex items-center">
                    Explore <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. How It Works */}
        <section className="py-20 bg-[#FFFCF8]" id="how-it-works">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">How Tastifyy Works</h2>
              <p className="text-gray-500 text-lg">Your favorite food is just three simple steps away.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative max-w-4xl mx-auto">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-[2px] bg-gray-200"></div>
              
              {[
                { step: '01', title: 'Discover', desc: 'Find restaurants near you.', icon: <Search className="w-6 h-6 text-brand-primary" /> },
                { step: '02', title: 'Choose', desc: 'Pick your favorite dishes.', icon: <CheckCircle className="w-6 h-6 text-brand-primary" /> },
                { step: '03', title: 'Enjoy', desc: 'Get your food delivered.', icon: <Clock className="w-6 h-6 text-brand-primary" /> }
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex md:flex-col items-center text-left md:text-center gap-6 md:gap-4 bg-white md:bg-transparent p-6 md:p-0 rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-gray-100 md:border-none">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0 mx-auto">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-brand-primary font-black text-xs md:text-sm tracking-widest mb-1 md:mb-2">STEP {item.step}</div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">{item.title}</h3>
                    <p className="text-gray-500 text-sm md:text-base">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Why Choose Us */}
        <section className="py-20 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-black text-gray-900 mb-12 text-center">Why Choose Tastifyy</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Fast Delivery', desc: 'Get your food delivered quickly while it is still hot.', icon: <Zap className="w-8 h-8 text-orange-500" /> },
                { title: 'Verified Restaurants', desc: 'Discover trusted and highly-rated restaurants.', icon: <ShieldCheck className="w-8 h-8 text-blue-500" /> },
                { title: 'Easy Ordering', desc: 'A seamless experience from discovery to checkout.', icon: <CheckCircle className="w-8 h-8 text-green-500" /> },
                { title: 'Secure Payments', desc: 'Safe, reliable, and lightning-fast payment methods.', icon: <ShieldCheck className="w-8 h-8 text-purple-500" /> }
              ].map((feature, i) => (
                <div key={i} className="bg-[#FFFCF8] p-8 rounded-3xl border border-orange-50 hover:border-orange-100 hover:shadow-sm transition-all text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Partner CTA */}
        <section className="py-16 bg-[#FFFCF8]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="bg-gray-900 rounded-[2rem] p-8 md:p-14 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
              
              <h2 className="relative z-10 text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                Good food is just a <br className="hidden sm:block" />
                <span className="text-brand-primary">few clicks away.</span>
              </h2>
              <p className="relative z-10 text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                Discover something delicious and order from your favorite restaurants today.
              </p>
              
              <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/customer/restaurants" className="px-8 py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/30 transition-all transform hover:-translate-y-1">
                  Explore Restaurants
                </Link>
                <Link to="/onboarding/delivery" className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-xl backdrop-blur-md transition-all">
                  Deliver with Us
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* 9. Footer */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8 md:pb-16 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-brand-dark flex items-center justify-center">
                  <span className="text-white font-black text-lg">T</span>
                </div>
                <span className="text-xl font-black tracking-tight text-gray-900">Tastifyy</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Your favorite food, delivered fast. We partner with the best local restaurants to bring you hot, fresh meals.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Company</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-500">
                <li><a href="#" className="hover:text-brand-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Legal</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-500">
                <li><a href="#" className="hover:text-brand-primary transition-colors">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-brand-primary transition-colors">Refund Policy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Partner with Us</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-500">
                <li><Link to="/restaurant" className="hover:text-brand-primary transition-colors flex items-center gap-2"><ChefHat className="w-4 h-4"/> Add Restaurant</Link></li>
                <li><Link to="/onboarding/delivery" className="hover:text-brand-primary transition-colors flex items-center gap-2"><Bike className="w-4 h-4"/> Deliver with Us</Link></li>
                <li className="pt-4"><Link to="/admin" className="text-gray-300 hover:text-brand-primary transition-colors block text-xs">Admin Console</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm font-medium">© {new Date().getFullYear()} Tastifyy. All rights reserved.</p>
            <div className="flex gap-4">
              {/* Social icons placeholder */}
              <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center cursor-pointer hover:text-brand-primary hover:border-brand-primary transition-colors">IG</div>
              <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center cursor-pointer hover:text-brand-primary hover:border-brand-primary transition-colors">TW</div>
              <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center cursor-pointer hover:text-brand-primary hover:border-brand-primary transition-colors">FB</div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

    </div>
  );
}
