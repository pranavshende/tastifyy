import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Receipt, User } from 'lucide-react';

export default function MobileNav() {
  const location = useLocation();
  const path = location.pathname;

  // Don't show mobile nav on checkout or order tracking to maximize screen space
  if (path.includes('/checkout') || path.includes('/orders/')) {
    return null;
  }

  const links = [
    { to: '/customer/home', icon: <Home className="w-5 h-5" />, label: 'Home' },
    { to: '/customer/restaurants', icon: <Store className="w-5 h-5" />, label: 'Dining' },
    { to: '/customer/orders', icon: <Receipt className="w-5 h-5" />, label: 'Orders' },
    { to: '/customer/profile', icon: <User className="w-5 h-5" />, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around py-2 px-2 z-[60] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {links.map((link) => {
        const isActive = path.startsWith(link.to);
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
              isActive ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'
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
