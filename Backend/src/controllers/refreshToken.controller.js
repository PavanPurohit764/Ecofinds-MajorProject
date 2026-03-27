const jwt = require('jsonwebtoken');
const UserSchema = require('../models/User.model');
const asynchandler = require('../utils/asynchandler');
const apiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await UserSchema.findById(userId);
        if (!user) {
            throw new apiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Update refresh token in the database
        user.refresh_token = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (err) {
        throw new apiError(500, "Something went wrong while generating tokens");
    }
};

const refreshToken = asynchandler(async (req, res) => {
    const { refreshToken } = req.cookies; // Get refresh token from cookies

    if (!refreshToken) {
        throw new apiError(401, "Session expired. Please log in again.");
    }

    // Find user by refresh token
    const user = await UserSchema.findOne({ refresh_token: refreshToken });

    if (!user) {
        throw new apiError(403, "Invalid refresh token. Please log in again.");
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        if (decoded.id !== user._id.toString()) {
            throw new apiError(403, "Invalid refresh token. Please log in again.");
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);

        // Set new cookies
        const options = { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        };

        return res.status(200)
            .cookie('refreshToken', newRefreshToken, options)
            .cookie('accessToken', accessToken, options)
            .json(new ApiResponse(200, { accessToken }, "New access token generated"));
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            // Handle expired refresh token
            user.refresh_token = null; // Clear refresh token in DB
            await user.save({ validateBeforeSave: false });

            res.clearCookie("refreshToken"); // Clear cookies
            res.clearCookie("accessToken");

            throw new apiError(401, "Session expired. Please log in again.");
        }
        throw new apiError(403, "Invalid refresh token. Please log in again.");
    }
});

module.exports = { refreshToken };
