const UserSchema = require("../models/User.model");
const asynchandler = require("../utils/asynchandler");
const apiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await UserSchema.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refresh_token = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    throw new apiError(
      500,
      "Something went wrong while assigning access token and refresh token"
    );
  }
};

const loginUser = asynchandler(async (req, res) => {
  console.log("🚀 LOGIN ROUTE HIT!");
  console.log("📝 Request Body:", req.body);
  console.log("📝 Request Headers:", req.headers);

  const { email, username, password } = req.body;

  console.log("Login attempt with:", {
    email: email || "NOT_PROVIDED",
    username: username || "NOT_PROVIDED",
    password: password ? "PROVIDED" : "NOT_PROVIDED",
  });

  if (!password || (!email && !username)) {
    throw new apiError(400, "Please provide email/username and password");
  }

  // Build search query
  const searchQuery = {
    $or: [],
  };

  if (email) {
    searchQuery.$or.push({ email: email });
  }

  if (username) {
    searchQuery.$or.push({ username: username });
  }

  console.log(
    "Searching for user with query:",
    JSON.stringify(searchQuery, null, 2)
  );

  const user = await UserSchema.findOne(searchQuery);

  console.log(
    "User found:",
    user
      ? {
          id: user._id,
          email: user.email,
          username: user.username,
          isEmailVerified: user.isEmailVerified,
          hasPassword: !!user.password,
        }
      : "NO_USER_FOUND"
  );

  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (user.isSuspended) {
    throw new apiError(403, "Your account has been suspended by the administrator");
  }

  console.log("Attempting password verification...");
  console.log("Raw password from request:", password);
  console.log("Stored password hash:", user.password);

  const isPasswordMatch = await user.isPasswordMatch(password);
  console.log("Password match result:", isPasswordMatch);

  // Additional debugging: Let's also try a direct bcrypt compare
  const bcrypt = require("bcryptjs");
  const directCompare = await bcrypt.compare(password, user.password);
  console.log("Direct bcrypt compare result:", directCompare);

  if (!isPasswordMatch) {
    throw new apiError(400, "Invalid credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await UserSchema.findById(user._id).select(
    "-password -refresh_token"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, user: loggedInUser },
        "User logged in successfully"
      )
    );
});

const logoutUser = asynchandler(async (req, res) => {
  await UserSchema.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refresh_token: "" },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

module.exports = { loginUser, logoutUser, generateAccessTokenAndRefreshToken };
