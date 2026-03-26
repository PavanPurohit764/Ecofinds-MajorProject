import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  XCircleIcon,
  ShoppingBagIcon,
  CalendarIcon,
  TruckIcon,
  UserIcon,
  PhoneIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';

const OrdersPlaced = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  // Fetch orders when component mounts or tab changes
  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await orderService.getBuyerOrderHistory(1, 20, activeTab === 'all' ? '' : activeTab);

      if (response.success) {
        setOrders(response.data.orders || []);
      } else {
        setError(response.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await orderService.cancelOrder(orderId, 'User requested cancellation');

      if (response.success) {
        fetchOrders();
      } else {
        alert('Failed to cancel order: ' + response.message);
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Failed to cancel order: ' + (err.message || 'Unknown error'));
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const tabs = [
    { id: 'all', label: 'All', count: orders.length },
    { id: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { id: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
    { id: 'processing', label: 'Processing', count: orders.filter(o => o.status === 'processing').length },
    { id: 'shipped', label: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
    { id: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'completed').length },
    { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length }
  ];

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { color: 'text-amber-600 bg-amber-50 border-amber-200', icon: '⏳', bg: 'bg-amber-500' };
      case 'confirmed': return { color: 'text-blue-600 bg-blue-50 border-blue-200', icon: '✅', bg: 'bg-blue-500' };
      case 'processing': return { color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: '⚙️', bg: 'bg-indigo-500' };
      case 'shipped': return { color: 'text-purple-600 bg-purple-50 border-purple-200', icon: '🚚', bg: 'bg-purple-500' };
      case 'completed': return { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: '🎉', bg: 'bg-emerald-500' };
      case 'cancelled': return { color: 'text-rose-600 bg-rose-50 border-rose-200', icon: '❌', bg: 'bg-rose-500' };
      default: return { color: 'text-slate-600 bg-slate-50 border-slate-200', icon: '📦', bg: 'bg-slate-500' };
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#fdfaf7] min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">My Purchases</h1>
            <p className="text-slate-500 text-lg">Manage your orders and stay connected with suppliers</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
            <ShoppingBagIcon className="h-4 w-4" />
            <span>Total Orders: {orders.length}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-10 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex space-x-2 p-1 bg-slate-100 rounded-2xl inline-flex min-w-full md:min-w-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === tab.id
                  ? 'bg-white text-[#782355] shadow-lg scale-[1.02] ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-[#782355] text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-16 h-16">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-100 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-[#782355] border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-slate-600 font-medium animate-pulse">Refining your order history...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-slate-100 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h3>
            <p className="text-slate-500 mb-8">{error}</p>
            <button
              onClick={fetchOrders}
              className="w-full bg-[#782355] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#8e2a63] transition-all duration-300 shadow-lg shadow-[#782355]/20 active:scale-95"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8">
              <ShoppingBagIcon className="w-16 h-16 text-slate-200" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-4">No orders to show</h3>
            <p className="text-slate-500 text-lg mb-10 max-w-md">It looks like you haven't placed any orders in this category yet. Time to find something amazing!</p>
            <button
              onClick={() => navigate('/listings')}
              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {orders.map((order) => {
              const status = getStatusConfig(order.status);
              return (
                <div
                  key={order._id}
                  className="group bg-white rounded-[2.5rem] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] transition-all duration-500"
                >
                  <div className="p-1 md:p-2">
                    <div className="p-6 md:p-10 flex flex-col xl:flex-row gap-10">

                      {/* Left Side: Basic Info & Badge */}
                      <div className="xl:w-1/3 flex flex-col justify-between border-b xl:border-b-0 xl:border-r border-slate-50 pb-8 xl:pb-0 xl:pr-10">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${status.color}`}>
                              {status.icon} {order.status}
                            </span>
                            <span className="text-slate-300 text-xs font-mono">#{order._id.slice(-6).toUpperCase()}</span>
                          </div>
                          <h3 className="text-3xl font-black text-slate-900 mb-4 group-hover:text-[#782355] transition-colors duration-300 capitalize leading-tight">
                            {order.itemName || 'Sustainable Item'}
                          </h3>
                        </div>

                        <div className="mt-6 flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-br from-[#782355] to-purple-800 rounded-2xl text-white shadow-lg shadow-[#782355]/20">
                            <TruckIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Expected Delivery</p>
                            <p className="text-slate-900 font-bold">
                              {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Grid Details */}
                      <div className="xl:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-4">
                        <div className="flex items-start gap-4">
                          <div className="mt-1 p-2 bg-slate-50 rounded-xl text-slate-400">
                            <ShoppingBagIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Quantity</p>
                            <p className="text-slate-900 font-bold text-lg">{order.quantity} <span className="text-slate-400 text-sm font-normal">{order.unit || 'units'}</span></p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="mt-1 p-2 bg-slate-50 rounded-xl text-slate-400">
                            <UserIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Seller</p>
                            <p className="text-slate-900 font-bold text-lg truncate max-w-[150px]">
                              {order.sellerId?.name || order.sellerId?.username || 'Eco Partner'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="mt-1 p-2 bg-slate-50 rounded-xl text-slate-400">
                            <PhoneIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Contact</p>
                            <p className="text-slate-900 font-bold">{order.sellerId?.phone || 'Encrypted'}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="mt-1 p-2 bg-slate-50 rounded-xl text-slate-400">
                            <CalendarIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Order Date</p>
                            <p className="text-slate-900 font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Total & Actions */}
                      <div className="xl:w-1/4 flex flex-col justify-end gap-6 bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1">Total investment</p>
                          <p className="text-4xl font-extrabold text-[#782355]">₹{order.totalPrice}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                          {order.status !== 'cancelled' && (
                            <button
                              onClick={() => navigate(`/chat?userId=${order.sellerId?._id || order.sellerId}`)}
                              className="w-full flex items-center justify-center gap-2 bg-white text-[#782355] border-2 border-[#782355]/10 py-4 rounded-2xl font-bold hover:bg-[#782355] hover:text-white transition-all duration-300 shadow-sm active:scale-95 group/btn"
                            >
                              <ChatBubbleLeftRightIcon className="h-5 w-5" />
                              Chat with Seller
                            </button>
                          )}

                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              className="w-full flex items-center justify-center gap-2 text-rose-500 bg-rose-50 py-4 rounded-2xl font-bold hover:bg-rose-500 hover:text-white transition-all duration-300 active:scale-95"
                            >
                              <XCircleIcon className="h-5 w-5" />
                              Cancel Order
                            </button>
                          )}

                          <button
                            onClick={() => handleViewDetails(order)}
                            className="w-full flex items-center justify-center gap-2 text-slate-400 py-2 text-sm font-semibold hover:text-slate-900 transition-colors"
                          >
                            Order Details <ChevronRightIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Footer Progress Bar (Optional context) */}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <div className="px-10 py-8 bg-[#fcfcfc] border-t border-slate-50 flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                            <span>Journey Status</span>
                            <span className="text-[#782355]">{order.status}</span>
                          </div>
                          <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${status.bg}`}
                              style={{
                                width: order.status === 'pending' ? '20%' :
                                  order.status === 'confirmed' ? '40%' :
                                    order.status === 'processing' ? '65%' :
                                      order.status === 'shipped' ? '85%' : '100%'
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          {/* Could add mini-steps here if needed */}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Details Modal Container */}
      <OrderModal
        order={selectedOrder}
        isOpen={showModal}
        onClose={closeModal}
      />
    </div>
  );
};

// --- Modal Component ---
const OrderModal = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusColors = {
    pending: 'text-amber-600 bg-amber-50',
    confirmed: 'text-blue-600 bg-blue-50',
    processing: 'text-indigo-600 bg-indigo-50',
    shipped: 'text-purple-600 bg-purple-50',
    completed: 'text-emerald-600 bg-emerald-50',
    cancelled: 'text-rose-600 bg-rose-50',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 md:p-10">
          {/* Modal Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[order.status.toLowerCase()] || 'bg-slate-100 text-slate-600'}`}>
                  {order.status}
                </span>
                <span className="text-slate-300 text-xs font-mono">#{order._id.toUpperCase()}</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 capitalize italic tracking-tight underline decoration-[#782355] decoration-4 underline-offset-8">
                {order.itemName || 'Order Details'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-slate-900"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-6">
              <DetailItem label="Seller" value={order.sellerId?.name || order.sellerId?.username || 'Eco Partner'} />
              <DetailItem label="Quantity" value={`${order.quantity} ${order.unit || 'units'}`} />
              <DetailItem label="Total Investment" value={`₹${order.totalPrice}`} highlight />
            </div>
            <div className="space-y-6">
              <DetailItem label="Order Placed" value={formatDate(order.createdAt)} />
              <DetailItem label="Expected Delivery" value={order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : 'Flexible'} />
              <DetailItem label="Contact Seller" value={order.sellerId?.phone || order.sellerId?.email || 'Encrypted'} />
            </div>
          </div>

          {order.specialInstructions && (
            <div className="bg-slate-50 rounded-2xl p-6 mb-10 border border-slate-100">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Special Instructions</p>
              <p className="text-slate-600 text-sm leading-relaxed">{order.specialInstructions}</p>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-center pt-2">
            <button
              onClick={onClose}
              className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, highlight }) => (
  <div>
    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{label}</p>
    <p className={`font-bold ${highlight ? 'text-2xl text-[#782355]' : 'text-slate-900'}`}>{value}</p>
  </div>
);

export default OrdersPlaced;
