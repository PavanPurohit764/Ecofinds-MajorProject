import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import {
  AdminAuthProvider,
  useAdminAuth,
} from "./admin/context/AdminAuthContext";
import AuthPage from "./pages/AuthPage";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import AllProductsPage from "./pages/AllProductsPage";
import LandingPage from "./pages/LandingPage";
import SearchResults from "./pages/SearchResults";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import AddItemPage from "./pages/AddItemPage";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import EnvironmentPage from "./pages/EnvironmentPage";
import AdminLoginPage from "./admin/pages/AdminLoginPage";
import AdminLayout from "./admin/pages/AdminLayout";
import ChatPage from "./pages/ChatPage";

import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ChatProvider } from "./context/ChatContext";
import { WishlistProvider } from "./context/WishlistContext";

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// User Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/authpage" replace />;
};

// Admin Protected Route Component (isolated from user auth)
const AdminProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated, isLoading } = useAdminAuth();
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0f1f0f" }}
      >
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAdminAuthenticated ? (
    children
  ) : (
    <Navigate to="/admin/login" replace />
  );
};

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              Please try again or refresh the page if the problem persists.
            </p>
            <div className="space-x-4">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AdminAuthProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <WishlistProvider>
                <ChatProvider>
                  <CartProvider>
                    <Router>
                      <Toaster
                        position="top-center"
                        toastOptions={{ duration: 3000 }}
                      />
                      <ScrollToTop />
                      <Routes>
                        {/* Public Routes - No authentication required */}
                        <Route path="/authpage" element={<AuthPage />} />
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/products" element={<AllProductsPage />} />
                        <Route
                          path="/product/:id"
                          element={<ProductDetailPage />}
                        />
                        <Route path="/search" element={<SearchResults />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route
                          path="/checkout"
                          element={
                            <ProtectedRoute>
                              <CheckoutPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/environment"
                          element={<EnvironmentPage />}
                        />

                        {/* Protected Routes - Authentication required */}
                        <Route
                          path="/chat"
                          element={
                            <ProtectedRoute>
                              <ChatPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/add-item"
                          element={
                            <ProtectedRoute>
                              <AddItemPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/dashboard/*"
                          element={
                            <ProtectedRoute>
                              <DashboardLayout />
                            </ProtectedRoute>
                          }
                        />

                        {/* Admin Routes - Uses AdminAuthContext, completely separate from user auth */}
                        <Route
                          path="/admin/login"
                          element={<AdminLoginPage />}
                        />
                        <Route
                          path="/admin/*"
                          element={
                            <AdminProtectedRoute>
                              <AdminLayout />
                            </AdminProtectedRoute>
                          }
                        />
                      </Routes>
                    </Router>
                  </CartProvider>
                </ChatProvider>
              </WishlistProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </AdminAuthProvider>
    </ErrorBoundary>
  );
}
export default App;
