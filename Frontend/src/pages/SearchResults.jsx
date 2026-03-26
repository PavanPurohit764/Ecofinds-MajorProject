import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchItems } from '../services/searchService';
import {
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  HeartIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [allResults, setAllResults] = useState([]); // Store all fetched results
  const [filteredResults, setFilteredResults] = useState([]); // Store filtered results
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInfo, setSearchInfo] = useState({});
  const [sortBy, setSortBy] = useState('featured');
  const [favorites, setFavorites] = useState(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Mobile filter toggle
  
  // Filter states
  const [filters, setFilters] = useState({
    condition: 'all',
    minPrice: '',
    maxPrice: '',
    location: ''
  });

  const query = searchParams.get('q');

  useEffect(() => {
    if (query) {
      performInitialSearch(query);
    } else {
      navigate('/');
    }
  }, [query, navigate]);

  // Apply filters whenever filter state changes
  useEffect(() => {
    applyFilters();
  }, [filters, allResults, sortBy]);

  const performInitialSearch = async (searchQuery) => {
    setLoading(true);
    setError(null);

    try {
      // Only search backend once with the query, no filters
      const response = await searchItems(searchQuery);
      if (response.success) {
        const results = response.data.results;
        setAllResults(results);
        setSearchInfo({
          totalCount: response.data.totalCount,
          productCount: response.data.productCount,
          supplierListingCount: response.data.supplierListingCount,
          query: response.data.query
        });
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering function
  const applyFilters = () => {
    let filtered = [...allResults];

    // Apply condition filter
    if (filters.condition !== 'all') {
      filtered = filtered.filter(item => {
        const itemCondition = item.condition?.toLowerCase();
        const filterCondition = filters.condition.toLowerCase();
        return itemCondition === filterCondition;
      });
    }

    // Apply price range filter
    if (filters.minPrice || filters.maxPrice) {
      filtered = filtered.filter(item => {
        const price = item.price || item.pricePerUnit || 0;
        const min = filters.minPrice ? parseInt(filters.minPrice) : 0;
        const max = filters.maxPrice ? parseInt(filters.maxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(item => {
        const itemLocation = typeof item.location === 'string' 
          ? item.location.toLowerCase() 
          : item.location?.address?.toLowerCase() || '';
        return itemLocation.includes(filters.location.toLowerCase());
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => (a.price || a.pricePerUnit || 0) - (b.price || b.pricePerUnit || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => (b.price || b.pricePerUnit || 0) - (a.price || a.pricePerUnit || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        // Keep default order for 'featured'
        break;
    }

    setFilteredResults(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      condition: 'all',
      minPrice: '',
      maxPrice: '',
      location: ''
    });
  };

  const toggleFavorite = (itemId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'like new': return 'bg-blue-100 text-blue-800';
      case 'good': return 'bg-yellow-100 text-yellow-800';
      case 'fair': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9d174d] mx-auto mb-4"></div>
          <p className="text-gray-600">Searching...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-[#9d174d] text-white rounded-lg hover:bg-[#7f1d1d] transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-4"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Back to Home
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Search Results
              </h1>
              <p className="text-gray-600">
                {searchInfo.totalCount} products found for "{searchInfo.query}"
                {filteredResults.length !== allResults.length && (
                  <span className="text-[#9d174d] font-medium">
                    {" "}({filteredResults.length} after filters)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                className="lg:hidden flex items-center text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md text-sm font-medium"
                onClick={() => setIsFilterOpen(true)}
              >
                <FunnelIcon className="h-4 w-4 mr-1.5" />
                Filters
                {(filters.condition !== 'all' || filters.minPrice || filters.maxPrice || filters.location) && (
                  <span className="ml-1.5 bg-[#9d174d] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
              <span className="hidden sm:inline text-sm text-gray-600">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9d174d] focus:border-transparent"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
            <div className="text-sm text-gray-500 hidden sm:block">
              Showing {filteredResults.length} of {searchInfo.totalCount} products
            </div>
          </div>
        </div>
      </div>

      {/* Results Section with Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Mobile Drawer & Desktop Sidebar */}
          
          {/* Mobile backdrop */}
          {isFilterOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsFilterOpen(false)}
            />
          )}

          <div
            className={`fixed inset-y-0 left-0 bg-white z-50 w-[80%] max-w-sm transform transition-transform duration-300 ease-in-out lg:static lg:transform-none lg:w-64 lg:flex-shrink-0 overflow-y-auto ${
              isFilterOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="bg-white rounded-none lg:rounded-lg shadow-none lg:shadow-sm border-0 lg:border border-gray-200 p-6 min-h-screen lg:min-h-0">
              {/* Filters Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FunnelIcon className="w-5 h-5 mr-2" />
                  Filters
                  {(filters.condition !== 'all' || filters.minPrice || filters.maxPrice || filters.location) && (
                    <span className="ml-2 px-2 py-1 text-xs bg-[#9d174d] text-white rounded-full">
                      Applied
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-[#9d174d] hover:text-[#7f1d1d] font-medium disabled:opacity-50"
                    disabled={filters.condition === 'all' && !filters.minPrice && !filters.maxPrice && !filters.location}
                  >
                    Clear All
                  </button>
                  <button
                    className="lg:hidden p-1 text-gray-400 hover:text-gray-500"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Condition Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Condition</h4>
                <div className="space-y-2">
                  {['all', 'new', 'like new', 'good', 'fair', 'used'].map((condition) => (
                    <label key={condition} className="flex items-center">
                      <input
                        type="radio"
                        name="condition"
                        value={condition}
                        checked={filters.condition === condition}
                        onChange={(e) => handleFilterChange('condition', e.target.value)}
                        className="w-4 h-4 text-[#9d174d] border-gray-300 focus:ring-[#9d174d]"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {condition === 'all' ? 'All' : condition}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#9d174d] focus:border-transparent"
                    />
                    <span className="text-gray-500 text-sm">to</span>
                    <input
                      type="number"
                      placeholder="200000"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#9d174d] focus:border-transparent"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    ₹{filters.minPrice || '0'} - ₹{filters.maxPrice || '2,00,000'}
                  </div>
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Location</h4>
                <input
                  type="text"
                  placeholder="Enter city or area"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#9d174d] focus:border-transparent"
                />
              </div>

              {/* Filter Results Summary */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <span>Total found:</span>
                    <span className="font-medium">{allResults.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Showing:</span>
                    <span className="font-medium text-[#9d174d]">{filteredResults.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Content */}
          <div className="flex-1">
            {filteredResults.length === 0 ? (
              <div className="text-center py-16">
                <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {allResults.length === 0 ? 'No results found' : 'No results match your filters'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {allResults.length === 0 
                    ? 'Try searching with different keywords' 
                    : 'Try adjusting your filters or clear all filters to see more results'
                  }
                </p>
                {allResults.length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-[#9d174d] text-white rounded-lg hover:bg-[#7f1d1d] transition-colors duration-200"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {filteredResults.map((item, index) => {
                  const itemId = item._id || `${item.source}-${index}`;
                  const isFavorite = favorites.has(itemId);
                  const price = item.price || item.pricePerUnit;
                  const title = item.productTitle || item.itemName;
                  const description = item.productDescription || item.description;
                  const category = item.productCategory || item.category;
                  const imageUrl = item.imageUrls?.[0] || item.imageDetails?.[0]?.url;
                  
                  return (
                    <div key={itemId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 group">
                      {/* Image Container */}
                      <div className="relative h-48 bg-gray-100">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Favorite Button */}
                        <button 
                          onClick={() => toggleFavorite(itemId)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors duration-200"
                        >
                          {isFavorite ? (
                            <HeartSolidIcon className="h-5 w-5 text-red-500" />
                          ) : (
                            <HeartIcon className="h-5 w-5 text-gray-600" />
                          )}
                        </button>

                        {/* Condition Badge */}
                        {item.condition && (
                          <div className="absolute top-3 left-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(item.condition)}`}>
                              {item.condition}
                            </span>
                          </div>
                        )}

                        {/* Type Badge */}
                        <div className="absolute bottom-3 left-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.source === 'product' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {/* Category */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">
                            {category}
                          </span>
                          {item.location && (
                            <span className="text-xs text-gray-400">
                              {typeof item.location === 'string' ? item.location : item.location.address}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-5">
                          {title}
                        </h3>

                        {/* Description */}
                        {description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {description}
                          </p>
                        )}

                        {/* Price and Unit */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <span className="text-xl font-bold text-gray-900">
                              {formatPrice(price)}
                            </span>
                            {item.unit && (
                              <span className="text-sm text-gray-500 ml-1">
                                /{item.unit}
                              </span>
                            )}
                          </div>
                          {item.quantityAvailable && (
                            <span className="text-xs text-gray-500">
                              {item.quantityAvailable} available
                            </span>
                          )}
                        </div>

                        {/* View Details Button */}
                        <button onClick={() => navigate(`/product/${item._id}`)} className="text-sm sm:text-base w-full bg-[#9d174d] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#7f1d1d] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#9d174d] focus:ring-offset-2">
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
