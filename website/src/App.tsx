import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import CustomerLogin from './pages/customer/Login';
import CustomerPlaceholder from './pages/customer/Placeholder';
import RestaurantRegister from './pages/restaurant/Register';
import RestaurantLogin from './pages/restaurant/Login';
import DashboardLayout from './pages/restaurant/DashboardLayout';
import RestaurantDashboard from './pages/restaurant/Dashboard';
import MenuManager from './pages/restaurant/MenuManager';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Landing />} />
          
          {/* Customer Routes */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/home" element={<CustomerPlaceholder />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Restaurant Routes */}
          <Route path="/restaurant" element={<RestaurantRegister />} />
          <Route path="/restaurant/login" element={<RestaurantLogin />} />
          <Route element={<DashboardLayout />}>
            <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
            <Route path="/restaurant/menu" element={<MenuManager />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
