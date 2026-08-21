import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Search, MapPin, ShoppingBag, User, ChevronDown, Receipt } from 'lucide-react';
import MobileNav from './MobileNav';

interface HeaderProps {
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  location?: string;
}

export default function Header({ showSearch = true, searchQuery = '', onSearchChange, location = 'Mumbai' }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/customer/login');
  };

  return (
    <>
    <header className="bg-white sticky top-0 z-50 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 lg:h-16">
        
        {/* Left: Logo */}
          <Link to="/customer/home" className="flex items-center gap-2 group shrink-0">
            <div className="bg-brand-primary text-white p-1.5 rounded-[10px] group-hover:bg-brand-secondary transition-colors">
              <span className="font-black text-lg leading-none block w-6 h-6 flex items-center justify-center">T</span>
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900 hidden sm:block">Tastifyy</span>
          </Link>

        {/* Center: Search / Location */}
        {showSearch ? (
          <div className="flex-1 max-w-xl mx-4 hidden md:flex">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-primary/50 focus:border-transparent sm:text-sm transition-all"
                placeholder="Search restaurants, dishes..."
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex justify-center hidden sm:flex">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors">
              <MapPin className="w-4 h-4 text-brand-primary" />
              <span className="text-sm font-bold text-gray-700 max-w-[150px] truncate">{location}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
          <Link to="/customer/orders" className="hidden sm:flex items-center text-sm font-bold text-gray-700 hover:text-brand-primary transition-colors">
            Orders
          </Link>
          
          <Link to="/customer/checkout" className="relative text-gray-600 hover:text-brand-primary transition-colors">
            <ShoppingBag className="w-5 h-5" />
          </Link>

          {user ? (
            <div className="relative group hidden sm:block">
              <div className="flex items-center gap-2 cursor-pointer">
                {user.profile_photo_url ? (
                  <img src={user.profile_photo_url} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-sm font-bold text-gray-700 max-w-[80px] truncate">{user.name?.split(' ')[0]}</span>
              </div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-soft border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50 p-2">
                <div className="px-3 py-2 border-b border-gray-50 mb-1">
                  <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
                </div>
                <Link to="/customer/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-bold text-gray-700">My Profile</span>
                </Link>
                <Link to="/customer/orders" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Receipt className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-bold text-gray-700">Orders</span>
                </Link>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-bold transition-colors">
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <Link to="/customer/login" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-sm font-bold rounded-full hover:bg-brand-secondary transition-colors">
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
        </div>
      </div>
      
      {/* Mobile Search Row (Only if showSearch is true) */}
      {showSearch && (
        <div className="md:hidden px-4 pb-3 bg-white">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="block w-full pl-11 pr-4 py-3.5 border-none rounded-2xl bg-gray-100 font-medium text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-inner"
              placeholder="Search restaurants, dishes..."
            />
          </div>
        </div>
      )}
    </header>
    <MobileNav />
    </>
  );
}
