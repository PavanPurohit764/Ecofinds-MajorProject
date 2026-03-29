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
    <div className="min-h-screen bg-[#fdfafb]">
      {/* Fixed Sticky Header for Search Context */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <button 
                onClick={() => navigate('/')}
                className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#9d174d] hover:text-white transition-all duration-300 shadow-sm border border-gray-100"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">
                  Listing Results
                </h1>
                <p className="text-xs font-medium text-gray-500 mt-0.5 flex items-center">
                  <span className="text-[#9d174d] font-semibold">{filteredResults.length}</span>
                  <span className="mx-1">results found for</span>
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">"{searchInfo.query}"</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                {['featured', 'price-low', 'price-high'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${
                      sortBy === opt ? 'bg-white text-[#9d174d] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {opt.replace('-', ' ')}
                  </button>
                ))}
                <div className="relative group ml-1">
                  <select 
                    value={sortBy === 'newest' ? 'newest' : ''}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-transparent pl-2 pr-6 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled hidden>More</option>
                    <option value="newest">Newest</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Mobile Sort Select */}
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sm:hidden bg-gray-50 border-gray-100 rounded-lg text-xs font-bold uppercase p-2 focus:ring-1 focus:ring-[#9d174d]"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Low Price</option>
                <option value="price-high">High Price</option>
                <option value="newest">Newest</option>
              </select>

              <button
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 text-gray-600 border border-gray-100 relative"
                onClick={() => setIsFilterOpen(true)}
              >
                <FunnelIcon className="h-5 w-5" />
                {(filters.condition !== 'all' || filters.minPrice || filters.maxPrice || filters.location) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#9d174d] rounded-full ring-2 ring-white"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          {/* Enhanced Filter Sidebar */}
          <aside className={`
            fixed lg:static inset-0 z-40 lg:z-auto 
            ${isFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'}
            transition-all duration-300
          `}>
            {/* Mobile Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setIsFilterOpen(false)}
            />
            
            <div className={`
              absolute left-0 top-0 h-full w-[300px] bg-white lg:bg-transparent shadow-2xl lg:shadow-none 
              transform transition-transform duration-300 ease-out lg:transform-none lg:w-72
              ${isFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              flex flex-col lg:block
            `}>
              <div className="p-6 lg:p-0 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8 lg:mb-6 px-1">
                  <h3 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                    <FunnelIcon className="h-5 w-5 text-[#9d174d]" />
                    Filter By
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearAllFilters}
                      className="text-[10px] font-black uppercase tracking-[0.1em] text-[#9d174d] hover:text-[#7f1d1d] disabled:opacity-30 p-1"
                      disabled={filters.condition === 'all' && !filters.minPrice && !filters.maxPrice && !filters.location}
                    >
                      Clear
                    </button>
                    <button className="lg:hidden p-1 text-gray-400" onClick={() => setIsFilterOpen(false)}>
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="bg-white/40 lg:bg-white lg:rounded-3xl lg:border lg:border-gray-100 lg:shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                  <div className="p-6 space-y-9">
                    {/* Condition Section */}
                    <section>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400 mb-5">Condition</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {['all', 'new', 'like new', 'good', 'fair', 'used'].map((condition) => (
                          <button
                            key={condition}
                            onClick={() => handleFilterChange('condition', condition)}
                            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all duration-200 capitalize ${
                              filters.condition === condition 
                                ? 'bg-[#9d174d] text-white border-[#9d174d] shadow-md shadow-[#9d174d]/20' 
                                : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300'
                            }`}
                          >
                            {condition}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Price Range Section */}
                    <section>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400 mb-5">Budget</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs text-bold">₹</span>
                            <input
                              type="number"
                              placeholder="Min"
                              value={filters.minPrice}
                              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                              className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:ring-2 focus:ring-[#9d174d]/10 transition-all"
                            />
                          </div>
                          <div className="w-2 h-0.5 bg-gray-200 rounded-full"></div>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs text-bold">₹</span>
                            <input
                              type="number"
                              placeholder="Max"
                              value={filters.maxPrice}
                              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                              className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:ring-2 focus:ring-[#9d174d]/10 transition-all"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between px-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            Range: ₹{filters.minPrice || '0'} - ₹{filters.maxPrice || '∞'}
                          </span>
                        </div>
                      </div>
                    </section>

                    {/* Location Section */}
                    <section>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400 mb-5">Location</h4>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search area..."
                          value={filters.location}
                          onChange={(e) => handleFilterChange('location', e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:ring-2 focus:ring-[#9d174d]/10 transition-all"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                      </div>
                    </section>
                  </div>
                  
                  <div className="bg-gray-50/50 p-6 border-t border-gray-100 mt-4">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] mb-1">Impact</p>
                    <p className="text-sm font-extrabold text-gray-900">Saving {filteredResults.length} items from landfill</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Results Main Content Area */}
          <main className="flex-1 w-full min-w-0">
            {filteredResults.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-24 px-6 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MagnifyingGlassIcon className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">No results matched</h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">
                  {allResults.length === 0 
                    ? `We couldn't find anything for "${searchInfo.query}". Try a different term?` 
                    : 'Adjust your current filters to find more options.'
                  }
                </p>
                {allResults.length > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center px-6 py-3 bg-[#9d174d] text-white font-bold rounded-2xl hover:bg-[#7f1d1d] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#9d174d]/20"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                {filteredResults.map((item, index) => {
                  const itemId = item._id || `${item.source}-${index}`;
                  const isFavorite = favorites.has(itemId);
                  const price = item.price || item.pricePerUnit;
                  const title = item.productTitle || item.itemName;
                  const description = item.productDescription || item.description;
                  const category = item.productCategory || item.category;
                  const imageUrl = item.imageUrls?.[0] || item.imageDetails?.[0]?.url;
                  
                  return (
                    <div 
                      key={itemId} 
                      className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col h-full ring-1 ring-gray-900/5 shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                    >
                      {/* Premium Image Section */}
                      <div className="relative h-60 overflow-hidden bg-gray-50">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300">
                             <MagnifyingGlassIcon className="w-12 h-12 opacity-50" />
                          </div>
                        )}
                        
                        {/* Glassmorphism Actions Overlay */}
                        <div className="absolute top-4 inset-x-4 flex justify-between items-start">
                          {item.condition && (
                            <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] rounded-lg backdrop-blur-md bg-white/90 shadow-sm border border-gray-100/50 ${
                              item.condition.toLowerCase() === 'new' ? 'text-green-600' : 'text-[#9d174d]'
                            }`}>
                              {item.condition}
                            </span>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(itemId); }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md bg-white/90 shadow-lg border border-gray-100 text-gray-400 hover:scale-110 active:scale-90 transition-all group/pop"
                          >
                            {isFavorite ? (
                              <HeartSolidIcon className="h-5 w-5 text-red-500 animate-pulse" />
                            ) : (
                              <HeartIcon className="h-5 w-5 group-hover/pop:text-red-400 transition-colors" />
                            )}
                          </button>
                        </div>

                        {/* Source Tag */}
                        <div className="absolute bottom-4 left-4">
                          <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md ${
                            item.source === 'product' 
                              ? 'bg-blue-500/10 text-blue-100 border border-blue-400/20' 
                              : 'bg-emerald-500/10 text-emerald-100 border border-emerald-400/20'
                          } backdrop-blur-sm`}>
                            {item.source}
                          </span>
                        </div>
                      </div>

                      {/* Elevated Product Info */}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400">
                            <span className="truncate">{category || 'Eco Finding'}</span>
                            {item.location && (
                              <>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span className="truncate max-w-[120px]">
                                  {typeof item.location === 'string' ? item.location : item.location.address}
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="font-extrabold text-gray-900 group-hover:text-[#9d174d] text-lg leading-tight line-clamp-2 transition-colors min-h-[3rem]">
                            {title}
                          </h3>
                        </div>

                        <div className="mt-auto pt-4 flex flex-col gap-5 border-t border-gray-50">
                           <div className="flex items-end justify-between">
                             <div className="flex flex-col">
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Price</span>
                               <div className="flex items-baseline gap-1">
                                 <span className="text-2xl font-black text-gray-900 tracking-tight">
                                   {formatPrice(price)}
                                 </span>
                                 {item.unit && <span className="text-sm font-bold text-gray-400">/{item.unit}</span>}
                               </div>
                             </div>
                             {item.quantityAvailable && (
                               <div className="text-right">
                                 <span className="block text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-0.5">Stock</span>
                                 <span className="text-[11px] font-extrabold text-[#9d174d] bg-[#9d174d]/5 px-2 py-0.5 rounded-full">{item.quantityAvailable} left</span>
                               </div>
                             )}
                           </div>

                          <button 
                            onClick={() => navigate(`/product/${item._id}`)} 
                            className="group/btn w-full bg-[#9d174d] hover:bg-[#7f1d1d] text-white h-14 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#9d174d]/10 hover:shadow-[#9d174d]/30"
                          >
                            View Experience
                            <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
