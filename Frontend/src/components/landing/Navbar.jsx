import React, { useState, useEffect, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../hooks/useCart';
import { searchItems, getSearchSuggestions } from '../../services/searchService';
import NotificationDropdown from '../notifications/NotificationDropdown';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { getCartItemsCount } = useCart();


  const navigate = useNavigate();
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      // The AuthContext will handle clearing tokens and state
      // No need to reload - React will re-render with updated auth state
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Handle search input changes and get suggestions
  const handleSearchInputChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length >= 2) {
      try {
        const response = await getSearchSuggestions(value.trim());
        if (response.success) {
          setSuggestions(response.data.suggestions);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search submission
  const handleSearch = async (query = searchQuery) => {
    if (!query || query.trim().length === 0) return;

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      const response = await searchItems(query.trim());
      if (response.success) {
        const results = response.data.results;
        setSearchResults(results);

        // Log results to console as requested
        console.log('Search Results:', {
          query: query,
          totalResults: results.length,
          productCount: response.data.productCount,
          supplierListingCount: response.data.supplierListingCount,
          results: results
        });

        // Navigate to search results page
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button
                onClick={() => navigate('/')}
                className="text-2xl font-bold text-[#782355] hover:text-[#8b2e5f] transition-colors duration-200 cursor-pointer"
              >
                EcoFinds
              </button>
            </div>
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full" ref={searchRef}>
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search for products..."
                  className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:border-[#782355] focus:ring-1 focus:ring-[#782355]"
                  disabled={isSearching}
                />
                <button
                  type="submit"
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 hover:text-[#782355] transition-colors"
                  disabled={isSearching}
                >
                  <MagnifyingGlassIcon className={`h-5 w-5 ${isSearching ? 'animate-pulse' : ''}`} />
                </button>
              </form>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className=" hidden md:flex items-center space-x-6">
            <button
              onClick={() => navigate('/environment')}
              className="!cursor-pointer flex items-center text-green-700 hover:text-green-900 transition-colors duration-200 font-medium"
            >
              <span className="mr-1">🌱</span>
              <span>Eco Impact</span>
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="!cursor-pointer flex items-center text-gray-700 hover:text-[#782355] transition-colors duration-200 relative"
            >
              <ShoppingCartIcon className="h-6 w-6 mr-1" />
              <span>Cart</span>
              {getCartItemsCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#782355] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemsCount()}
                </span>
              )}
            </button>
            {isAuthenticated && (
              <NotificationDropdown />
            )}
            {isAuthenticated && (
              <button
                onClick={() => navigate('/chat')}
                className="!cursor-pointer flex items-center text-gray-700 hover:text-[#782355] transition-colors duration-200"
              >
                <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                <span>Chat</span>
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="!cursor-pointer flex items-center text-gray-700 hover:text-[#782355] transition-colors duration-200"
            >
              <UserIcon className="h-6 w-6 mr-1" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/add-item')}
              className=" !cursor-pointer flex items-center text-gray-700 hover:text-[#782355] transition-colors duration-200"
            >
              <PlusIcon className='h-6 w-6 mr-1' />
              <span>Sell</span>
            </button>
            {isAuthenticated != true ?
              (
                <button onClick={() => navigate('/authpage')} className="!cursor-pointer px-4 py-2 text-[#782355] border border-[#782355] rounded-lg hover:bg-[#782355] hover:text-white transition-colors duration-200">
                  Sign In
                </button>
              ) : (
                <button onClick={logout} className="!cursor-pointer px-4 py-2 text-[#782355] border border-[#782355] rounded-lg hover:bg-[#782355] hover:text-white transition-colors duration-200">
                  Logout
                </button>
              )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-[#782355] focus:outline-none"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Search for products..."
                className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:border-[#782355] focus:ring-1 focus:ring-[#782355]"
                disabled={isSearching}
              />
              <button
                type="submit"
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 hover:text-[#782355] transition-colors"
                disabled={isSearching}
              >
                <MagnifyingGlassIcon className={`h-5 w-5 ${isSearching ? 'animate-pulse' : ''}`} />
              </button>
            </form>

            {/* Mobile Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center">
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 mr-2" />
                      {suggestion}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button
              onClick={() => navigate('/environment')}
              className="flex items-center w-full px-3 py-2 text-green-700 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors duration-200 font-medium"
            >
              <span className="mr-3">🌱</span>
              Eco Impact
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="flex items-center w-full px-3 py-2 text-gray-700 hover:text-[#782355] hover:bg-gray-50 rounded-md transition-colors duration-200 relative"
            >
              <ShoppingCartIcon className="h-5 w-5 mr-3" />
              Cart
              {getCartItemsCount() > 0 && (
                <span className="absolute left-8 -top-1 bg-[#782355] text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {getCartItemsCount()}
                </span>
              )}
            </button>
            {isAuthenticated && (
              <div className="flex items-center w-full px-3 py-2 text-gray-700">
                <NotificationDropdown />
                <span className="ml-3 font-medium">Notifications</span>
              </div>
            )}
            {isAuthenticated && (
              <button
                onClick={() => navigate('/chat')}
                className="flex items-center w-full px-3 py-2 text-gray-700 hover:text-[#782355] hover:bg-gray-50 rounded-md transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                Chat
              </button>
            )}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center w-full px-3 py-2 text-gray-700 hover:text-[#782355] hover:bg-gray-50 rounded-md transition-colors duration-200"
            >
              <UserIcon className="h-5 w-5 mr-3" />
              Dashboard
            </button>
            <button
              onClick={() => navigate('/add-item')}
              className="flex items-center w-full px-3 py-2 text-gray-700 hover:text-[#782355] hover:bg-gray-50 rounded-md transition-colors duration-200"
            >
              <PlusIcon className='h-6 w-6 mr-1' />
              <span>Sell</span>
            </button>
            <div className="space-y-2 pt-2">
              {isAuthenticated != true ?
                (
                  <button onClick={() => navigate('/authpage')} className="px-4 py-2 text-[#782355] border border-[#782355] rounded-lg hover:bg-[#782355] hover:text-white transition-colors duration-200">
                    Sign In
                  </button>) :
                (
                  <button onClick={handleLogout} className="px-4 py-2 text-[#782355] border border-[#782355] rounded-lg hover:bg-[#782355] hover:text-white transition-colors duration-200">
                    Logout
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
