import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, UtensilsCrossed, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/restaurant/login');
  };

  const navItems = [
    { path: '/restaurant/dashboard', label: 'Live Orders', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/restaurant/menu', label: 'Menu Manager', icon: <UtensilsCrossed className="w-5 h-5" /> },
    { path: '/restaurant/profile', label: 'Profile Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 hidden md:flex flex-col z-30 fixed h-screen top-0 left-0">
        <div className="h-14 flex items-center px-6 border-b border-gray-200 shrink-0">
          <div className="w-7 h-7 rounded bg-brand-primary text-white flex items-center justify-center font-black mr-2 text-sm shadow-sm">T</div>
          <span className="text-lg font-black tracking-tight">Partner</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Management</div>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all font-bold text-sm ${
                  isActive 
                    ? 'bg-orange-50 text-brand-primary border border-brand-primary/20' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 py-2.5 w-full rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-60">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <div className="flex items-center md:hidden">
            <span className="text-lg font-black">Tastifyy Partner</span>
          </div>
          
          {/* Top right profile/actions */}
          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold text-green-700 hidden sm:block">Accepting Orders</span>
              <span className="text-xs font-bold text-green-700 sm:hidden">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 border border-gray-200 flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'R'}
              </div>
              <span className="text-sm font-bold text-gray-700 hidden sm:block max-w-[120px] truncate">{user?.name}</span>
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
