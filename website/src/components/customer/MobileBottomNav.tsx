import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, ShoppingBag, FileText, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuthStore();
  const currentPath = location.pathname;

  // We determine what "Home" means based on auth status
  const homePath = user ? '/customer/home' : '/';

  const navItems = [
    { name: 'Home', path: homePath, icon: <Home className="w-6 h-6" /> },
    { name: 'Explore', path: '/customer/restaurants', icon: <Compass className="w-6 h-6" /> },
    { name: 'Cart', path: '/customer/cart', icon: <ShoppingBag className="w-6 h-6" /> },
    { name: 'Orders', path: '/customer/orders', icon: <FileText className="w-6 h-6" /> },
    { name: 'Profile', path: user ? '/customer/profile' : '/customer/login', icon: <User className="w-6 h-6" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full md:hidden bg-white border-t border-gray-100 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-2">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          // Because homePath can be '/' or '/customer/home', exact match is safer for root.
          const isActive = item.path === '/' 
            ? currentPath === '/'
            : currentPath.startsWith(item.path);

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center w-16 h-14 transition-colors ${
                isActive ? 'text-brand-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`mb-1 transition-transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-brand-primary' : 'text-gray-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
