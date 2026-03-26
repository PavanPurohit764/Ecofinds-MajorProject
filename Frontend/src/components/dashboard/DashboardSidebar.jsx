import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserIcon,
  ClipboardDocumentListIcon,
  ShoppingBagIcon,
  DocumentCheckIcon,
  BellIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

const menuItems = [
  {
    id: 'profile',
    icon: UserIcon,
    label: 'Profile',
    path: '/dashboard/profile',
    color: 'text-blue-600',
  },
  {
    id: 'listings',
    icon: ClipboardDocumentListIcon,
    label: 'Listings',
    path: '/dashboard/listings',
    color: 'text-green-600',
  },
  {
    id: 'orders-received',
    icon: ShoppingBagIcon,
    label: 'Received',
    path: '/dashboard/orders-received',
    color: 'text-orange-600',
  },
  {
    id: 'orders-placed',
    icon: DocumentCheckIcon,
    label: 'Purchases',
    path: '/dashboard/orders-placed',
    color: 'text-purple-600',
  },
  {
    id: 'notifications',
    icon: BellIcon,
    label: 'Alerts',
    path: '/dashboard/notifications',
    color: 'text-red-600',
  },
  {
    id: 'wishlist',
    icon: HeartIcon,
    label: 'Wishlist',
    path: '/dashboard/wishlist',
    color: 'text-pink-600',
  },
];

const DashboardSidebar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ── Desktop sidebar (lg+) ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white shadow-lg min-h-screen">
        <nav className="p-4 flex-1">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-[#782355] text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 ${
                      isActive(item.path) ? 'text-white' : item.color
                    }`}
                  />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* ── Mobile sticky bottom nav (below lg) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <ul className="flex items-stretch justify-around">
          {menuItems.map((item) => (
            <li key={item.id} className="flex-1">
              <button
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center w-full py-2 gap-0.5 transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'text-[#782355]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <item.icon
                  className={`h-5 w-5 ${
                    isActive(item.path) ? 'text-[#782355]' : ''
                  }`}
                />
                <span
                  className={`text-[10px] font-medium leading-tight ${
                    isActive(item.path) ? 'text-[#782355]' : ''
                  }`}
                >
                  {item.label}
                </span>
                {isActive(item.path) && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-[#782355] rounded-t-full" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default DashboardSidebar;
