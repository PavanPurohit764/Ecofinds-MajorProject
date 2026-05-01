import axios from "axios";
import { logApiCall, handleApiError } from "../utils/apiutils.js";

// 🔧 DEVELOPMENT TOGGLE - Change this to switch between local and hosted
const USE_LOCAL_SERVER = import.meta.env.VITE_USE_LOCAL_SERVER === "true"; // Check .env file first, fallback to false

// Base URL for your backend API
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

console.log("🌐 API Base URL:", BASE_URL);
console.log("🔧 Using Local Server:", USE_LOCAL_SERVER);

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds (increased for production/slow cloud connections)
  headers: {
    "Content-Type": "application/json",
    // Disable caching in development
    ...(USE_LOCAL_SERVER && {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    }),
  },
  withCredentials: true, // Include cookies for authentication
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage if available
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add cache-busting for development
    if (USE_LOCAL_SERVER && config.method === "get") {
      config.params = {
        ...config.params,
        _t: Date.now(), // Add timestamp to prevent caching
      };
    }

    // Handle FormData - remove Content-Type to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.VITE_DEBUG === "true") {
      logApiCall(
        response.config.method,
        response.config.url,
        response.config.data,
        response,
      );
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log errors in development
    if (import.meta.env.VITE_DEBUG === "true") {
      logApiCall(
        originalRequest?.method || "UNKNOWN",
        originalRequest?.url || "UNKNOWN",
        originalRequest?.data,
        null,
        error,
      );
    }

    // Handle 401 (Unauthorized) errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshResponse = await axios.post(
          `${BASE_URL}/users/refresh-token`,
          {},
          { withCredentials: true },
        );

        const newToken = refreshResponse.data.data.accessToken;
        localStorage.setItem("accessToken", newToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 (Forbidden) errors (e.g., account suspended)
    if (error.response?.status === 403) {
      const errorMsg = error.response?.data?.message || "";
      if (errorMsg.toLowerCase().includes("suspended")) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        // Only redirect if not already on the auth page to prevent loops
        if (window.location.pathname !== "/auth") {
          window.location.href = "/auth";
        }
      }
    }

    // Handle 304 responses (not modified - cached)
    if (error.response?.status === 304) {
      console.info("📦 Using cached response for:", originalRequest?.url);
      // For 304, we might want to return a success response with cached data
      // or handle it differently based on your app's needs
      return Promise.resolve({
        status: 304,
        statusText: "Not Modified",
        data: null,
        config: originalRequest,
        headers: error.response.headers,
      });
    }

    return Promise.reject(error);
  },
);

export default apiClient;
