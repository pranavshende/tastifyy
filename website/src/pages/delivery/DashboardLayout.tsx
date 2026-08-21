import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';

export default function DeliveryDashboardLayout() {
  return (
    <div className="min-h-screen bg-brand-light flex font-sans text-brand-dark">
      <Sidebar role="delivery" />
      
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 h-screen overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
