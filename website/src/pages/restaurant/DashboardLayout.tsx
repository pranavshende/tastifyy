import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/restaurant/login');
  };

  const navItems = [
    { path: '/restaurant/dashboard', label: 'Live Orders', icon: '🔔' },
    { path: '/restaurant/menu', label: 'Menu Manager', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:flex flex-col shadow-sm z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center font-bold mr-2">T</div>
          <span className="text-xl font-black text-brand-dark">Partner</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Management</div>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive 
                    ? 'bg-brand-primary/10 text-brand-primary' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all font-medium"
          >
            <span>🚪</span>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center md:hidden">
            <span className="text-xl font-black text-brand-dark">Tastifyy Partner</span>
          </div>
          
          {/* Top right profile/actions */}
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600">Store Active</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary text-white flex items-center justify-center font-bold shadow-md cursor-pointer hover:scale-105 transition-transform">
              R
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
