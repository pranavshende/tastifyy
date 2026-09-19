import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/dashboard/Sidebar';
import ErrorBoundary from '../../components/ErrorBoundary';

export default function DeliveryDashboardLayout() {
  return (
    <div className="min-h-screen bg-brand-light flex font-sans text-brand-dark">
      <Sidebar role="delivery" />
      
      <main className="flex-1 p-6 pt-20 lg:ml-64 lg:p-8 lg:pt-8 h-screen overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <ErrorBoundary title="Unable to load the delivery dashboard">
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
