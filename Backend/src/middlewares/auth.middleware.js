const asynchandler = require("../utils/asynchandler");
const apiError = require("../utils/apiError");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const verifyJWT = asynchandler(async (req, _, next) => {
  try {
    // Fix Bearer token extraction - add space after "Bearer"
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "").trim();

    console.log("Token extracted:", token ? "TOKEN_PRESENT" : "NO_TOKEN");
    console.log("Headers authorization:", req.headers.authorization);

    if (!token) {
      throw new apiError(401, "Access token required");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log("Decoded token:", decoded);

    // Fix: Use _id instead of id (matching the token generation)
    const user = await User.findById(decoded?._id)
      .select("-password -refresh_token")
      .lean();

    console.log("User found:", user ? "USER_FOUND" : "USER_NOT_FOUND");

    if (!user) {
      throw new apiError(401, "Invalid token - user not found");
    }

    if (user.isSuspended) {
      throw new apiError(403, "Your account has been suspended by the administrator");
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    throw new apiError(401, `Authentication failed: ${error.message}`);
  }
});

module.exports = verifyJWT; // Export the verifyJWT function
