import React, { useState, useEffect, useMemo } from 'react';
import { 
  AdjustmentsHorizontalIcon, 
  FunnelIcon, 
  XMarkIcon,
  ChevronDownIcon,
  ChevronLeftIcon 
} from '@heroicons/react/24/outline';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/landing/ProductCard';
import productService from '../services/productService';
import { useRetry } from '../hooks/useUtils';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';

const AllProductsPage = () => {
  const [searchParams] = useSearchParams();

  
  // Get category from URL params
  const categoryFromUrl = searchParams.get('category');
  
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || 'All');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const { retryCount, canRetry, retry, reset } = useRetry();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Memoize priceRange to prevent infinite loops
  const priceMin = priceRange[0];
  const priceMax = priceRange[1];
  const memoizedPriceRange = useMemo(() => [priceMin, priceMax], [priceMin, priceMax]);

  const categories = [
    'All', 
    'Electronics & Appliances', 
    'Furniture', 
    'Fashion', 
    'Books, Sports & Hobbies', 
    'Bikes',
    'Mobiles',
    'Cars',
    'Properties',
    'Jobs',
    'Commercial Vehicles & Spares',
    'Pets',
    'Services'
  ];
  const conditions = ['All', 'New', 'Used', 'Refurbished'];
  const locations = ['All', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad'];
  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'sold', label: 'Best Selling' }
  ];

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          page: currentPage,
          limit: 12,
          sortBy: sortBy === 'featured' ? 'viewCount' : 
                 sortBy === 'price-low' ? 'price' :
                 sortBy === 'price-high' ? 'price' :
                 sortBy === 'newest' ? 'createdAt' :
                 sortBy === 'popular' ? 'viewCount' :
                 sortBy === 'sold' ? 'soldCount' : 'viewCount',
          sortOrder: sortBy === 'price-high' ? 'desc' : 
                    sortBy === 'newest' ? 'desc' : 
                    sortBy === 'featured' || sortBy === 'popular' || sortBy === 'sold' ? 'desc' : 'asc'
        };

        if (selectedCategory !== 'All') {
          params.productCategory = selectedCategory;
        }

        if (selectedCondition !== 'All') {
          params.condition = selectedCondition;
        }

        if (memoizedPriceRange[0] > 0 || memoizedPriceRange[1] < 200000) {
          params.minPrice = memoizedPriceRange[0];
          params.maxPrice = memoizedPriceRange[1];
        }

        const response = await productService.getAllProducts(params);
        
        // Filter out products where the seller is the current user
        let filteredProducts = response.data.products || [];
        if (user && user._id) {
          filteredProducts = filteredProducts.filter(product => 
            product.userId?._id !== user._id && product.userId !== user._id
          );
        }
        
        if (currentPage === 1) {
          setProducts(filteredProducts);
        } else {
          // Append new products for pagination
          setProducts(prev => [...prev, ...filteredProducts]);
        }
        
        setPagination(response.data.pagination || {});
        reset(); // Reset retry count on successful fetch
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.response?.data?.message || 'Failed to load products');
        if (currentPage === 1) {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, selectedCondition, memoizedPriceRange, sortBy, currentPage, retryCount, reset, user]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedCondition, memoizedPriceRange, sortBy]);

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedCondition('All');
    setPriceRange([0, 200000]);
    setSelectedLocation('All');
    setSortBy('featured');
    setCurrentPage(1);
  };

  const handleViewDetails = (product) => {
    navigate(`/product/${product.id || product._id}`);
  };

  const loadMoreProducts = () => {
    if (pagination.hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#782355]"></div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-gray-50">
        <Navbar />
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Navigation */}
          <div className="mb-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-[#782355] transition-colors duration-200"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-2" />
              <span>Back to Home</span>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">All Products</h1>
              <p className="text-gray-600 mt-1">{products.length} products found</p>
            </div>
            
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center bg-[#782355] text-white px-4 py-2 rounded-lg"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer Overlay */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar — desktop: static column | mobile: slide-in drawer */}
          <aside
            className={`
              fixed top-0 left-0 h-full w-80 bg-white z-50 shadow-2xl overflow-y-auto
              transition-transform duration-300 ease-in-out
              lg:static lg:w-64 lg:shadow-none lg:z-auto lg:translate-x-0 lg:h-auto lg:overflow-visible
              ${showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <div className="p-5">
              {/* Mobile Header */}
              <div className="lg:hidden flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-[#782355]" />
                  Filters
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                  Filters
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#782355] hover:underline"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-6">
                {/* Category Filter */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Category</h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={selectedCategory === category}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setShowFilters(false); // auto-close on mobile
                          }}
                          className="mr-3 text-[#782355] focus:ring-[#782355]"
                        />
                        <span className="text-gray-700 group-hover:text-[#782355] transition-colors text-sm">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Condition Filter */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Condition</h4>
                  <div className="space-y-2">
                    {conditions.map((condition) => (
                      <label key={condition} className="flex items-center cursor-pointer group">
                        <input
                          type="radio"
                          name="condition"
                          value={condition}
                          checked={selectedCondition === condition}
                          onChange={(e) => setSelectedCondition(e.target.value)}
                          className="mr-3 text-[#782355] focus:ring-[#782355]"
                        />
                        <span className="text-gray-700 group-hover:text-[#782355] transition-colors text-sm">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#782355]"
                      />
                      <span className="text-gray-500 text-sm flex-shrink-0">to</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 200000])}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#782355]"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      ₹{priceRange[0].toLocaleString()} – ₹{priceRange[1].toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Location Filter */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Location</h4>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#782355]"
                  >
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobile Action Buttons */}
                <div className="lg:hidden pt-4 space-y-2">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full bg-[#782355] text-white py-3 rounded-lg font-semibold hover:bg-[#8e2a63] transition-colors"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={() => { clearFilters(); setShowFilters(false); }}
                    className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Sort and View Options */}
            <div className="bg-white rounded-xl p-3 sm:p-4 mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm whitespace-nowrap">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#782355]"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-sm text-gray-500">
                  <span>Showing {products.length} of {pagination.total || products.length} products</span>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-5">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={{
                      id: product._id,
                      image: product.imageUrls?.[0] || product.imageUrl,
                      title: product.productTitle,
                      description: product.productDescription,
                      price: product.price,
                      condition: product.condition,
                      location: product.location?.address || 'Location not specified',
                      yearOfManufacture: product.yearOfManufacture,
                      brand: product.brand,
                      category: product.productCategory,
                      seller: product.userId?.name || 'Unknown Seller'
                    }}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-gray-300 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.034 0-3.9.785-5.291 2.09M6.343 6.343A8 8 0 1017.657 17.657 8 8 0 006.343 6.343z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6 text-sm">Try adjusting your filters to see more results</p>
                <button
                  onClick={clearFilters}
                  className="bg-[#782355] text-white px-6 py-2.5 rounded-lg hover:bg-[#8e2a63] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Load More Button */}
            {products.length > 0 && pagination.hasNext && (
              <div className="text-center mt-10">
                <button 
                  onClick={loadMoreProducts}
                  disabled={loading}
                  className="bg-[#782355] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#8e2a63] transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More Products'}
                </button>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4 text-sm">{error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    retry();
                  }}
                  disabled={!canRetry}
                  className="bg-[#782355] text-white px-6 py-2 rounded-lg hover:bg-[#8e2a63] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canRetry ? 'Try Again' : 'Max Retries Reached'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AllProductsPage;
