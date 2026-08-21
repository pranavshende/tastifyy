import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User, LayoutDashboard, UtensilsCrossed, Settings, Users, Store, Bike, LifeBuoy } from 'lucide-react';

export interface SidebarProps {
  role?: 'admin' | 'restaurant' | 'delivery';
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  // Legacy props
  title?: string;
  items?: any[];
  baseRoute?: string;
}

export default function Sidebar({ role, activeTab, onTabChange, title, items, baseRoute }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate(`/${role || 'partner'}/login`);
  };

  const getMenu = () => {
    if (role === 'restaurant') {
      return {
        title: 'Restaurant',
        baseRoute: '/restaurant',
        items: [
          { name: 'Dashboard', id: 'dashboard', path: '/restaurant/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
          { name: 'Menu Manager', id: 'menu', path: '/restaurant/menu', icon: <UtensilsCrossed className="w-5 h-5" /> },
          { name: 'Profile', id: 'profile', path: '/restaurant/profile', icon: <Settings className="w-5 h-5" /> },
        ]
      };
    }
    if (role === 'admin') {
      return {
        title: 'Admin Portal',
        baseRoute: '/admin',
        items: [
          { name: 'Overview', id: 'overview', path: '#', icon: <LayoutDashboard className="w-5 h-5" /> },
          { name: 'Restaurants', id: 'restaurants', path: '#', icon: <Store className="w-5 h-5" /> },
          { name: 'Orders', id: 'orders', path: '#', icon: <UtensilsCrossed className="w-5 h-5" /> },
          { name: 'Delivery Fleet', id: 'delivery', path: '#', icon: <Bike className="w-5 h-5" /> },
          { name: 'Platform Users', id: 'users', path: '#', icon: <Users className="w-5 h-5" /> },
          { name: 'Support', id: 'support', path: '#', icon: <LifeBuoy className="w-5 h-5" /> },
        ]
      };
    }
    return { title: title || 'Dashboard', baseRoute: baseRoute || '', items: items || [] };
  };

  const menu = getMenu();

  return (
    <aside className="w-64 bg-brand-dark text-white h-screen flex flex-col fixed left-0 top-0 border-r border-gray-800 z-40 hidden lg:flex">
      {/* Brand */}
      <div className="h-20 flex items-center px-6 border-b border-gray-800 shrink-0">
        <Link to={`${menu.baseRoute}/dashboard`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-black shadow-md text-xl">
            T
          </div>
          <span className="text-xl font-black tracking-tight">{menu.title}</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
        {menu.items.map((item) => {
          let isActive = false;
          if (onTabChange) {
            isActive = activeTab === item.id;
          } else {
            isActive = location.pathname.includes(item.path);
          }

          return (
            <button
              key={item.name}
              onClick={() => {
                if (onTabChange) {
                  onTabChange(item.id);
                } else if (item.path !== '#') {
                  navigate(item.path);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${
                isActive 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Profile & Logout */}
      <div className="p-4 border-t border-gray-800 shrink-0">
        <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-white/5 border border-white/10">
          <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center font-bold">
            {user?.name?.charAt(0) || <User className="w-5 h-5" />}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-bold truncate">{user?.name || 'Partner'}</p>
            <p className="text-xs text-gray-400 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl font-bold transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
