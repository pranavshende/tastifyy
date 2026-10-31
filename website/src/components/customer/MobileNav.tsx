import { Link, useLocation } from 'react-router-dom';
import { Home, Utensils, Tag, User } from 'lucide-react';

export default function MobileNav() {
  const location = useLocation();
  const path = location.pathname;

  // Don't show mobile nav on checkout or order tracking to maximize screen space
  if (path.includes('/checkout') || path.includes('/orders/')) {
    return null;
  }

  const links = [
    { to: '/customer/home', icon: <Home className="w-5 h-5" />, label: 'Home' },
    { to: '/customer/restaurants', icon: <Utensils className="w-5 h-5" />, label: 'Restaurants' },
    { to: '/customer/offers', icon: <Tag className="w-5 h-5" />, label: 'Offers' },
    { to: '/customer/profile', icon: <User className="w-5 h-5" />, label: 'Account' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white flex items-center justify-around px-2 py-2 z-[60] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-gray-100">
      {links.map((link) => {
        const isActive = path === link.to || (link.to !== '/customer/home' && path.startsWith(link.to));
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {link.icon}
            <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-brand-primary' : 'text-gray-500'}`}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
