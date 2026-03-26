import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import productService from '../../services/productService';

const MyListings = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch user's products
  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getMyProducts();
      setProducts(response.data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productService.deleteProduct(productId);
      setProducts(products.filter(p => p._id !== productId));
      alert('Product deleted successfully');
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  const handleToggleStatus = async (productId) => {
    try {
      await productService.toggleProductStatus(productId);
      await fetchMyProducts(); // Refresh the list
    } catch (err) {
      console.error('Error toggling product status:', err);
      alert('Failed to update product status');
    }
  };

  // Filter products based on active tab
  const filteredProducts = products.filter(product => {
    switch (activeTab) {
      case 'active':
        return product.isActive;
      case 'inactive':
        return !product.isActive;
      case 'sold':
        return product.quantity === 0;
      default:
        return true;
    }
  });

  // Calculate stats
  const stats = [
    { title: 'Total Products', value: products.length, color: 'bg-blue-500', icon: '📦' },
    { title: 'Active Listings', value: products.filter(p => p.isActive).length, color: 'bg-green-500', icon: '✅' },
    { title: 'Total Views', value: products.reduce((total, p) => total + (p.viewCount || 0), 0), color: 'bg-purple-500', icon: '👁️' },
    { title: 'Total Likes', value: products.reduce((total, p) => total + (p.likesCount || 0), 0), color: 'bg-pink-500', icon: '❤️' },
    { title: 'Out of Stock', value: products.filter(p => p.quantity === 0).length, color: 'bg-orange-500', icon: '🏷️' }
  ];

  const tabs = [
    { id: 'all', label: 'All', count: products.length },
    { id: 'active', label: 'Active', count: products.filter(p => p.isActive).length },
    { id: 'inactive', label: 'Inactive', count: products.filter(p => !p.isActive).length },
    { id: 'sold', label: 'Out of Stock', count: products.filter(p => p.quantity === 0).length }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Sold': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Listings</h1>
            <p className="text-gray-600">Manage your product listings and inventory</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              onClick={fetchMyProducts}
              disabled={loading}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => navigate('/add-item')}
              className="flex items-center gap-2 bg-[#782355] text-white px-4 py-2 rounded-lg hover:bg-[#8e2a63] transition-colors duration-200"
            >
              <PlusIcon className="h-4 w-4" />
              Add New Product
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="text-2xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === tab.id
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

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#782355] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your products...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchMyProducts}
              className="bg-[#782355] text-white px-6 py-2 rounded-lg hover:bg-[#8e2a63] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={product.imageUrls?.[0] || product.imageUrl || 'https://images.unsplash.com/photo-1546470810-4a3b65e0b8b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'}
                    alt={product.productTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.isActive ? 'Active' : 'Inactive')}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                      {product.productCategory}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{product.productTitle}</h3>
                    <span className="text-lg font-bold text-[#782355]">₹{product.price.toLocaleString()}</span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.productDescription || 'No description'}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Stock:</span>
                      <span className="font-medium">{product.quantity} units</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Views:</span>
                      <span className="font-medium">{product.viewCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Likes:</span>
                      <span className="font-medium">{product.likesCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Added:</span>
                      <span className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Delivery:</span>
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${product.deliveryAvailable ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {product.deliveryAvailable ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate(`/product/${product._id}`)}
                      className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                    >
                      <EyeIcon className="h-4 w-4" />
                      View Details
                    </button>

                    <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => handleToggleStatus(product._id)}
                        className={`flex items-center justify-center gap-1 py-2 rounded-lg transition-colors duration-200 ${product.isActive
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                      >
                        <XCircleIcon className="h-4 w-4" />
                        <span className="text-xs">{product.isActive ? 'Hide' : 'Show'}</span>
                      </button>

                      <button className="flex items-center justify-center gap-1 bg-[#782355] text-white py-2 rounded-lg hover:bg-[#8e2a63] transition-colors duration-200">
                        <PencilIcon className="h-4 w-4" />
                        <span className="text-xs">Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="flex items-center justify-center gap-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span className="text-xs">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">Start selling by adding your first product</p>
            <button className="bg-[#782355] text-white px-6 py-3 rounded-lg hover:bg-[#8e2a63] transition-colors duration-200">
              Add Your First Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListings;
