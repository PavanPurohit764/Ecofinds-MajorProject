const asynchandler = require("../utils/asynchandler");
const User = require("../models/User.model");
const apiError = require("../utils/apiError");
const uploadOnCloudinary = require("../utils/cloudinary");
const ApiResponse = require("../utils/apiResponse");
const {
  generateOTP,
  generateOTPExpiry,
  verifyOTP,
  canResendOTP,
} = require("../utils/otpGenerator");
const { sendSignupOTP, sendSigninOTPEmail } = require("../utils/emailService");

// This function is now deprecated - registration happens during email verification
const registerUser = asynchandler(async (req, res) => {
  // Redirect to the new combined flow
  throw new apiError(
    400,
    "Please use the email verification flow for registration. Registration now happens automatically after email verification."
  );
});

// Send OTP for email verification during signup
const sendEmailVerificationOTP = asynchandler(async (req, res) => {
  const { email, username } = req.body;
  console.log("Email verification request:", { email, username });

  if (!email) {
    throw new apiError(400, "Email is required");
  }

  // Check if user already exists with this email (only fully registered users)
  const existingUser = await User.findOne({
    email,
    isEmailVerified: true,
    password: { $not: /^temp_password_/ },
    username: { $not: /^temp_/ },
  });

  if (existingUser) {
    throw new apiError(
      409,
      "Email is already registered. Please use login instead."
    );
  }

  // Check if someone else is trying to use this username (but different email)
  if (username) {
    const usernameExists = await User.findOne({
      username: username.toLowerCase(),
      email: { $ne: email },
      isEmailVerified: true,
      password: { $not: /^temp_password_/ },
    });

    if (usernameExists) {
      throw new apiError(409, "Username is already taken by another user");
    }
  }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = generateOTPExpiry();

    try {
      // 1. CLEANUP PREVIOUS ATTEMPTS
      console.log(`[AUTH] Cleaning up existing temp records for: ${email}`);
      const cleanupStart = Date.now();
      await User.deleteMany({
        email,
        isEmailVerified: false,
      });
      console.log(`[AUTH] Cleanup completed in ${Date.now() - cleanupStart}ms`);

      // 2. SEND EMAIL
      console.log(`[AUTH] Attempting to send OTP email to: ${email}`);
      const emailStart = Date.now();
      await sendSignupOTP(email, otp, username);
      console.log(
        `[AUTH] Email sent successfully in ${Date.now() - emailStart}ms`
      );

      // 3. CREATE TEMP RECORD
      console.log(`[AUTH] Creating temporary record for: ${email}`);
      const createStart = Date.now();
      const timestamp = Date.now();
      const tempUsername = `temp_verification_${timestamp}`;

      await User.create({
        name: "Temp Verification",
        email,
        username: tempUsername,
        fullname: "Temp Verification",
        phone: `temp_${timestamp}`,
        password: `temp_password_${timestamp}`,
        address: {
          street: "Temporary",
          city: "Temporary",
          state: "Temporary",
          pincode: "000000",
          geolocation: { lat: 0.0, lng: 0.0 },
        },
        emailVerificationOTP: otp,
        emailVerificationOTPExpiry: otpExpiry,
        emailVerificationOTPLastSent: new Date(),
        isEmailVerified: false,
      });
      console.log(
        `[AUTH] Temp record created in ${Date.now() - createStart}ms`
      );

      return res
        .status(200)
        .json(
          new ApiResponse(200, { email }, "OTP sent successfully to your email")
        );
    } catch (error) {
      console.error("[AUTH] Error in sendEmailVerificationOTP:", error);
      throw new apiError(
        500,
        `Verification failed: ${error.message || "Internal Server Error"}`
      );
    }
});

// Verify email OTP and automatically register user
const verifyEmailOTP = asynchandler(async (req, res) => {
  const { email, otp, username, password, name, fullname, phone } = req.body;

  if (!email || !otp) {
    throw new apiError(400, "Email and OTP are required");
  }

  if (!username || !password) {
    throw new apiError(
      400,
      "Username and password are required for registration"
    );
  }

  const tempUser = await User.findOne({
    email,
    $or: [
      { username: { $regex: /^temp_/ } },
      { password: { $regex: /^temp_password_/ } },
    ],
  });

  if (!tempUser) {
    throw new apiError(
      404,
      "Verification session not found. Please request OTP again"
    );
  }

  // Verify OTP
  const isValid = verifyOTP(
    otp,
    tempUser.emailVerificationOTP,
    tempUser.emailVerificationOTPExpiry
  );

  if (!isValid) {
    throw new apiError(400, "Invalid or expired OTP");
  }

  try {
    // Delete the temporary record first
    await User.deleteOne({ _id: tempUser._id });

    // AGGRESSIVE cleanup - Delete ANY other records with this email or username
    console.log("Cleaning up before registration for:", { email, username });
    await User.deleteMany({ email: email });
    await User.deleteMany({ username: username.toLowerCase() });

    // Set default address values
    const userAddress = {
      street: "To be updated",
      city: "To be updated",
      state: "To be updated",
      pincode: "000000",
      geolocation: {
        lat: 0.0,
        lng: 0.0,
      },
    };

    // Create the actual user immediately after successful verification
    const newUser = await User.create({
      username: username.toLowerCase(),
      email,
      password, // Will be hashed by pre-save middleware
      name: name || username,
      fullname: fullname || username,
      phone: phone || `user_${Date.now()}`,
      address: userAddress,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366f1&color=ffffff&size=200`,
      isEmailVerified: true, // Email is verified since they passed OTP
    });

    // Generate tokens
    const accessToken = newUser.generateAccessToken();
    const refreshToken = newUser.generateRefreshToken();

    // Save refresh token
    newUser.refresh_token = refreshToken;
    await newUser.save({ validateBeforeSave: false });

    // Cookie options
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };

    // Return user without password
    const createdUser = await User.findById(newUser._id).select(
      "-password -refresh_token"
    );

    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          201,
          {
            user: createdUser,
            accessToken,
            refreshToken,
          },
          "Email verified and registration completed successfully!"
        )
      );
  } catch (error) {
    console.error("Registration error after email verification:", error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      console.log(`Duplicate ${field} error, performing cleanup and retry...`);

      try {
        // Super aggressive cleanup
        await User.deleteMany({ email: email });
        await User.deleteMany({ username: username.toLowerCase() });

        // Wait a moment
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Retry user creation
        const retryUser = await User.create({
          username: username.toLowerCase(),
          email,
          password,
          name: name || username,
          fullname: fullname || username,
          phone: phone || `retry_${Date.now()}`,
          address: {
            street: "To be updated",
            city: "To be updated",
            state: "To be updated",
            pincode: "000000",
            geolocation: { lat: 0.0, lng: 0.0 },
          },
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6366f1&color=ffffff&size=200`,
          isEmailVerified: true,
        });

        const accessToken = retryUser.generateAccessToken();
        const refreshToken = retryUser.generateRefreshToken();
        retryUser.refresh_token = refreshToken;
        await retryUser.save({ validateBeforeSave: false });

        const options = {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 24 * 60 * 60 * 1000,
        };

        const createdUser = await User.findById(retryUser._id).select(
          "-password -refresh_token"
        );

        return res
          .status(201)
          .cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options)
          .json(
            new ApiResponse(
              201,
              {
                user: createdUser,
                accessToken,
                refreshToken,
              },
              "Email verified and registration completed successfully after cleanup!"
            )
          );
      } catch (retryError) {
        console.error("Retry failed:", retryError);
        throw new apiError(
          500,
          "Registration failed due to database conflicts. Please try again."
        );
      }
    }

    throw new apiError(500, `Registration failed: ${error.message}`);
  }
});

// Resend email verification OTP
const resendEmailVerificationOTP = asynchandler(async (req, res) => {
  const { email, username } = req.body;

  if (!email) {
    throw new apiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (user.isEmailVerified) {
    throw new apiError(400, "Email is already verified");
  }

  // Check rate limiting
  if (!canResendOTP(user.emailVerificationOTPLastSent)) {
    throw new apiError(
      429,
      "Please wait 30 seconds before requesting a new OTP"
    );
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpiry = generateOTPExpiry();

  try {
    // Send email
    await sendSignupOTP(email, otp, username || user.username);

    // Update OTP in database
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpiry = otpExpiry;
    user.emailVerificationOTPLastSent = new Date();
    await user.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { email }, "New OTP sent successfully"));
  } catch (error) {
    throw new apiError(500, "Failed to resend verification email");
  }
});

// Fix corrupted username endpoint
const fixCorruptedUsername = asynchandler(async (req, res) => {
  const { email, newUsername } = req.body;

  if (!email || !newUsername) {
    throw new apiError(400, "Email and new username are required");
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      throw new apiError(404, "User not found with this email");
    }

    console.log("Found user with corrupted username:", {
      currentUsername: user.username,
      email: user.email,
      id: user._id,
    });

    // Check if the new username is already taken by someone else
    const existingUser = await User.findOne({
      username: newUsername.toLowerCase(),
      _id: { $ne: user._id },
    });

    if (existingUser) {
      throw new apiError(409, "Username is already taken by another user");
    }

    // Update the username
    user.username = newUsername.toLowerCase();
    await user.save();

    console.log("Username successfully updated to:", newUsername.toLowerCase());

    return res.status(200).json(
      new ApiResponse(200, {
        oldUsername: user.username,
        newUsername: newUsername.toLowerCase(),
        email: user.email,
      }, "Username fixed successfully")
    );
  } catch (error) {
    console.error("Error fixing username:", error);
    throw new apiError(500, `Failed to fix username: ${error.message}`);
  }
});

// Reset password for corrupted users
const resetUserPassword = asynchandler(async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    throw new apiError(400, "Email and new password are required");
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      throw new apiError(404, "User not found with this email");
    }

    console.log("Resetting password for user:", {
      username: user.username,
      email: user.email,
      id: user._id,
    });

    // Update the password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    console.log("Password successfully reset for user:", user.email);

    return res.status(200).json(
      new ApiResponse(200, {
        email: user.email,
        username: user.username,
      }, "Password reset successfully")
    );
  } catch (error) {
    console.error("Error resetting password:", error);
    throw new apiError(500, `Failed to reset password: ${error.message}`);
  }
});

// Debug endpoint to check for conflicting users
const debugCheckUser = asynchandler(async (req, res) => {
  const { email, username } = req.query;

  console.log("Debug check for:", { email, username });

  try {
    // Find all users with this email
    const usersByEmail = await User.find({ email });

    // Find all users with this username
    const usersByUsername = await User.find({
      username: username?.toLowerCase(),
    });

    return res.status(200).json({
      email: email,
      username: username,
      usersByEmail: usersByEmail.map((u) => ({
        id: u._id,
        email: u.email,
        username: u.username,
        isEmailVerified: u.isEmailVerified,
        createdAt: u.createdAt,
      })),
      usersByUsername: usersByUsername.map((u) => ({
        id: u._id,
        email: u.email,
        username: u.username,
        isEmailVerified: u.isEmailVerified,
        createdAt: u.createdAt,
      })),
      totalEmailMatches: usersByEmail.length,
      totalUsernameMatches: usersByUsername.length,
    });
  } catch (error) {
    console.error("Debug check failed:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Search for users by name or username
const searchUsers = asynchandler(async (req, res) => {
  const queryParam = req.query.q || "";
  console.log(`[SEARCH] Searching for users with query: "${queryParam}" (Current User: ${req.user.username})`);

  const keyword = queryParam
    ? {
        $or: [
          { name: { $regex: queryParam, $options: "i" } },
          { username: { $regex: queryParam, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find({
    ...keyword,
    _id: { $ne: req.user._id },
    isEmailVerified: true // Only return verified users
  })
    .select("name username email profileImage avatar")
    .limit(10); // Limit to top 10 results for better performance

  console.log(`[SEARCH] Found ${users.length} users matching query: "${queryParam}"`);

  return res
    .status(200)
    .json(new ApiResponse(200, { users }, "Users retrieved successfully"));
});

module.exports = {
  registerUser,
  sendEmailVerificationOTP,
  verifyEmailOTP,
  resendEmailVerificationOTP,
  debugCheckUser,
  fixCorruptedUsername,
  resetUserPassword,
  searchUsers,
};
