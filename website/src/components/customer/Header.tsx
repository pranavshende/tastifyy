import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { Search, MapPin, User, ChevronDown, Receipt, Menu, ShoppingCart } from 'lucide-react';
import { Logo } from '../ui/Logo';
import MobileNav from './MobileNav';
import LocationModal from './LocationModal';
import { useLocationStore } from '../../store/locationStore';
import NotificationBell from '../NotificationBell';

interface HeaderProps {
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export default function Header({ showSearch = true, searchQuery = '', onSearchChange }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { items } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const { city, selectedZone } = useLocationStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        // don't close if they clicked the hamburger button itself (handled by its onClick)
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/customer/login');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/customer/search?q=${encodeURIComponent(searchQuery)}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
    <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
          
          {/* Mobile Menu Icon */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors z-50 relative"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Logo */}
          <Link to="/customer/home" className="shrink-0 flex items-center">
            <Logo size="md" />
          </Link>

          {/* Location (Desktop & Tablet) */}
          <button 
            onClick={() => setIsLocationModalOpen(true)}
            className="hidden sm:flex items-center gap-2 lg:gap-2.5 px-3 lg:px-4 py-2 lg:py-2.5 rounded-2xl hover:bg-gray-50/80 transition-colors border border-transparent hover:border-gray-100 cursor-pointer text-left"
          >
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 lg:w-4.5 lg:h-4.5 text-brand-primary fill-brand-primary/20" />
            </div>
            <div className="flex flex-col min-w-[100px] lg:min-w-[120px] max-w-[160px] lg:max-w-[200px]">
              <span className="text-[11px] lg:text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                Delivering to {city === 'Sakoli' ? '' : `• ${city}`}
              </span>
              <span className="text-xs lg:text-sm font-black text-gray-900 truncate leading-tight mt-0.5 flex items-center gap-1.5">
                {selectedZone ? selectedZone.name : 'Select Delivery Zone'}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              </span>
            </div>
          </button>

          {/* Center Nav Links (Desktop Only) */}
          <nav className="hidden lg:flex items-center gap-8 mx-auto">
            <Link to="/customer/home" className="text-sm font-bold text-brand-primary relative">
              Home
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-brand-primary rounded-full"></span>
            </Link>
            <Link to="/customer/restaurants" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Restaurants</Link>
            <Link to="/customer/cuisines" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Cuisines</Link>
            <Link to="/customer/offers" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Offers</Link>
            <Link to="/customer/about" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">About</Link>
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
            {user && <NotificationBell />}
            <Link to="/customer/checkout" className="relative p-2 text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 sm:w-4.5 sm:h-4.5 bg-brand-primary text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative" ref={profileRef}>
                <div 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 cursor-pointer p-1 pr-2 rounded-full hover:bg-gray-50 transition-colors"
                >
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
                  <ChevronDown className={`hidden lg:block w-3.5 h-3.5 text-gray-400 ml-1 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {/* Dropdown Menu */}
                <div className={`absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 transition-all transform origin-top-right z-50 p-2 ${isProfileOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
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
      
      {/* Location Bar (Mobile Only) */}
      <div 
        onClick={() => setIsLocationModalOpen(true)}
        className="sm:hidden bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100 shadow-[0_4px_15px_-10px_rgba(0,0,0,0.05)] cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
          <MapPin className="w-4.5 h-4.5 text-brand-primary fill-brand-primary/20" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            Delivering to {city === 'Sakoli' ? '' : `• ${city}`}
          </span>
          <span className="text-[13px] font-black text-gray-900 truncate leading-tight mt-0.5">
            {selectedZone ? selectedZone.name : 'Select Delivery Zone'}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>

     </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden fixed top-[64px] left-0 right-0 bg-white shadow-lg border-b border-gray-100 z-40 p-4 animate-in slide-in-from-top-2">
          {showSearch && (
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={handleKeyDown}
                className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-primary"
                placeholder="Search restaurants, cuisines..."
              />
            </div>
          )}
          <nav className="flex flex-col gap-2">
            <Link to="/customer/home" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl font-bold text-gray-900 hover:bg-gray-50">Home</Link>
            <Link to="/customer/restaurants" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900">Restaurants</Link>
            <Link to="/customer/cuisines" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900">Cuisines</Link>
            <Link to="/customer/offers" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900">Offers</Link>
            <Link to="/customer/about" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900">About</Link>
          </nav>
        </div>
      )}

      <LocationModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)} 
      />

    <MobileNav />
    </>
  );
}
