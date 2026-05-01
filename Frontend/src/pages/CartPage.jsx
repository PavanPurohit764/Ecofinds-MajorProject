import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeftIcon,
  TrashIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  TruckIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "../hooks/useCart";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";

const CartPage = () => {
  const navigate = useNavigate();
  const {
    items: cartItems,
    updateQuantity,
    removeFromCart,
    getCartTotal,
  } = useCart();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Handle checkout - navigate to checkout page
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    navigate("/checkout", {
      state: {
        type: "cart",
        cartItems: cartItems.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          seller: item.seller,
          sellerId: item.sellerId,
          condition: item.condition,
          location: item.location,
        })),
      },
    });
  };

  // Calculate totals
  const subtotal = getCartTotal();
  const originalTotal = cartItems.reduce(
    (total, item) => total + (item.originalPrice || item.price) * item.quantity,
    0
  );
  const savings = originalTotal - subtotal;
  const shipping = subtotal > 50000 ? 0 : 500;

  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}

      <div className="max-w-7xl min-h-[75vh] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          // Empty Cart
          <div className="text-center py-16">
            <div className="text-gray-400 mb-6">
              <ShoppingCartIcon className="mx-auto h-24 w-24" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <button
              onClick={() => navigate("/products")}
              className="bg-[#782355] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#8e2a63] transition-colors duration-200"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-lg"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {item.title}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              Sold by:{" "}
                              <span className="font-medium">{item.seller}</span>
                            </p>
                            <p>
                              Condition:{" "}
                              <span className="font-medium">
                                {item.condition}
                              </span>
                            </p>
                            <p>
                              Location:{" "}
                              <span className="font-medium">
                                {typeof item.location === "object" &&
                                item.location?.address
                                  ? item.location.address
                                  : typeof item.location === "string"
                                  ? item.location
                                  : "Location not specified"}
                              </span>
                            </p>
                            <p
                              className={`font-medium ${
                                item.inStock ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {item.inStock ? "✅ In Stock" : "❌ Out of Stock"}
                            </p>
                          </div>
                        </div>

                        {/* Price and Actions */}
                        <div className="flex flex-col items-end gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-[#782355]">
                                ₹{(item.price * item.quantity).toLocaleString()}
                              </span>
                              {item.originalPrice && (
                                <span className="text-sm text-gray-500 line-through">
                                  ₹
                                  {(
                                    item.originalPrice * item.quantity
                                  ).toLocaleString()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              ₹{item.price.toLocaleString()} each
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="p-2 hover:bg-gray-100 transition-colors duration-200"
                                disabled={item.quantity <= 1}
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                              <span className="px-4 py-2 font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="p-2 hover:bg-gray-100 transition-colors duration-200"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Promo Code */}
              {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Promo Code</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#782355] focus:border-transparent"
                  />
                  <button
                    onClick={applyPromoCode}
                    className="bg-[#782355] text-white px-6 py-3 rounded-lg hover:bg-[#8e2a63] transition-colors duration-200"
                  >
                    Apply
                  </button>
                </div>
                {promoApplied && (
                  <div className="mt-3 text-green-600 text-sm">
                    ✅ Promo code applied! You saved ₹1,000
                  </div>
                )}
              </div> */}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Subtotal ({cartItems.length} items)
                    </span>
                    <span className="font-medium">
                      ₹{subtotal.toLocaleString()}
                    </span>
                  </div>

                  {savings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>You Save</span>
                      <span className="font-medium">
                        -₹{savings.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? "Free" : `₹${shipping}`}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-[#782355]">
                        ₹{total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Info */}

                {/* Security Badge */}
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                  <span>Secure checkout guaranteed</span>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isProcessingPayment}
                  className="w-full mt-6 bg-[#782355] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#8e2a63] transition-colors duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isProcessingPayment
                    ? "Processing..."
                    : "Proceed to Checkout"}
                </button>

                {/* Continue Shopping */}
                <button
                  onClick={() => navigate("/products")}
                  className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CartPage;
