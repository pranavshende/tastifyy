import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import CustomerHome from './pages/customer/Home';
import About from './pages/customer/About';
import RestaurantDetails from './pages/customer/RestaurantDetails';
import SakoliLanding from './pages/customer/SakoliLanding';

const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const CustomerLogin = lazy(() => import('./pages/customer/Login'));
const CustomerRegister = lazy(() => import('./pages/customer/Register'));
const Contact = lazy(() => import('./pages/customer/Contact'));
const RestaurantRegister = lazy(() => import('./pages/restaurant/Register'));
const RestaurantLogin = lazy(() => import('./pages/restaurant/Login'));
const DashboardLayout = lazy(() => import('./pages/restaurant/DashboardLayout'));
const RestaurantDashboard = lazy(() => import('./pages/restaurant/Dashboard'));
const MenuManager = lazy(() => import('./pages/restaurant/MenuManager'));
const RestaurantProfile = lazy(() => import('./pages/restaurant/Profile'));
const RestaurantTransactions = lazy(() => import('./pages/restaurant/Transactions'));
const DeliveryLogin = lazy(() => import('./pages/delivery/Login'));
const DeliveryDashboard = lazy(() => import('./pages/delivery/Dashboard'));
const CustomerOnboarding = lazy(() => import('./pages/onboarding/CustomerOnboarding'));
const RestaurantOnboarding = lazy(() => import('./pages/onboarding/RestaurantOnboarding'));
const DeliveryOnboarding = lazy(() => import('./pages/onboarding/DeliveryOnboarding'));
const StatusScreen = lazy(() => import('./pages/onboarding/Status'));
const Restaurants = lazy(() => import('./pages/customer/Restaurants'));
const Cuisines = lazy(() => import('./pages/customer/Cuisines'));
const Offers = lazy(() => import('./pages/customer/Offers'));
const Search = lazy(() => import('./pages/customer/Search'));
const Checkout = lazy(() => import('./pages/customer/Checkout'));
const Orders = lazy(() => import('./pages/customer/Orders'));
const OrderDetails = lazy(() => import('./pages/customer/OrderDetails'));
const CustomerProfile = lazy(() => import('./pages/customer/Profile'));
const DeliveryDashboardLayout = lazy(() => import('./pages/delivery/DashboardLayout'));
const DeliveryProfile = lazy(() => import('./pages/delivery/Profile'));
const DeliveryEarnings = lazy(() => import('./pages/delivery/Earnings'));
const RestaurantAnalytics = lazy(() => import('./pages/restaurant/Analytics'));
const RestaurantReviews = lazy(() => import('./pages/restaurant/Reviews'));
const RestaurantCoupons = lazy(() => import('./pages/restaurant/Coupons'));

function RouteLoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-brand-light"
      role="status"
      aria-label="Loading page"
    >
      <div className="w-10 h-10 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuthStore();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Navigate to="/customer/home" replace />} />
      <Route path="/landing" element={<Landing />} />

      {/* Auth Routes — redirect to dashboard if already logged in */}
      <Route
        path="/customer/login"
        element={user ? <Navigate to="/customer/home" replace /> : <CustomerLogin />}
      />
      <Route
        path="/customer/register"
        element={user ? <Navigate to="/customer/home" replace /> : <CustomerRegister />}
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
      <Route path="/customer/home" element={<CustomerHome />} />
      <Route path="/food-delivery-in-sakoli" element={<SakoliLanding />} />
      <Route path="/restaurant/:seoSlug" element={<RestaurantDetails />} />
      <Route path="/contact" element={<Contact />} />
      <Route
        path="/customer/search"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Search />
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
        path="/customer/cuisines"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Cuisines />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/offers"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Offers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/about"
        element={<About />}
      />
      <Route
        path="/customer/restaurants/:id"
        element={<RestaurantDetails />}
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
        <Route path="/restaurant/transactions" element={<RestaurantTransactions />} />
        <Route path="/restaurant/analytics" element={<RestaurantAnalytics />} />
        <Route path="/restaurant/reviews" element={<RestaurantReviews />} />
        <Route path="/restaurant/coupons" element={<RestaurantCoupons />} />
      </Route>

      {/* Delivery Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['delivery_partner']}>
            <DeliveryDashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
        <Route path="/delivery/profile" element={<DeliveryProfile />} />
        <Route path="/delivery/earnings" element={<DeliveryEarnings />} />
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

import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const { initAuth } = useAuthStore();

  // On every mount: validate stored session with backend
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id'}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Suspense fallback={<RouteLoadingFallback />}>
            <AppRoutes />
          </Suspense>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
