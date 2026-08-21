import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import CustomerLogin from './pages/customer/Login';
import CustomerHome from './pages/customer/Home';
import RestaurantRegister from './pages/restaurant/Register';
import RestaurantLogin from './pages/restaurant/Login';
import DashboardLayout from './pages/restaurant/DashboardLayout';
import RestaurantDashboard from './pages/restaurant/Dashboard';
import MenuManager from './pages/restaurant/MenuManager';
import DeliveryLogin from './pages/delivery/Login';
import CustomerOnboarding from './pages/onboarding/CustomerOnboarding';
import RestaurantOnboarding from './pages/onboarding/RestaurantOnboarding';
import DeliveryOnboarding from './pages/onboarding/DeliveryOnboarding';
import StatusScreen from './pages/onboarding/Status';

// New MVP Pages
import Restaurants from './pages/customer/Restaurants';
import RestaurantDetails from './pages/customer/RestaurantDetails';
import Checkout from './pages/customer/Checkout';
import Orders from './pages/customer/Orders';
import OrderDetails from './pages/customer/OrderDetails';
import CustomerProfile from './pages/customer/Profile';
import RestaurantProfile from './pages/restaurant/Profile';
import DeliveryDashboardLayout from './pages/delivery/DashboardLayout';
import DeliveryProfile from './pages/delivery/Profile';

function AppRoutes() {
  const { user } = useAuthStore();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />

      {/* Auth Routes — redirect to dashboard if already logged in */}
      <Route
        path="/customer/login"
        element={user ? <Navigate to="/customer/home" replace /> : <CustomerLogin />}
      />
      <Route
        path="/restaurant/login"
        element={user ? <Navigate to="/restaurant/dashboard" replace /> : <RestaurantLogin />}
      />
      <Route
        path="/restaurant"
        element={user ? <Navigate to="/restaurant/dashboard" replace /> : <RestaurantRegister />}
      />
      <Route
        path="/admin"
        element={user ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />}
      />
      <Route
        path="/delivery/login"
        element={user ? <Navigate to="/delivery/dashboard" replace /> : <DeliveryLogin />}
      />

      {/* Protected Customer Routes */}
      <Route
        path="/customer/home"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/profile"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/restaurants"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Restaurants />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/restaurants/:id"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <RestaurantDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/checkout"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/orders"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/orders/:id"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <OrderDetails />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Restaurant Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['restaurant_partner']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
        <Route path="/restaurant/menu" element={<MenuManager />} />
        <Route path="/restaurant/profile" element={<RestaurantProfile />} />
      </Route>

      {/* Delivery Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['delivery_partner']}>
            <DeliveryDashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/delivery/dashboard" element={
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 font-bold text-lg">Delivery Dashboard — Coming in Phase H</p>
          </div>
        } />
        <Route path="/delivery/profile" element={<DeliveryProfile />} />
      </Route>

      {/* Onboarding Routes */}
      <Route
        path="/onboarding/customer"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/restaurant"
        element={
          <ProtectedRoute allowedRoles={['restaurant_partner']}>
            <RestaurantOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/delivery"
        element={
          <ProtectedRoute allowedRoles={['delivery_partner']}>
            <DeliveryOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/status"
        element={
          <ProtectedRoute allowedRoles={['restaurant_partner', 'delivery_partner']}>
            <StatusScreen />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const { initAuth } = useAuthStore();

  // On every mount: validate stored session with backend
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;
