// User Service API
import apiClient from '../api/axios';

export const userService = {
  // Get current user details
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/users/get-user');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error.response?.data || error;
    }
  },

  // Update account details
  updateAccountDetails: async (updateData) => {
    try {
      const response = await apiClient.patch('/users/update-account', updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating account details:', error);
      throw error.response?.data || error;
    }
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    try {
      const response = await apiClient.patch('/api/users/change-password', {
        oldPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error.response?.data || error;
    }
  },

  // Get user complete profile (comprehensive)
  getUserCompleteProfile: async (userId = null) => {
    try {
      const url = userId 
        ? `/api/user-profile/statistics/${userId}` 
        : '/api/user-profile/statistics';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error.response?.data || error;
    }
  },

  // Update user profile (comprehensive)
  updateUserProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/user-profile/update', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error.response?.data || error;
    }
  },

  // Get financial summary
  getFinancialSummary: async () => {
    try {
      const response = await apiClient.get('/orders/financial/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      throw error.response?.data || error;
    }
  },

  // Get user order history
  getUserOrderHistory: async (page = 1, limit = 10, section = 'all') => {
    try {
      const params = { page, limit, section };
      const response = await apiClient.get('/user-profile/orders', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user order history:', error);
      throw error.response?.data || error;
    }
  },

  // Get user review sections
  getUserReviewSections: async (section = 'all', page = 1, limit = 10) => {
    try {
      const params = { section, page, limit };
      const response = await apiClient.get('/user-profile/reviews', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error.response?.data || error;
    }
  },

  // Get user product listings
  getUserProductListings: async (page = 1, limit = 12, status = 'all', category = 'all', sortBy = 'recent') => {
    try {
      const params = { page, limit, status, category, sortBy };
      const response = await apiClient.get('/user-profile/listings', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user listings:', error);
      throw error.response?.data || error;
    }
  },

  // Get user material requests
  getUserMaterialRequests: async (page = 1, limit = 10, status = 'all') => {
    try {
      const params = { page, limit, status };
      const response = await apiClient.get('/user-profile/material-requests', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching material requests:', error);
      throw error.response?.data || error;
    }
  },

  // Get user connections
  getConnections: async () => {
    try {
      const response = await apiClient.get('/user-profile/connections');
      return response.data;
    } catch (error) {
      console.error('Error fetching connections:', error);
      throw error.response?.data || error;
    }
  },

  // Send connection request
  sendConnectionRequest: async (userId) => {
    try {
      const response = await apiClient.post(`/user-profile/connections/request/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error sending connection request:', error);
      throw error.response?.data || error;
    }
  },

  // Respond to connection request
  respondToConnectionRequest: async (requestId, response) => {
    try {
      const apiResponse = await apiClient.put(`/user-profile/connections/respond/${requestId}`, { response });
      return apiResponse.data;
    } catch (error) {
      console.error('Error responding to connection request:', error);
      throw error.response?.data || error;
    }
  },

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await apiClient.patch('/users/change-avatar', formData);
      return response.data;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error.response?.data || error;
    }
  },

  // Upload cover image
  uploadCoverImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('coverImage', file);
      
      const response = await apiClient.post('/user-profile/upload/cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading cover image:', error);
      throw error.response?.data || error;
    }
  }
};

export default userService;
