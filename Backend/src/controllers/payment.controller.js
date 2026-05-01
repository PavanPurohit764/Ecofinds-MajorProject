const Razorpay = require('razorpay');
const crypto = require('crypto');
const apiResponse = require('../utils/apiResponse');
const apiError = require('../utils/apiError');
const asyncHandler = require('../utils/asynchandler');
const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const User = require('../models/User.model');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_U0JVBIF0p05ory',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'low5YzbvSA1aq9AOdglXCZZu'
});

// Create Razorpay order
const createOrder = asyncHandler(async (req, res) => {
  const { items, totalAmount, currency = 'INR', shippingAddress } = req.body;

  if (!req.user) {
    throw new apiError(401, "User authentication required");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new apiError(400, "Items array is required");
  }

  if (!totalAmount || totalAmount <= 0) {
    throw new apiError(400, "Valid total amount is required");
  }

  try {
    // Check for existing pending order with same items to prevent duplicates
    const existingPendingOrder = await Order.findOne({
      buyerId: req.user._id,
      paymentStatus: 'pending',
      status: 'pending',
      orderType: 'from-cart',
      totalAmount: totalAmount,
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Within last 10 minutes
    });

    if (existingPendingOrder) {
      console.log('Found existing pending order:', existingPendingOrder._id);
      
      // Return the existing Razorpay order instead of creating a new one
      return res.status(200).json(
        new apiResponse(200, {
          order: {
            id: existingPendingOrder.razorpayOrderId,
            amount: existingPendingOrder.totalAmount * 100,
            currency: existingPendingOrder.currency,
            receipt: `existing_${existingPendingOrder._id}`
          },
          orderId: existingPendingOrder._id
        }, "Using existing pending order")
      );
    }

    // Fetch product details to get seller information
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).select('userId productTitle price');
    
    if (products.length === 0) {
      throw new apiError(404, "No valid products found");
    }
    
    // Group items by seller for multi-vendor support
    const itemsBySeller = {};
    
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.productId.toString());
      if (!product) {
        throw new apiError(404, `Product with ID ${item.productId} not found`);
      }
      
      const sellerId = product.userId.toString();
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }
      
      itemsBySeller[sellerId].push({
        ...item,
        productTitle: product.productTitle,
        sellerProductPrice: product.price
      });
    }
    
    // For now, we'll create one order for the first seller
    // TODO: In the future, we might want to create separate orders for each seller
    const firstSellerId = Object.keys(itemsBySeller)[0];
    const firstSellerItems = itemsBySeller[firstSellerId];
    
    console.log('Creating order for seller:', firstSellerId);
    console.log('Items:', firstSellerItems);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // Amount in paise
      currency: currency,
      receipt: `order_${Date.now()}`,
      payment_capture: 1
    });

    // Create order in database
    const orderData = {
      userId: req.user?._id,
      buyerId: req.user?._id,
      sellerId: firstSellerId, // Use the actual seller ID from the product
      itemName: firstSellerItems.length > 1 ? `Cart Order (${firstSellerItems.length} items)` : firstSellerItems[0].productTitle || 'Product',
      quantity: firstSellerItems.reduce((total, item) => total + (item.quantity || 1), 0),
      unit: 'pieces',
      basePrice: totalAmount,
      totalPrice: totalAmount,
      orderType: 'from-cart',
      deliveryType: 'delivery',
      items: firstSellerItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity || 1,
        priceAtTime: item.price,
        productSnapshot: {
          title: item.productTitle || 'Product',
          price: item.price
        }
      })),
      totalAmount: totalAmount,
      currency: currency,
      razorpayOrderId: razorpayOrder.id,
      status: 'pending',
      paymentStatus: 'pending',
      deliveryAddress: shippingAddress || '',
    };

    const order = new Order(orderData);
    await order.save();

    res.status(201).json(
      new apiResponse(201, {
        order: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt
        },
        orderId: order._id
      }, "Order created successfully")
    );

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw new apiError(500, `Failed to create order: ${error.message}`);
  }
});

// Verify payment
const verifyPayment = asyncHandler(async (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    cartItems 
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new apiError(400, "Payment verification details are required");
  }

  try {
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'low5YzbvSA1aq9AOdglXCZZu')
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      throw new apiError(400, "Invalid payment signature");
    }

    // Find and update order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    
    if (!order) {
      throw new apiError(404, "Order not found");
    }

    // Update order with payment details
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentStatus = 'completed';
    order.status = 'confirmed';
    order.paidAt = new Date();

    await order.save();

    res.status(200).json(
      new apiResponse(200, {
        orderId: order._id,
        paymentId: razorpay_payment_id,
        status: 'success'
      }, "Payment verified successfully")
    );

  } catch (error) {
    console.error('Payment verification error:', error);
    throw new apiError(500, `Payment verification failed: ${error.message}`);
  }
});

// Get payment history
const getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user?._id;

  if (!userId) {
    throw new apiError(401, "User authentication required");
  }

  try {
    const skip = (page - 1) * limit;
    
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');

    const total = await Order.countDocuments({ userId });

    res.status(200).json(
      new apiResponse(200, {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }, "Payment history retrieved successfully")
    );

  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw new apiError(500, `Failed to fetch payment history: ${error.message}`);
  }
});

// Process cart checkout
const processCartCheckout = asyncHandler(async (req, res) => {
  const { cartItems, totalAmount, paymentMethod = 'razorpay' } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    throw new apiError(401, "User authentication required");
  }

  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    throw new apiError(400, "Cart items are required");
  }

  if (!totalAmount || totalAmount <= 0) {
    throw new apiError(400, "Valid total amount is required");
  }

  try {
    // Check for existing pending order to prevent duplicates
    const existingPendingOrder = await Order.findOne({
      buyerId: userId,
      paymentStatus: 'pending',
      status: 'pending',
      orderType: 'from-cart',
      totalAmount: totalAmount,
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Within last 10 minutes
    });

    if (existingPendingOrder) {
      console.log('Found existing pending cart order:', existingPendingOrder._id);
      
      // Return the existing Razorpay order instead of creating a new one
      return res.status(200).json(
        new apiResponse(200, {
          order: {
            id: existingPendingOrder.razorpayOrderId,
            amount: existingPendingOrder.totalAmount * 100,
            currency: existingPendingOrder.currency,
            receipt: `existing_cart_${existingPendingOrder._id}`
          },
          orderId: existingPendingOrder._id
        }, "Using existing pending cart order")
      );
    }

    if (paymentMethod === 'razorpay') {
      // Fetch product details to get seller information
      const productIds = cartItems.map(item => item.id || item.productId);
      const products = await Product.find({ _id: { $in: productIds } }).select('userId productTitle price');
      
      if (products.length === 0) {
        throw new apiError(404, "No valid products found in cart");
      }
      
      // Group items by seller for multi-vendor support
      const itemsBySeller = {};
      
      for (const item of cartItems) {
        const productId = item.id || item.productId;
        const product = products.find(p => p._id.toString() === productId.toString());
        if (!product) {
          throw new apiError(404, `Product with ID ${productId} not found`);
        }
        
        const sellerId = product.userId.toString();
        if (!itemsBySeller[sellerId]) {
          itemsBySeller[sellerId] = [];
        }
        
        itemsBySeller[sellerId].push({
          ...item,
          productId: productId,
          productTitle: product.productTitle,
          sellerProductPrice: product.price
        });
      }
      
      // For now, we'll create one order for the first seller
      const firstSellerId = Object.keys(itemsBySeller)[0];
      const firstSellerItems = itemsBySeller[firstSellerId];
      
      console.log('Creating cart order for seller:', firstSellerId);
      console.log('Cart items:', firstSellerItems);

      // Create Razorpay order for cart checkout
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // Amount in paise
        currency: 'INR',
        receipt: `cart_${userId}_${Date.now()}`,
        payment_capture: 1
      });

      // Create order in database
      const orderData = {
        userId: userId,
        buyerId: userId,
        sellerId: firstSellerId, // Use the actual seller ID from the product
        itemName: firstSellerItems.length > 1 ? `Cart Order (${firstSellerItems.length} items)` : firstSellerItems[0].productTitle || 'Product',
        quantity: firstSellerItems.reduce((total, item) => total + (item.quantity || 1), 0),
        unit: 'pieces',
        basePrice: totalAmount,
        totalPrice: totalAmount,
        orderType: 'from-cart',
        deliveryType: 'delivery',
        items: firstSellerItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity || 1,
          priceAtTime: item.price,
          productSnapshot: {
            title: item.productTitle || 'Product',
            price: item.price
          }
        })),
        totalAmount: totalAmount,
        currency: 'INR',
        razorpayOrderId: razorpayOrder.id,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: paymentMethod
      };

      const order = new Order(orderData);
      await order.save();

      res.status(201).json(
        new apiResponse(201, {
          order: {
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt
          },
          orderId: order._id
        }, "Cart checkout order created successfully")
      );
    } else {
      throw new apiError(400, "Unsupported payment method");
    }

  } catch (error) {
    console.error('Cart checkout error:', error);
    throw new apiError(500, `Cart checkout failed: ${error.message}`);
  }
});

// Create order from cart (alternative endpoint)
const createOrderFromCart = asyncHandler(async (req, res) => {
  const { paymentMethod = 'razorpay' } = req.body;
  const userId = req.user?._id;

  if (!userId) {
    throw new apiError(401, "User authentication required");
  }

  try {
    // This would typically fetch cart items from a Cart model
    // For now, we'll return a placeholder response
    res.status(200).json(
      new apiResponse(200, {
        message: "Order creation from cart initiated",
        paymentMethod: paymentMethod,
        userId: userId
      }, "Order creation process started")
    );

  } catch (error) {
    console.error('Order creation from cart error:', error);
    throw new apiError(500, `Failed to create order from cart: ${error.message}`);
  }
});

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  processCartCheckout,
  createOrderFromCart
};
