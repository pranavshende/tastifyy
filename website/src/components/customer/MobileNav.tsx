import { Link, useLocation } from 'react-router-dom';
import { Home, Utensils, Tag, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function MobileNav() {
  const location = useLocation();
  const path = location.pathname;
  const { user } = useAuthStore();

  // Don't show mobile nav on checkout or order tracking to maximize screen space
  if (path.includes('/checkout') || path.includes('/orders/')) {
    return null;
  }

  const links = [
    { to: '/customer/home', icon: <Home className="w-5 h-5" />, label: 'Home' },
    { to: '/customer/restaurants', icon: <Utensils className="w-5 h-5" />, label: 'Restaurants' },
    { to: '/customer/offers', icon: <Tag className="w-5 h-5" />, label: 'Offers' },
    { 
      to: user ? '/customer/profile' : '/customer/login', 
      icon: user && user.profile_photo_url ? (
        <img src={user.profile_photo_url} alt="" className="w-5 h-5 rounded-full object-cover border border-gray-200" />
      ) : (
        <User className="w-5 h-5" />
      ), 
      label: 'Account' 
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full max-w-full bg-white grid grid-cols-4 items-center z-[70] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-gray-100 py-1.5">
      {links.map((link) => {
        const isActive = path === link.to || (link.to !== '/customer/home' && path.startsWith(link.to));
        return (
          <Link
            key={link.label}
            to={link.to}
            className={`flex flex-col items-center justify-center py-1 transition-all ${
              isActive ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="relative flex items-center justify-center">
              {link.icon}
            </div>
            <span className={`text-[10px] font-bold mt-0.5 tracking-tight ${isActive ? 'text-brand-primary font-black' : 'text-gray-500'}`}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
