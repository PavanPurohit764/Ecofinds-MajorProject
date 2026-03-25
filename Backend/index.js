const express = require("express");
const connectDB = require("./src/config/db.js");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const Cors = require("cors");
const fileUpload = require("express-fileupload");
const socketIo = require("socket.io");
const rateLimit = require("express-rate-limit");
const http = require("http");
const razorpayWebhookRouter = require("./src/routes/razorpayWebhook.route.js");
// Load environment variables from .env file
dotenv.config();

// Connect to the database
connectDB();

// Create Express app
const app = express();
// socket server
const server = http.createServer(app);

app.set("trust proxy", 1);

// Socket.io setup with CORS
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// CORS configuration
app.use(
  Cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Expires",
    ],
  }),
);

// Disable caching in development
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
    next();
  });
}
// app.options('*', Cors()); // Enable pre-flight for all routes

// Must come BEFORE express.json() to read raw body correctly
app.use("/api/razorpay/webhook", razorpayWebhookRouter);

// Middleware to parse JSON
app.use(express.json({ limit: "10mb" })); // This is a built-in middleware function in Express. It parses incoming requests with JSON payloads and is based on body-parser.
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // This is a built-in middleware function in Express. It parses incoming requests with urlencoded payloads and is based on body-parser.
app.use(express.static("public")); // This is a built-in middleware function in Express. It serves static files and is based on serve-static.

// Rate limiting
const limiter = rateLimit({
  windowMs: 150000 * 60 * 1000, // 15 minutes
  max: 1000000, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

const messageLimiter = rateLimit({
  windowMs: 15000 * 60 * 1000, // 1 minute
  max: 1330, // limit each IP to 30 message requests per minute
  message: {
    success: false,
    message: "Too many message requests, please slow down.",
  },
});

// Middleware to parse cookies
app.use(cookieParser()); // This is a third-party middleware function in Express. It parses cookies attached to the client request object.

// File upload middleware
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./tmp/", // Use relative path that works on all platforms
    limits: { fileSize: 50 * 1024 * 1024 }, // Optional: limit file size to 50MB
    abortOnLimit: true, // Optional: return 413 when file size is exceeded
    createParentPath: true, // Create the temp directory if it doesn't exist
  }),
); // This is a third-party middleware function in Express. It parses file uploads and is based on express-fileupload.

// Import routes
const userRouter = require("./src/routes/user.route.js");
const supplierListingRouter = require("./src/routes/SupplierListing.route.js");
const sampleRouter = require("./src/routes/sample.route.js");
const analyticsRouter = require("./src/routes/analytics.route.js");
const userProfileRouter = require("./src/routes/userProfile.route.js");
const orderRouter = require("./src/routes/order.route.js");
const reviewRouter = require("./src/routes/review.route.js");
const materialRequestRouter = require("./src/routes/materialRequest.route.js");
const notificationRouter = require("./src/routes/notification.route.js");
const negotiationRouter = require("./src/routes/negotiation.route.js");
const orderChatRouter = require("./src/routes/orderChat.route.js");
const productRouter = require("./src/routes/product.route.js");
const cartRouter = require("./src/routes/cart.route.js");
const paymentRouter = require("./src/routes/payment.route.js");
const recommendationRouter = require("./src/routes/recommendation.route.js");
const adminRouter = require("./src/routes/admin.route.js");
const wishlistRouter = require("./src/routes/wishlist.route.js");

// Import controllers and socket handlers
const locationChatSocket = require("./src/locationChatSocket.js");
const orderChatSocket = require("./src/orderChatSocket.js");
const NotificationSocketHandler = require("./src/utils/notificationSocket.js");
const notificationService = require("./src/utils/notificationService.js");
const groupchatroute = require("./src/routes/groupchat.route.js");
const searchRouter = require("./src/routes/search.route.js");

const chatRouter = require("./src/routes/chat.route.js");

// chat route
app.use("/api/", limiter);
app.use("/api/messages", messageLimiter);
app.use("/api/messages", groupchatroute);
app.use("/api/chat", chatRouter);

// Define routes
app.use("/api/users", userRouter); // Mount the user router at the correct endpoint
app.use("/api/products", supplierListingRouter); // Mount the supplier listing (products) router
app.use("/api/items", productRouter); // Mount the new product router for Sellx items
app.use("/api/search", searchRouter); // Mount the search router
app.use("/api/cart", cartRouter); // Mount the cart router
app.use("/api/admin", adminRouter); // Mount the admin router
app.use("/api/payments", paymentRouter); // Mount the payment router
app.use("/api/samples", sampleRouter); // Mount the sample router
app.use("/api/analytics", analyticsRouter); // Mount the analytics router
app.use("/api/orders", orderRouter); // Mount the order router
app.use("/api/reviews", reviewRouter); // Mount the review router
app.use("/api/profile", userProfileRouter); // Mount the user profile router
app.use("/api/material-requests", materialRequestRouter); // Mount the material request router
app.use("/api/notifications", notificationRouter); // Mount the notification router
app.use("/api/negotiations", negotiationRouter); // Mount the negotiation router
app.use("/api/order-chat", orderChatRouter); // Mount the order chat router
app.use("/api/recommendations", recommendationRouter);
app.use("/api/wishlist", wishlistRouter); // Mount the recommendation router

// private chat
// app.use('/api/chat', chatRoutes); // chating route
// Define a simple route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RawConnect Chat Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Socket.io connection handling
const socketHandler = locationChatSocket(io);
const orderChatHandler = orderChatSocket(io);

// Initialize notification socket handler
const notificationSocketHandler = new NotificationSocketHandler(io);

// Set up notification service with socket handler
notificationService.setSocketHandler(notificationSocketHandler);

// Make notification service globally available
global.notificationService = notificationService;

console.log("🔔 Real-time notification system initialized");

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      console.error("Error during server shutdown:", err);
      process.exit(1);
    }

    console.log("HTTP server closed");

    // Close database connection
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");

      // Cleanup socket connections
      if (socketHandler && socketHandler.cleanup) {
        socketHandler.cleanup();
        console.log("Socket connections cleaned up");
      }

      // Cleanup order chat socket connections
      if (orderChatHandler && orderChatHandler.cleanup) {
        orderChatHandler.cleanup();
        console.log("Order chat socket connections cleaned up");
      }

      // Cleanup notification socket connections
      if (notificationSocketHandler && notificationSocketHandler.cleanup) {
        notificationSocketHandler.cleanup();
        console.log("Notification socket connections cleaned up");
      }

      console.log("✅ Graceful shutdown completed");
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown due to timeout");
    process.exit(1);
  }, 10000);
};

// Listen for shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
