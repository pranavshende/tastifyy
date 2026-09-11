import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { Search, MapPin, User, ChevronDown, Receipt, Menu, ShoppingCart } from 'lucide-react';
import { Logo } from '../ui/Logo';
import MobileNav from './MobileNav';
import { useUserLocation } from '../../hooks/useUserLocation';

interface HeaderProps {
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  location?: string;
}

export default function Header({ showSearch = true, searchQuery = '', onSearchChange, location }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const userLocation = useUserLocation();
  const displayCity = location ?? userLocation.city;
  const { items } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/customer/login');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/customer/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
    <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
          
          {/* Mobile Menu Icon */}
          <button className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link to="/customer/home" className="shrink-0 flex items-center">
            <Logo size="md" />
          </Link>

          {/* Location (Desktop & Tablet) */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors cursor-pointer shrink-0 border border-gray-100 max-w-[200px] lg:max-w-[240px]">
            <div className="w-7 h-7 bg-orange-100/50 rounded-full flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 text-brand-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 font-bold tracking-wide leading-none mb-0.5">Delivering to</span>
              <span className="text-xs font-bold text-gray-900 truncate">{userLocation.loading && !location ? 'Locating...' : displayCity}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
          </div>

          {/* Center Nav Links (Desktop Only) */}
          <nav className="hidden lg:flex items-center gap-8 mx-auto">
            <Link to="/customer/home" className="text-sm font-bold text-brand-primary relative">
              Home
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-brand-primary rounded-full"></span>
            </Link>
            <Link to="/customer/restaurants" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Restaurants</Link>
            <Link to="/customer/restaurants" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Cuisines</Link>
            <Link to="/customer/restaurants" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Offers</Link>
            <Link to="/customer/restaurants" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">About</Link>
          </nav>

          {/* Search Bar (Desktop Only) */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm relative group shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={handleKeyDown}
                className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-full text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/10 transition-all"
                placeholder="Search restaurants, cuisines..."
              />
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <Link to="/customer/checkout" className="relative p-2 text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 sm:w-4.5 sm:h-4.5 bg-brand-primary text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group">
                <div className="flex items-center gap-2 cursor-pointer p-1 pr-2 rounded-full hover:bg-gray-50 transition-colors">
                  {user.profile_photo_url ? (
                    <img src={user.profile_photo_url} alt={user.name} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden lg:flex flex-col items-start justify-center min-w-0">
                    <p className="text-[10px] text-gray-500 font-bold uppercase leading-none tracking-wider mb-0.5">Hi,</p>
                    <p className="text-sm font-black text-gray-900 leading-none truncate max-w-[80px]">{user.name?.split(' ')[0]}</p>
                  </div>
                  <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-gray-400 ml-1" />
                </div>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right translate-y-2 group-hover:translate-y-0 z-50 p-2">
                  <div className="px-3 py-3 border-b border-gray-50 mb-1">
                    <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{user.email}</p>
                  </div>
                  <Link to="/customer/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group/item">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover/item:bg-white group-hover/item:shadow-sm border border-transparent group-hover/item:border-gray-100 transition-all">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">My Profile</span>
                  </Link>
                  <Link to="/customer/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group/item">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover/item:bg-white group-hover/item:shadow-sm border border-transparent group-hover/item:border-gray-100 transition-all">
                      <Receipt className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Orders</span>
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors group/item text-left mt-1">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover/item:bg-white group-hover/item:shadow-sm border border-transparent group-hover/item:border-red-100 transition-all">
                      <User className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-sm font-bold text-red-600">Log out</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/customer/login" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-sm font-bold rounded-full hover:bg-brand-secondary transition-colors shadow-[0_4px_14px_0_rgba(255,107,0,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,0,0.23)]">
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Location Row (Shown below header on mobile) */}
      <div className="sm:hidden px-4 py-2.5 bg-white border-t border-gray-100 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-50 rounded-full flex items-center justify-center">
               <MapPin className="w-3 h-3 text-brand-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-none">Delivering to</span>
              <span className="text-xs font-bold text-gray-900 truncate max-w-[200px]">{userLocation.loading && !location ? 'Locating...' : displayCity}</span>
            </div>
         </div>
         <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>

    </header>
    <MobileNav />
    </>
  );
}
