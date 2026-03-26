import React, { useState, useEffect } from "react";
import {
  PencilIcon,
  CameraIcon,
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { userService } from "../../services/userService";

const MyProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    pincode: "",
    profileImage: null,
    memberSince: "",
    profileStatus: "Incomplete",
  });

  const [editData, setEditData] = useState(profileData);

  const [statsData, setStatsData] = useState([
    {
      title: "Total Revenue",
      value: "₹0",
      color: "from-green-400 to-green-600",
      icon: "📈",
    },
    {
      title: "Total Expenditure",
      value: "₹0",
      color: "from-blue-400 to-blue-600",
      icon: "📊",
    },
    {
      title: "Net Profit",
      value: "₹0",
      color: "from-purple-400 to-purple-600",
      icon: "💰",
    },
  ]);

  const buildUpdateData = (originalData, editedData) => {
    const updateData = {};

    // Check top-level fields
    if (editedData.fullName !== originalData.fullName)
      updateData.fullname = editedData.fullName;
    if (editedData.phone !== originalData.phone)
      updateData.phone = editedData.phone;

    // Handle address changes
    const address = {};
    if (editedData.streetAddress !== originalData.streetAddress)
      address.street = editedData.streetAddress;
    if (editedData.city !== originalData.city) address.city = editedData.city;
    if (editedData.state !== originalData.state)
      address.state = editedData.state;
    if (editedData.pincode !== originalData.pincode)
      address.pincode = editedData.pincode;

    if (Object.keys(address).length > 0) updateData.address = address;

    return updateData;
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current user data
        const userResponse = await userService.getCurrentUser();
        if (userResponse.success) {
          const user = userResponse.data;
          setProfileData({
            fullName: user.fullname || user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            streetAddress: user.address?.street || "",
            city: user.address?.city || "",
            state: user.address?.state || "",
            pincode: user.address?.pincode || "",
            profileImage: user.avatar || null,
            memberSince: user.createdAt
              ? new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })
              : "Unknown",
            profileStatus: user.isProfileComplete ? "Complete" : "Incomplete",
          });
        }

        // Fetch financial summary
        const financialResponse = await userService.getFinancialSummary();
        if (financialResponse.success) {
          const financial = financialResponse.data;
          setStatsData([
            {
              title: "Total Revenue",
              value: `₹${(financial.revenue?.total || 0).toLocaleString()}`,
              color: "from-green-400 to-green-600",
              icon: "📈",
            },
            {
              title: "Total Expenditure",
              value: `₹${(financial.expenditure?.total || 0).toLocaleString()}`,
              color: "from-blue-400 to-blue-600",
              icon: "📊",
            },
            {
              title: "Net Profit",
              value: `₹${(
                (financial.revenue?.total || 0) -
                (financial.expenditure?.total || 0)
              ).toLocaleString()}`,
              color: "from-purple-400 to-purple-600",
              icon: "💰",
            },
          ]);
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError(err.message || "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(profileData);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Prepare update data
      const updateData = {
        fullname: editData.fullName,
        phone: editData.phone,
      };

      // Prepare address only if at least one field is filled
      const addressFields = ["streetAddress", "city", "state", "pincode"];
      const address = {};

      addressFields.forEach((field) => {
        if (editData[field]?.trim()) {
          const key = field === "streetAddress" ? "street" : field;
          address[key] = editData[field].trim();
        }
      });

      if (Object.keys(address).length > 0) {
        updateData.address = address;
      }

      // Call backend
      const response = await userService.updateAccountDetails(updateData);

      if (response.success) {
        setProfileData(editData);
        setIsEditing(false);
        alert("Profile updated successfully!");
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditData({ ...editData, profileImage: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#782355]"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <p className="text-red-600">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Profile Content */}
        {!loading && !error && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {statsData.map((stat, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-r ${stat.color} rounded-2xl p-6 text-white`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div className="text-3xl">{stat.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Profile Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Profile Information
                  </h2>
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#782355] text-white px-4 py-2 rounded-lg hover:bg-[#8e2a63] transition-colors duration-200"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleSave}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancel}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Personal Information
                    </h3>
                    <div className="space-y-4">
                      {/* Profile Image */}
                      <div className="flex flex-col items-center mb-6">
                        <div className="relative">
                          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                            {(
                              isEditing
                                ? editData.profileImage
                                : profileData.profileImage
                            ) ? (
                              <img
                                src={
                                  isEditing
                                    ? editData.profileImage
                                    : profileData.profileImage
                                }
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl font-bold text-gray-400">
                                {(isEditing
                                  ? editData.fullName
                                  : profileData.fullName
                                ).charAt(0)}
                              </span>
                            )}
                          </div>
                          {isEditing && (
                            <label className="absolute bottom-0 right-0 bg-[#782355] text-white p-2 rounded-full cursor-pointer hover:bg-[#8e2a63] transition-colors duration-200">
                              <CameraIcon className="h-4 w-4" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.fullName}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                fullName: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#782355] focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900 font-medium">
                            {profileData.fullName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editData.email}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#782355] focus:border-transparent"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            <p className="text-gray-900">{profileData.email}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editData.phone}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#782355] focus:border-transparent"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            <p className="text-gray-900">{profileData.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Address Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.streetAddress}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                streetAddress: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#782355] focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">
                            {profileData.streetAddress}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.city}
                            onChange={(e) =>
                              setEditData({ ...editData, city: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#782355] focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{profileData.city}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.state}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                state: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#782355] focus:border-transparent"
                          />
                        ) : (
                          <p className="text-gray-900">{profileData.state}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pincode
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.pincode}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                pincode: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#782355] focus:border-transparent"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <MapPinIcon className="h-4 w-4 text-gray-400" />
                            <p className="text-gray-900">
                              {profileData.pincode}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Account Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Member Since
                        </label>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-900">
                            {profileData.memberSince}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Profile Status
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-green-600 font-medium">
                            {profileData.profileStatus}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">
                          Profile Completion Tips
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Add a profile picture</li>
                          <li>• Verify your phone number</li>
                          <li>• Complete your business details</li>
                          <li>• Add social media links</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
