import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import Marketplace from '@/pages/Marketplace';
import SaaSDetail from '@/pages/SaaSDetail';
import LiveAuctions from '@/pages/LiveAuctions';
import MyRequests from '@/pages/MyRequests';
import SellMySaaS from '@/pages/SellMySaaS';
import AdminPanel from '@/pages/AdminPanel';
import AdminSettings from '@/pages/AdminSettings';
import AdminRoute from '@/components/AdminRoute';
import NotificationsPage from '@/pages/NotificationsPage';
import AiChatPage from '@/pages/AiChat';
import MyInvestments from '@/pages/MyInvestments';
import Pricing from '@/pages/Pricing';
import MarketplaceDashboard from '@/pages/MarketplaceDashboard';
import VendorRegister from '@/pages/VendorRegister';
import VendorDashboard from '@/pages/VendorDashboard';
import AdminHub from '@/pages/AdminHub';
import CustomerDashboard from '@/pages/CustomerDashboard';
import { PageLoader } from '@/components/Loader';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <PageLoader />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login — show loader during redirect
      navigateToLogin();
      return <PageLoader />;
    } else {
      // Unknown error — redirect to login as safe fallback
      navigateToLogin();
      return <PageLoader />;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* Public routes — accessible without login */}
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/saas/:id" element={<SaaSDetail />} />
        <Route path="/auctions" element={<LiveAuctions />} />
      </Route>

      {/* Protected routes — require login */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/dashboard" element={<MarketplaceDashboard />} />
          <Route path="/requests" element={<MyRequests />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/chats" element={<AiChatPage />} />
          <Route path="/sell" element={<SellMySaaS />} />
          <Route path="/vendor/register" element={<VendorRegister />} />
          <Route path="/vendor/dashboard" element={<VendorDashboard />} />
          <Route path="/admin-hub/:marketplaceId" element={<AdminHub />} />
          <Route path="/my-account" element={<CustomerDashboard />} />
          <Route path="/investments" element={<MyInvestments />} />
        </Route>
      </Route>

      {/* Admin routes — require login + admin role */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        </Route>
      </Route>
      {/* Redirect old /Home routes to prevent 404 */}
      <Route path="/Home" element={<Navigate to="/" replace />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App