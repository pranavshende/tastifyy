import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Receipt, Heart, User } from 'lucide-react';

export default function MobileNav() {
  const location = useLocation();
  const path = location.pathname;

  // Don't show mobile nav on checkout or order tracking to maximize screen space
  if (path.includes('/checkout') || path.includes('/orders/')) {
    return null;
  }

  const links = [
    { to: '/customer/home', icon: <Home className="w-6 h-6" />, label: 'Home' },
    { to: '/customer/search', icon: <Search className="w-6 h-6" />, label: 'Search' },
    { to: '/customer/orders', icon: <Receipt className="w-6 h-6" />, label: 'Orders' },
    { to: '/customer/favorites', icon: <Heart className="w-6 h-6" />, label: 'Favorites' },
    { to: '/customer/profile', icon: <User className="w-6 h-6" />, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white flex items-center justify-between px-4 py-2 z-[60] pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.08)] rounded-t-[24px]">
      {links.map((link) => {
        const isActive = path.startsWith(link.to);
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              isActive ? 'text-brand-primary scale-110' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {link.icon}
            <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-brand-primary' : ''}`}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
