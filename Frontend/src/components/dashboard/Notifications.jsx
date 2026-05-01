import React, { useState, useEffect } from "react";
import {
  BellIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { notificationService } from "../../services/notificationService";
import { useNotification } from "../../context/NotificationContext";

const Notifications = () => {
  const {
    markAsRead,
    deleteNotification: apiDeleteNotification,
    deleteAllNotifications,
    unreadCount,
  } = useNotification();
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    unread: 0,
    orders: 0,
    delivery: 0,
    reviews: 0,
    messages: 0,
  });

  // Fetch notifications when component mounts or tab changes
  useEffect(() => {
    fetchNotifications();
    fetchNotificationSummary();
  }, [activeTab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (activeTab === "all") {
        response = await notificationService.getUserNotifications(1, 20);
      } else if (activeTab === "unread") {
        response = await notificationService.getUserNotifications(
          1,
          20,
          "",
          false,
        );
      } else {
        response = await notificationService.getNotificationsByType(activeTab);
      }

      if (response.success) {
        setNotifications(response.data.notifications || []);
      } else {
        setError(response.message || "Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationSummary = async () => {
    try {
      const response = await notificationService.getNotificationSummary();
      if (response.success) {
        setSummary(response.data || summary);
      }
    } catch (err) {
      console.error("Error fetching notification summary:", err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      // Update local state if needed (context usually handles its own, but this component manages its own fetch)
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif,
        ),
      );
      // Refresh summary
      fetchNotificationSummary();
      setMenuOpenId(null);
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationService.markAllNotificationsAsRead();
      if (response.success) {
        // Update all notifications to read
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true })),
        );
        // Refresh summary
        fetchNotificationSummary();
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await apiDeleteNotification(notificationId);
      // Remove from local state
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId),
      );
      // Refresh summary
      fetchNotificationSummary();
      setMenuOpenId(null);
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications?"))
      return;
    try {
      await deleteAllNotifications();
      setNotifications([]);
      setSummary({
        total: 0,
        unread: 0,
        orders: 0,
        delivery: 0,
        reviews: 0,
        messages: 0,
      });
    } catch (err) {
      console.error("Error clearing all notifications:", err);
    }
  };

  const tabs = [
    { id: "all", label: "All", count: summary.total || 0 },
    { id: "unread", label: "Unread", count: summary.unread || 0 },
    { id: "orders", label: "Orders", count: summary.orders || 0 },
    { id: "delivery", label: "Delivery", count: summary.delivery || 0 },
    { id: "reviews", label: "Reviews", count: summary.reviews || 0 },
    { id: "messages", label: "Messages", count: summary.messages || 0 },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50";
      case "medium":
        return "border-l-yellow-500 bg-yellow-50";
      default:
        return "border-l-blue-500 bg-blue-50";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "order":
        return "text-green-600";
      case "review":
        return "text-yellow-600";
      case "message":
        return "text-blue-600";
      case "delivery":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-r from-[#782355] to-purple-600 rounded-full flex items-center justify-center">
              <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Notifications
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Stay updated with your latest activities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchNotifications}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-[#782355] hover:text-[#8e2a63] bg-[#782355]/10 rounded-lg hover:bg-[#782355]/20 font-medium whitespace-nowrap"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto no-scrollbar snap-x">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 snap-start border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-[#782355] text-[#782355]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white rounded-xl border-l-4 p-6 shadow-sm hover:shadow-md transition-all duration-200 ${getPriorityColor(
                notification.priority,
              )} ${!notification.isRead ? "ring-2 ring-blue-100" : ""}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                    <span className="text-xl">{notification.icon}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-[#782355] rounded-full"></div>
                        )}
                        {notification.priority === "high" && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            HIGH
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span
                            className={`w-2 h-2 rounded-full ${getTypeColor(notification.type)} bg-current`}
                          ></span>
                          {notification.type}
                        </span>
                        <span>
                          {notification.timeAgo ||
                            notification.time ||
                            "recently"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(
                            menuOpenId === notification._id
                              ? null
                              : notification._id,
                          );
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1"
                      >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>

                      {menuOpenId === notification._id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteNotification(notification._id)
                            }
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons for specific notification types */}
              {notification.type === "order" &&
                notification.title.includes("New Order") && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm">
                      Accept Order
                    </button>
                    <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 text-sm">
                      View Details
                    </button>
                  </div>
                )}

              {notification.type === "order" &&
                notification.title.includes("Completed") && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="bg-[#782355] text-white px-4 py-2 rounded-lg hover:bg-[#8e2a63] transition-colors duration-200 text-sm">
                      Leave Review
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <BellIcon className="mx-auto h-16 w-16" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No notifications
            </h3>
            <p className="text-gray-600">
              You're all caught up! New notifications will appear here.
            </p>
          </div>
        )}

        {/* Load More */}
        {notifications.length > 0 && (
          <div className="text-center mt-8">
            <button className="bg-[#782355] text-white px-6 py-3 rounded-lg hover:bg-[#8e2a63] transition-colors duration-200">
              Load More Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
