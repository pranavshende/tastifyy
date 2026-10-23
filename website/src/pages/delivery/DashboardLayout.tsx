import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import CompanyAttribution from '../../components/ui/CompanyAttribution';

export default function DeliveryDashboardLayout() {
  return (
    <div className="min-h-screen bg-brand-light flex font-sans text-brand-dark">
      <Sidebar role="delivery" />
      
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 h-screen overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Outlet />
          <CompanyAttribution className="mt-8 border-t border-gray-200 pt-4 pb-2 text-center text-xs text-gray-500" />
        </div>
      </main>
    </div>
  );
}
