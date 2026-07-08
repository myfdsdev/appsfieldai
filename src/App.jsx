import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Marketplace from '@/pages/Marketplace';
import SaaSDetail from '@/pages/SaaSDetail';
import LiveAuctions from '@/pages/LiveAuctions';
import MyRequests from '@/pages/MyRequests';
import SellMySaaS from '@/pages/SellMySaaS';
import AdminPanel from '@/pages/AdminPanel';
import AdminSettings from '@/pages/AdminSettings';
import AdminReservations from '@/pages/AdminReservations';
import AdminAcquisitions from '@/pages/AdminAcquisitions';
import AdminRoute from '@/components/AdminRoute';
import NotificationsPage from '@/pages/NotificationsPage';
import BestSellers from '@/pages/BestSellers';
import Categories from '@/pages/Categories';
import LifetimeDeals from '@/pages/LifetimeDeals';
import AiChatPage from '@/pages/AiChat';
import MyInvestments from '@/pages/MyInvestments';
import Pricing from '@/pages/Pricing';
import MarketplaceDashboard from '@/pages/MarketplaceDashboard';
import VendorRegister from '@/pages/VendorRegister';
import VendorDashboard from '@/pages/VendorDashboard';
import AdminHub from '@/pages/AdminHub';
import CustomerDashboard from '@/pages/CustomerDashboard';
import StorePage from '@/pages/StorePage';
import StoreCustomPage from '@/pages/StoreCustomPage';
import StoreDashboard from '@/pages/StoreDashboard';
import StoreAffiliatePage from '@/pages/StoreAffiliatePage';
import { getStoreKeyFromHost, getCustomDomainFromHost } from '@/lib/storeHost';
import { PageLoader } from '@/components/Loader';
import Home from '@/pages/Home';
// Add page imports here

// When the app is served from a customer store subdomain (wildcard DNS),
// the whole app becomes that public store — no login, no app chrome.
const StoreSubdomainApp = () => (
  <Routes>
    <Route path="/saas/:id" element={<StorePage />} />
    <Route path="/page/:pageSlug" element={<StoreCustomPage />} />
    <Route path="/affiliates" element={<StoreAffiliatePage />} />
    <Route path="/dashboard" element={<StoreDashboard />} />
    <Route path="*" element={<StorePage />} />
  </Routes>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Store subdomain OR a customer's own custom domain → render the public store directly,
  // skip auth gating entirely.
  if (getStoreKeyFromHost() || getCustomDomainFromHost()) {
    return <StoreSubdomainApp />;
  }

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
      {/* Global landing page — public, no app chrome */}
      <Route path="/global" element={<Home />} />
      {/* Public store pages — accessible without login, no app chrome */}
      <Route path="/store/:slug" element={<StorePage />} />
      <Route path="/store/:slug/saas/:id" element={<StorePage />} />
      <Route path="/store/:slug/dashboard" element={<StoreDashboard />} />
      <Route path="/store/:slug/affiliates" element={<StoreAffiliatePage />} />
      <Route path="/store/:slug/page/:pageSlug" element={<StoreCustomPage />} />
      {/* Public routes — accessible without login */}
      <Route element={<DashboardLayout />}>
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/saas/:id" element={<SaaSDetail />} />
        <Route path="/auctions" element={<LiveAuctions />} />
        <Route path="/best-sellers" element={<BestSellers />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/lifetime-deals" element={<LifetimeDeals />} />
      </Route>

      {/* Protected routes — require login */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<MarketplaceDashboard />} />
          <Route path="/dashboard" element={<MarketplaceDashboard />} />
          <Route path="/pricing" element={<Pricing />} />
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
          <Route path="/admin/marketplace/reservations" element={<AdminRoute><AdminReservations /></AdminRoute>} />
          <Route path="/admin/marketplace/acquisition-requests" element={<AdminRoute><AdminAcquisitions /></AdminRoute>} />
        </Route>
      </Route>
      {/* Redirect old /Home routes to prevent 404 */}
      <Route path="/Home" element={<Navigate to="/" replace />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      {/* Redirect old AdminPanel/AdminHub routes to /admin */}
      <Route path="/AdminPanel" element={<Navigate to="/admin" replace />} />
      <Route path="/adminpanel" element={<Navigate to="/admin" replace />} />
      <Route path="/AdminHub" element={<Navigate to="/admin" replace />} />
      <Route path="/adminhub" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <SonnerToaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App