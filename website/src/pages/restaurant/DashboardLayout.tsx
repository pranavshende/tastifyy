import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, UtensilsCrossed, User, LogOut } from 'lucide-react';
import api from '../../api/axios';
import { getStorageUrl } from '../../lib/supabase';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [restaurantName, setRestaurantName] = useState<string>(user?.name || 'Restaurant Partner');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch minimal restaurant info for sidebar display
    api.get('/menu/info').then(({ data }) => {
      if (data.success && data.data.restaurant) {
        const r = data.data.restaurant;
        setRestaurantName(r.name || user?.name || 'Restaurant Partner');
        setLogoUrl(getStorageUrl(r.logo_url) || null);
      }
    }).catch(() => {
      // Silently fail — fallback to user name
    });
  }, [user?.name]);

  const handleLogout = async () => {
    await logout();
    navigate('/restaurant/login');
  };

  const navItems = [
    { path: '/restaurant/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/restaurant/menu', label: 'Menu Manager', icon: <UtensilsCrossed className="w-5 h-5" /> },
    { path: '/restaurant/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-56 bg-[#161B22] border-r border-gray-800 hidden md:flex flex-col z-30 fixed h-screen top-0 left-0 text-white">
        
        {/* Top — Restaurant Identity */}
        <div className="h-16 flex items-center px-4 border-b border-gray-800 shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-brand-primary text-white flex items-center justify-center font-black mr-3 text-sm shadow-sm shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span>{restaurantName?.charAt(0) || 'R'}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold tracking-tight leading-tight truncate">{restaurantName}</span>
            <span className="text-xs text-gray-400 font-medium mt-0.5">Restaurant Partner</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white border border-transparent'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom — User + Logout */}
        <div className="p-4 border-t border-gray-800 shrink-0">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'R'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">{user?.name || 'Restaurant'}</span>
              <span className="text-[10px] text-gray-400 font-medium">Partner</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-2 py-2 w-full text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-56">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <div className="flex items-center md:hidden">
            <span className="text-lg font-black">Tastifyy Partner</span>
          </div>
          
          {/* Top right */}
          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold text-green-700 hidden sm:block">Accepting Orders</span>
              <span className="text-xs font-bold text-green-700 sm:hidden">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 text-gray-700 border border-gray-200 flex items-center justify-center font-bold text-sm">
                {logoUrl ? (
                  <img src={logoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{restaurantName?.charAt(0) || 'R'}</span>
                )}
              </div>
              <span className="text-sm font-bold text-gray-700 hidden sm:block max-w-[120px] truncate">{restaurantName}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
