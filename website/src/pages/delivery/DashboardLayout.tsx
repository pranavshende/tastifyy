import { Link, Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import CompanyAttribution from '../../components/ui/CompanyAttribution';
import { LayoutDashboard, Wallet, User } from 'lucide-react';

export default function DeliveryDashboardLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/delivery/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/delivery/earnings', label: 'Earnings', icon: <Wallet className="w-5 h-5" /> },
    { path: '/delivery/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-brand-light flex font-sans text-brand-dark">
      <Sidebar role="delivery" />
      
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 h-screen overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Outlet />
          <CompanyAttribution className="mt-8 border-t border-gray-200 pt-4 pb-2 text-center text-xs text-gray-500" />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar for Delivery Partner */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#161B22] border-t border-gray-800 z-40 grid grid-cols-3 items-center py-2 px-3 text-white shadow-2xl pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 transition-colors ${
                isActive ? 'text-brand-primary' : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span className={`text-[10px] font-bold mt-1 tracking-tight ${isActive ? 'text-brand-primary font-black' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
