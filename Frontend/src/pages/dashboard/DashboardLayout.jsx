// src/pages/dashboard/DashboardLayout.jsx
import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import Navbar from "../../components/landing/Navbar";
import Footer from "../../components/landing/Footer";
import ProfilePage from "./ProfilePage";
import ListingsPage from "./ListingsPage";
import OrdersReceivedPage from "./OrdersReceivedPage";
import OrdersPlacedPage from "./OrdersPlacedPage";
import NotificationsPage from "./NotificationsPage";
import WishlistPage from "./WishlistPage";

import { useAuth } from "../../context/AuthContext";
import RecommendedForYouSection from "../../components/landing/RecommendationForYou";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login"); // or "/" if you prefer
  };

  // While auth is being initialized
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#782355]" />
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {/* Sidebar gets real user from auth */}
        <DashboardSidebar user={user} onLogout={handleLogout} />

        <div className="flex-1 overflow-auto pb-20 lg:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
            {/* Dashboard routes */}
            <Routes>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="listings" element={<ListingsPage />} />
              <Route path="orders-received" element={<OrdersReceivedPage />} />
              <Route path="orders-placed" element={<OrdersPlacedPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
            </Routes>

            {/* Recommended for you – uses user._id */}
            <RecommendedForYouSection userId={user?._id} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;
