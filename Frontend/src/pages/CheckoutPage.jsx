import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  TruckIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleSolidIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import {
  paymentService,
  openRazorpayCheckout,
} from "../services/paymentService";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";

const SAVED_ADDRESS_KEY = "ecofinds_saved_addresses";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { items: cartItems, removeFromCart } = useCart();

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [showNewAddressForm, setShowNewAddressForm] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [saveAddress, setSaveAddress] = useState(true);
  const [errors, setErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pinCode: "",
  });

  // Get checkout data from navigation state
  const checkoutData = location.state;

  // Determine if this is a single product buy or cart checkout
  const isSingleProduct = checkoutData?.type === "single-product";
  const checkoutItems = isSingleProduct
    ? [
        {
          id: checkoutData.product._id,
          title: checkoutData.product.productTitle,
          price: checkoutData.product.price,
          quantity: checkoutData.quantity,
          image: checkoutData.product.imageUrls?.[0] || checkoutData.product.imageUrl,
          seller: checkoutData.product.userId?.name || "Unknown Seller",
          sellerId: checkoutData.product.userId?._id,
        },
      ]
    : checkoutData?.cartItems || [];

  // Calculate totals
  const subtotal = checkoutItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 50000 ? 0 : 500;
  const total = subtotal + shipping;

  // Load saved addresses and prefill user data
  useEffect(() => {
    // Load saved addresses from localStorage
    try {
      const saved = localStorage.getItem(SAVED_ADDRESS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedAddresses(parsed);
        if (parsed.length > 0) {
          setShowNewAddressForm(false);
          setSelectedAddressIndex(0);
        }
      }
    } catch (e) {
      console.error("Failed to load saved addresses:", e);
    }

    // Prefill user data
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullname || user.name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  // Redirect if no checkout data
  useEffect(() => {
    if (!checkoutData) {
      navigate("/cart", { replace: true });
    }
  }, [checkoutData, navigate]);

  if (!checkoutData || checkoutItems.length === 0) {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (selectedAddressIndex >= 0 && !showNewAddressForm) {
      // Using saved address, no validation needed
      return true;
    }

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }
    if (!formData.addressLine1.trim())
      newErrors.addressLine1 = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.pinCode.trim()) {
      newErrors.pinCode = "PIN code is required";
    } else if (!/^\d{6}$/.test(formData.pinCode.trim())) {
      newErrors.pinCode = "Enter a valid 6-digit PIN code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getShippingAddress = () => {
    if (selectedAddressIndex >= 0 && !showNewAddressForm) {
      return savedAddresses[selectedAddressIndex];
    }
    return {
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      addressLine1: formData.addressLine1.trim(),
      addressLine2: formData.addressLine2.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pinCode: formData.pinCode.trim(),
    };
  };

  const handleSaveNewAddress = () => {
    if (!validateForm()) return false;

    if (saveAddress) {
      const newAddress = getShippingAddress();
      const updated = [...savedAddresses, newAddress];
      setSavedAddresses(updated);
      localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(updated));
    }
    return true;
  };

  const handleDeleteAddress = (index) => {
    const updated = savedAddresses.filter((_, i) => i !== index);
    setSavedAddresses(updated);
    localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(updated));
    if (selectedAddressIndex === index) {
      setSelectedAddressIndex(updated.length > 0 ? 0 : -1);
      if (updated.length === 0) setShowNewAddressForm(true);
    } else if (selectedAddressIndex > index) {
      setSelectedAddressIndex(selectedAddressIndex - 1);
    }
  };

  const handlePlaceOrder = async () => {
    // Validate
    if (showNewAddressForm) {
      if (!handleSaveNewAddress()) return;
    }

    if (isProcessingPayment) return;
    setIsProcessingPayment(true);

    const shippingAddress = getShippingAddress();
    const fullAddressString = `${shippingAddress.fullName}, ${shippingAddress.addressLine1}${shippingAddress.addressLine2 ? ", " + shippingAddress.addressLine2 : ""}, ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pinCode}. Phone: ${shippingAddress.phone}`;

    try {
      const orderData = {
        items: checkoutItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: total,
        currency: "INR",
        shippingAddress: fullAddressString,
      };

      const orderResponse = await paymentService.createOrder(orderData);

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || "Failed to create order");
      }

      const { order } = orderResponse.data;

      // Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_U0JVBIF0p05ory",
        amount: order.amount,
        currency: order.currency,
        name: "EcoFinds",
        description: isSingleProduct
          ? `Purchase: ${checkoutItems[0].title}`
          : `Cart Order (${checkoutItems.length} items)`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyResponse = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              cartItems: checkoutItems.map((item) => ({
                id: item.id,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                seller: item.seller,
                sellerId: item.sellerId,
              })),
            });

            if (verifyResponse.success) {
              // Clear cart items if cart checkout
              if (!isSingleProduct) {
                checkoutItems.forEach((item) => removeFromCart(item.id));
              }
              alert("Payment successful! Your order has been placed.");
              navigate("/dashboard/orders-placed");
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: shippingAddress.fullName,
          email: shippingAddress.email,
          contact: shippingAddress.phone,
        },
        theme: {
          color: "#782355",
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          },
        },
      };

      await openRazorpayCheckout(options);
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Checkout failed: " + (error.message || "Unknown error"));
      setIsProcessingPayment(false);
    }
  };

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep", "Puducherry",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {/* Step 1 - Cart */}
            <div className="flex items-center gap-1.5">
              <CheckCircleSolidIcon className="h-6 w-6 text-green-500" />
              <span className="text-sm font-medium text-green-600 hidden sm:inline">Cart</span>
            </div>
            <div className="w-8 sm:w-16 h-0.5 bg-green-400"></div>
            {/* Step 2 - Checkout (current) */}
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-[#782355] text-white flex items-center justify-center text-xs font-bold ring-4 ring-[#782355]/20">
                2
              </div>
              <span className="text-sm font-semibold text-[#782355] hidden sm:inline">Checkout</span>
            </div>
            <div className="w-8 sm:w-16 h-0.5 bg-gray-300"></div>
            {/* Step 3 - Payment */}
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <span className="text-sm font-medium text-gray-400 hidden sm:inline">Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-[#782355] transition-colors duration-200 mb-6"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Shipping Address */}
          <div className="lg:col-span-2 space-y-6">
            {/* Saved Addresses */}
            {savedAddresses.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-[#782355]" />
                  Saved Addresses
                </h2>
                <div className="space-y-3">
                  {savedAddresses.map((addr, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedAddressIndex(index);
                        setShowNewAddressForm(false);
                      }}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedAddressIndex === index && !showNewAddressForm
                          ? "border-[#782355] bg-[#782355]/5 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      {selectedAddressIndex === index && !showNewAddressForm && (
                        <CheckCircleSolidIcon className="absolute top-3 right-3 h-6 w-6 text-[#782355]" />
                      )}
                      <p className="font-semibold text-gray-900">{addr.fullName}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {addr.addressLine1}
                        {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                      </p>
                      <p className="text-sm text-gray-600">
                        {addr.city}, {addr.state} - {addr.pinCode}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">📞 {addr.phone}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(index);
                        }}
                        className="absolute bottom-3 right-3 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setShowNewAddressForm(true);
                    setSelectedAddressIndex(-1);
                  }}
                  className={`mt-4 w-full py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all duration-200 ${
                    showNewAddressForm
                      ? "border-[#782355] text-[#782355] bg-[#782355]/5"
                      : "border-gray-300 text-gray-500 hover:border-[#782355] hover:text-[#782355]"
                  }`}
                >
                  + Add New Address
                </button>
              </div>
            )}

            {/* New Address Form */}
            {showNewAddressForm && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-[#782355]" />
                  {savedAddresses.length > 0 ? "Add New Address" : "Shipping Address"}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                          errors.fullName
                            ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                            : "border-gray-300 focus:ring-[#782355]/20 focus:border-[#782355]"
                        }`}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                          errors.phone
                            ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                            : "border-gray-300 focus:ring-[#782355]/20 focus:border-[#782355]"
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email *
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                          errors.email
                            ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                            : "border-gray-300 focus:ring-[#782355]/20 focus:border-[#782355]"
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Address Line 1 */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleInputChange}
                      placeholder="House/Flat No., Street, Area"
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.addressLine1
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                          : "border-gray-300 focus:ring-[#782355]/20 focus:border-[#782355]"
                      }`}
                    />
                    {errors.addressLine1 && (
                      <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>
                    )}
                  </div>

                  {/* Address Line 2 */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Address Line 2 <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                      placeholder="Landmark, Apartment name, etc."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#782355]/20 focus:border-[#782355] transition-all"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.city
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                          : "border-gray-300 focus:ring-[#782355]/20 focus:border-[#782355]"
                      }`}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      State *
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none bg-white ${
                        errors.state
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                          : "border-gray-300 focus:ring-[#782355]/20 focus:border-[#782355]"
                      }`}
                    >
                      <option value="">Select State</option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                    )}
                  </div>

                  {/* PIN Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleInputChange}
                      placeholder="6-digit PIN code"
                      maxLength={6}
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        errors.pinCode
                          ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                          : "border-gray-300 focus:ring-[#782355]/20 focus:border-[#782355]"
                      }`}
                    />
                    {errors.pinCode && (
                      <p className="text-red-500 text-xs mt-1">{errors.pinCode}</p>
                    )}
                  </div>

                  {/* Save Address Checkbox */}
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="w-4 h-4 text-[#782355] rounded border-gray-300 focus:ring-[#782355]/40"
                      />
                      <span className="text-sm text-gray-600">
                        Save this address for future orders
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right — Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-900 mb-5">
                Order Summary
              </h3>

              {/* Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-1">
                {checkoutItems.map((item, index) => (
                  <div key={item.id || index} className="flex gap-3">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-[#782355] mt-1">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Subtotal ({checkoutItems.reduce((s, i) => s + i.quantity, 0)} items)
                  </span>
                  <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={`font-medium ${shipping === 0 ? "text-green-600" : ""}`}>
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-400">
                    Free shipping on orders above ₹50,000
                  </p>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-[#782355]">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessingPayment}
                className="w-full mt-6 bg-gradient-to-r from-[#782355] to-[#5e1942] text-white py-4 rounded-xl font-semibold text-lg hover:from-[#5e1942] hover:to-[#4a1434] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg shadow-[#782355]/20"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="h-5 w-5" />
                    Place Order & Pay ₹{total.toLocaleString()}
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheckIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>Secure checkout powered by Razorpay</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <TruckIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span>Estimated delivery in 5-7 business days</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>100% purchase protection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
