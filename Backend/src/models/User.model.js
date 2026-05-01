const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // URL for profile picture
    },
    profileImage: {
      type: String, // Alternative field name for profile picture
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      geolocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    },
    isSupplier: {
      type: Boolean,
      default: false,
    },
    isVendor: {
      type: Boolean,
      default: false,
    },
    isProfileComplete: {
        type: Boolean,
        default: false
    },
    isSuspended: {
        type: Boolean,
        default: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ordersFulfilled: {
      type: Number,
      default: 0,
    },
    samplesGiven: {
      type: Number,
      default: 0,
    },
    samplesReceived: {
      type: Number,
      default: 0,
    },
    trustScore: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    refresh_token: {
      type: String,
    },
    // Email verification OTP fields
    emailVerificationOTP: {
      type: String,
    },
    emailVerificationOTPExpiry: {
      type: Date,
    },
    emailVerificationOTPLastSent: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Signin OTP fields
    signinOTP: {
      type: String,
    },
    signinOTPExpiry: {
      type: Date,
    },
    signinOTPLastSent: {
      type: Date,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

UserSchema.methods.isPasswordMatch = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

module.exports = mongoose.model("User", UserSchema);
