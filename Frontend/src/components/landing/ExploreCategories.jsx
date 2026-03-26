import React from 'react';
import { useNavigate } from 'react-router-dom';

const ExploreCategories = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName) => {
    // Navigate to all products page with category filter
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  const categories = [
    {
      id: 1,
      name: "Electronics & Appliances",
      emoji: "📱",
      description: "Phones, Laptops, Gadgets",
      bgColor: "from-blue-400 to-blue-600",
      hoverColor: "hover:from-blue-500 hover:to-blue-700"
    },
    {
      id: 2,
      name: "Furniture",
      emoji: "🪑",
      description: "Chairs, Tables, Decor",
      bgColor: "from-amber-400 to-amber-600",
      hoverColor: "hover:from-amber-500 hover:to-amber-700"
    },
    {
      id: 3,
      name: "Books, Sports & Hobbies",
      emoji: "⚽",
      description: "Sports Equipment, Books",
      bgColor: "from-green-400 to-green-600",
      hoverColor: "hover:from-green-500 hover:to-green-700"
    },
    {
      id: 4,
      name: "Fashion",
      emoji: "👕",
      description: "Clothing, Accessories",
      bgColor: "from-pink-400 to-pink-600",
      hoverColor: "hover:from-pink-500 hover:to-pink-700"
    },
    {
      id: 5,
      name: "Bikes",
      emoji: "🚲",
      description: "Bicycles, Motorcycles",
      bgColor: "from-[#782355] to-purple-600",
      hoverColor: "hover:from-[#8e2a63] hover:to-purple-700"
    }
  ];

  return (
    <section id="explore-categories" className="py-16 bg-gray-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Explore Categories
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing products across different categories
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category.name)}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.bgColor} ${category.hoverColor} 
                         p-6 md:p-8 text-center cursor-pointer transform transition-all duration-300 
                         hover:scale-105 hover:shadow-2xl hover:-translate-y-2`}
            >
              {/* 3D Effect Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Emoji with 3D effect */}
                <div className="text-4xl md:text-5xl lg:text-6xl mb-3 md:mb-4 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  {category.emoji}
                </div>
                
                {/* Category Name */}
                <h3 className="text-white font-bold text-sm md:text-base lg:text-lg mb-1 md:mb-2">
                  {category.name}
                </h3>
                
                {/* Description */}
                <p className="text-white/90 text-xs md:text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                  {category.description}
                </p>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>

              {/* Bottom Gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/30 to-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </div>
          ))}
        </div>

        {/* View All Categories Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/products')}
            className="bg-[#782355] text-white px-8 py-3 rounded-2xl font-semibold hover:bg-[#8e2a63] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            View All Products
          </button>
        </div>
      
      </div>
    </section>
  );
};

export default ExploreCategories;
