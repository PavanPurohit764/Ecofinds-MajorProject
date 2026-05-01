import { useState, useEffect } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaClock,
  FaUser,
  FaEnvelope,
  FaSpinner,
} from "react-icons/fa";
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from "react-router-dom";

export default function AuthForm({ isLogin = true, onToggle, onSuccess }) {
  const {
    sendVerificationOTP,
    verifyEmailOTP,
    resendVerificationOTP,
    register,
    loginWithPassword,
    isEmailVerified,
    emailVerificationSent,
    isVerifyingOtp,
    isLoading: authLoading,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [registrationInProgress, setRegistrationInProgress] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  let navigate = useNavigate();

  // Countdown timer effects
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendVerification = async () => {
    if (email && email.includes("@")) {
      try {
        await sendVerificationOTP(email, username);
        setCountdown(60);
        setOtp("");
        setRegistrationInProgress(true); // Mark registration as in progress
      } catch (error) {
        console.error("Failed to send verification OTP:", error);
      }
    }
  };

  const handleResendOtp = async () => {
    try {
      await resendVerificationOTP(email, username);
      setCountdown(60);
      setOtp("");
    } catch (error) {
      console.error("Failed to resend OTP:", error);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length === 6) {
      try {
        // Send all registration data along with OTP verification
        const verificationData = {
          email,
          otp,
          username,
          password,
          name: username, // Use username as default name
          fullname: username, // Use username as default fullname
        };

        console.log("Verifying OTP with registration data:", {
          ...verificationData,
          password: "[HIDDEN]",
        });

        await verifyEmailOTP(verificationData);

        // Email verified and user registered successfully
        setRegistrationInProgress(false);
        onSuccess?.(
          "signup",
          "🎉 Registration Successful!",
          `Welcome ${username}! Your email has been verified and your account has been created successfully. You're now logged in!`,
          () => {
            // Navigate to home page after success message
            setTimeout(() => {
              navigate("/");
            }, 100);
          }
        );
        console.log(
          "Email verification and registration successful for user:",
          username
        );
      } catch (error) {
        console.error("Failed to verify email OTP:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Email verification failed. Please try again.";
        alert(`Verification failed: ${errorMessage}`);
      }
    }
  };

  const handleSignup = async () => {
    // Since registration now happens during OTP verification,
    // this function now just initiates the email verification process
    if (!username.trim()) {
      alert("Please provide a username.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    if (!email || !email.includes("@")) {
      alert("Please provide a valid email address.");
      return;
    }

    // Start the email verification process which will handle registration
    await handleSendVerification();
  };

  const handleLoginWithPassword = async () => {
    if (username && password.length >= 1) {
      setLocalLoading(true);
      try {
        await loginWithPassword(username, password);
        // Login successful - redirect to home
        navigate("/");
      } catch (error) {
        console.error("Login failed:", error);
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const handleToggleAuth = () => {
    // Prevent toggling if registration is in progress and email is verified but password not set
    if (registrationInProgress && isEmailVerified && !password) {
      alert(
        "Please complete your registration by setting a password before switching to login."
      );
      return;
    }

    // Reset all states when switching
    setRegistrationInProgress(false);
    setEmail("");
    setUsername("");
    setOtp("");
    setPassword("");
    setCountdown(0);

    onToggle();
  };

  const isSignupEnabled =
    !isLogin &&
    username.trim() &&
    password.length >= 6 &&
    email &&
    email.includes("@");
  const isSigninEnabled = isLogin ? username && password.length >= 1 : false;

  // Determine if we should show loading state
  const isLoading = authLoading || localLoading;

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 md:p-8 w-full max-w-md border border-[#782355]">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center md:text-left">
        {isLogin ? "Sign in" : "Sign up"}
      </h2>

      {/* Username (always shown) */}
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {isLogin ? "Username or Email" : "Username"}
        </label>
        <input
          type="text"
          placeholder={isLogin ? "@john_doe or example@mail.com" : "@john_doe"}
          value={username}
          onChange={(e) => {
            console.log("Username/Email changed:", e.target.value);
            setUsername(e.target.value);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#782355] focus:border-[#782355]"
        />
      </div>

      {/* Password (show early for signup) */}
      {!isLogin ? (
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#782355] focus:border-[#782355]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
          </div>
          {password && (
            <div className="mt-2">
              <div className="flex text-xs gap-4">
                <span
                  className={
                    password.length >= 6 ? "text-green-600" : "text-gray-400"
                  }
                >
                  ✓ At least 6 characters
                </span>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Email (only for register, shown after password) */}
      {!isLogin && password.length >= 6 && (
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => {
                console.log("Email changed:", e.target.value);
                setEmail(e.target.value);
              }}
              disabled={isEmailVerified}
              className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#782355] focus:border-[#782355] ${
                isEmailVerified ? "bg-green-50 border-green-300" : ""
              }`}
            />
            {!emailVerificationSent && (
              <button
                type="button"
                onClick={handleSendVerification}
                disabled={!email || !email.includes("@")}
                className="px-3 md:px-4 py-2 bg-gradient-to-r from-[#782355] to-[#5e1942] text-white rounded-lg hover:from-[#782355] hover:to-[#5e1942] disabled:bg-gray-300 disabled:cursor-not-allowed transition text-xs md:text-sm whitespace-nowrap"
              >
                Verify
              </button>
            )}
            {isEmailVerified && (
              <div className="flex items-center px-3 py-2 bg-green-100 rounded-lg">
                <FaCheck className="text-green-600" size={16} />
              </div>
            )}
          </div>

          {/* Email verification status */}
          {emailVerificationSent && !isEmailVerified && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <FaClock size={12} />
                Verification email sent! Check your inbox.
              </p>
              {countdown > 0 ? (
                <div className="mt-2 inline-block bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                  <p className="text-sm font-medium text-gray-600">
                    Resend OTP in <span className="font-bold text-[#782355]">0:{countdown.toString().padStart(2, "0")}</span>
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="mt-2 text-sm text-white bg-[#782355] hover:bg-[#5e1942] cursor-pointer font-medium px-4 py-1.5 rounded-md transition-all shadow-sm active:scale-95 inline-flex items-center"
                >
                  Didn't receive OTP? Resend
                </button>
              )}
            </div>
          )}
          {isEmailVerified && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <FaCheck size={12} />
              Email verified successfully!
            </p>
          )}
        </div>
      )}

      {/* OTP Input (only when verification email is sent and not yet verified) */}
      {!isLogin && emailVerificationSent && !isEmailVerified && (
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Enter OTP
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#782355] focus:border-[#782355]"
              maxLength={6}
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || isVerifyingOtp}
              className="px-3 md:px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-xs md:text-sm whitespace-nowrap flex items-center gap-1"
            >
              {isVerifyingOtp ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter the 6-digit code sent to your email
          </p>
        </div>
      )}

      {/* Password for login */}
      {isLogin && (
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#782355] focus:border-[#782355]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Submit Button - only show if not in email verification flow or if login */}
      {(isLogin || !registrationInProgress) && (
        <button
          disabled={isLoading || (isLogin ? !isSigninEnabled : !isSignupEnabled)}
          onClick={isLogin ? handleLoginWithPassword : handleSignup}
          className={`w-full py-3 rounded-lg transition font-medium flex items-center justify-center gap-2 ${
            (isLogin ? isSigninEnabled : isSignupEnabled) && !isLoading
              ? "bg-gradient-to-r from-[#782355] to-[#5e1942] text-white hover:from-[#5e1942] hover:to-[#5e1942] transform hover:scale-[1.02]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin" />
              {isLogin ? "Signing in..." : "Signing up..."}
            </>
          ) : (
            isLogin ? "Sign in" : "Sign up"
          )}
        </button>
      )}

      {/* Show status message when registration is in progress */}
      {!isLogin && registrationInProgress && emailVerificationSent && (
        <div className="w-full py-3 px-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-blue-700 font-medium text-sm">
            {!isEmailVerified
              ? "📧 Please verify your email to complete registration"
              : "🎉 Registration completed! Welcome aboard!"}
          </p>
        </div>
      )}

      <p className="text-center mt-4 text-sm text-gray-600">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          onClick={handleToggleAuth}
          className="text-[#782355] hover:text-[#5e1942] font-medium hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
          disabled={
            isLoading ||
            isVerifyingOtp ||
            (registrationInProgress &&
              emailVerificationSent &&
              !isEmailVerified)
          }
        >
          {isLogin ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}