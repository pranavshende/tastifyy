import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { Search, User, ChevronDown, Receipt, Menu, ShoppingCart, Phone } from 'lucide-react';
import { Logo } from '../ui/Logo';
import MobileNav from './MobileNav';
import NotificationBell from '../NotificationBell';
import FoodieBot from './FoodieBot';

const CUSTOMER_CARE_PHONE = '+91 98815 36081';

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
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        // click outside mobile menu
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
      <FoodieBot />
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-[0_1px_10px_-4px_rgba(0,0,0,0.04)]">
        <div className="max-w-[1400px] mx-auto px-3.5 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18 gap-2 sm:gap-3">
            {/* Left: Brand Logo & Title (compact without "Restaurant") */}
            <Link to="/customer/home" className="shrink-0 flex items-center group">
              <Logo size="sm" />
            </Link>

            {/* Center: Nav Links (Desktop Only) */}
            <nav className="hidden lg:flex items-center gap-7 mx-auto">
              <Link to="/customer/home" className="text-sm font-bold text-brand-primary relative">
                Home
                <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-brand-primary rounded-full"></span>
              </Link>
              <Link to="/customer/restaurants" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Restaurants</Link>
              <Link to="/customer/cuisines" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Cuisines</Link>
              <Link to="/customer/offers" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Offers</Link>
              <Link to="/customer/about" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">About</Link>
            </nav>

            {/* Desktop Search Bar */}
            {showSearch && (
              <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm relative group shrink-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="block w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-100 rounded-full text-xs sm:text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/10 transition-all"
                  placeholder="Search restaurants, cuisines..."
                />
              </div>
            )}

            {/* Right Actions: Compact Icons & Actions */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {/* Customer Care Phone (Desktop) */}
              <a href={`tel:${CUSTOMER_CARE_PHONE.replace(/\s/g, '')}`} className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-brand-primary bg-gray-50 px-2.5 py-1.5 rounded-full border border-gray-100 transition-colors">
                <Phone className="w-3.5 h-3.5" /> <span className="hidden xl:inline">Customer Care: </span>{CUSTOMER_CARE_PHONE}
              </a>

              {/* Mobile Search Icon (compact) */}
              <Link to="/customer/search" className="md:hidden p-1.5 text-gray-700 hover:bg-gray-50 rounded-full transition-colors" aria-label="Search">
                <Search className="w-4.5 h-4.5 text-gray-700" />
              </Link>

              {/* Notification Bell (if user) */}
              {user && <NotificationBell />}

              {/* Cart Icon with Live Badge (compact) */}
              <Link to="/customer/checkout" className="relative p-1.5 text-gray-700 hover:bg-gray-50 rounded-full transition-colors" aria-label="Cart">
                <ShoppingCart className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-gray-700" />
                {totalItems > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-brand-primary text-white text-[8.5px] sm:text-[9.5px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User Account / Profile */}
              {user ? (
                <div className="relative" ref={profileRef}>
                  <div 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-1 cursor-pointer p-0.5 pr-1 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {user.profile_photo_url ? (
                      <img src={user.profile_photo_url} alt={user.name} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-white shadow-sm" />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-xs border border-white shadow-sm">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <ChevronDown className={`hidden sm:block w-3 h-3 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {/* Dropdown Menu */}
                  <div className={`absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 transition-all transform origin-top-right z-50 p-2 ${isProfileOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
                    <div className="px-3 py-2.5 border-b border-gray-50 mb-1">
                      <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{user.email}</p>
                    </div>
                    <Link to="/customer/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors group/item">
                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover/item:bg-white group-hover/item:shadow-sm border border-transparent group-hover/item:border-gray-100 transition-all">
                        <User className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-700">My Profile</span>
                    </Link>
                    <Link to="/customer/orders" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors group/item">
                      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover/item:bg-white group-hover/item:shadow-sm border border-transparent group-hover/item:border-gray-100 transition-all">
                        <Receipt className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-700">Orders</span>
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors group/item text-left mt-1">
                      <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center group-hover/item:bg-white group-hover/item:shadow-sm border border-transparent group-hover/item:border-red-100 transition-all">
                        <User className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-red-600">Log out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/customer/login" className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-full hover:bg-brand-secondary transition-colors shadow-sm">
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Hamburger Menu on Mobile (compact) */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <Menu className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden fixed top-[56px] left-0 right-0 bg-white shadow-xl border-b border-gray-100 z-40 p-3.5 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-1">
            <Link to="/customer/home" onClick={() => setIsMobileMenuOpen(false)} className="px-3.5 py-2.5 rounded-xl font-bold text-gray-900 hover:bg-gray-50 flex items-center justify-between text-sm">
              <span>Home</span>
              <span className="text-xs text-brand-primary font-bold">●</span>
            </Link>
            <Link to="/customer/restaurants" onClick={() => setIsMobileMenuOpen(false)} className="px-3.5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm">Restaurants</Link>
            <Link to="/customer/offers" onClick={() => setIsMobileMenuOpen(false)} className="px-3.5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm">Offers & Deals</Link>
            <Link to="/customer/orders" onClick={() => setIsMobileMenuOpen(false)} className="px-3.5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm">My Orders</Link>
            <Link to="/customer/profile" onClick={() => setIsMobileMenuOpen(false)} className="px-3.5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm">Profile & Settings</Link>
            {!user && (
              <Link to="/customer/login" onClick={() => setIsMobileMenuOpen(false)} className="mt-2 w-full text-center py-2.5 bg-brand-primary text-white rounded-xl font-bold text-sm shadow-md">
                Sign In / Register
              </Link>
            )}
          </nav>
        </div>
      )}

      <MobileNav />
    </>
  );
}
