import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeftIcon,
  PhotoIcon,
  XMarkIcon,
  PlusIcon,
  MapPinIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/landing/Navbar';
import Footer from '../components/landing/Footer';
import productService from '../services/productService';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAP_TOKEN;

const AddItemPage = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    productTitle: '',
    productCategory: '',
    productDescription: '',
    price: '',
    quantity: 1,
    condition: 'New',
    yearOfManufacture: '',
    brand: '',
    model: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    weight: '',
    material: '',
    color: '',
    originalPackaging: false,
    manualIncluded: false,
    workingConditionDescription: '',
    location: {
      address: '',
      lat: '',
      lng: ''
    },
    deliveryAvailable: false,
    deliveryFee: 0,
    tags: [],
    contactPreferences: {
      allowMessages: true,
      allowCalls: true,
      showPhone: false
    }
  });

  const [images, setImages] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  // Mapbox refs
  const mapContainer = useRef(null);
  const map = useRef(null);
  const geocoder = useRef(null);

  const categories = [
    "Cars", "Properties", "Mobiles", "Jobs", "Bikes", 
    "Electronics & Appliances", "Commercial Vehicles & Spares", 
    "Furniture", "Fashion", "Books, Sports & Hobbies", "Pets", "Services"
  ];

  const conditions = ["New", "Used", "Refurbished"];

  // Form validation functions
  const validateStep1 = () => {
    const errors = {};
    if (!formData.productTitle.trim()) {
      errors.productTitle = 'Product title is required';
    }
    if (!formData.productCategory) {
      errors.productCategory = 'Category is required';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = 'Valid price is required';
    }
    return errors;
  };

  const validateStep2 = () => {
    const errors = {};
    // Step 2 validation is optional, just warnings
    return errors;
  };

  const validateStep3 = () => {
    const errors = {};
    if (!formData.location.address.trim()) {
      errors.location = 'Location is required';
    }
    if (images.length === 0) {
      errors.images = 'At least one image is required';
    }
    return errors;
  };

  const validateStep4 = () => {
    const errors = {};
    // Step 4 validation - everything should be valid by now
    // Re-validate all previous steps
    const step1Errors = validateStep1();
    const step3Errors = validateStep3();
    
    return { ...step1Errors, ...step3Errors };
  };

  const validateCurrentStep = () => {
    let errors = {};
    switch (currentStep) {
      case 1:
        errors = validateStep1();
        break;
      case 2:
        errors = validateStep2();
        break;
      case 3:
        errors = validateStep3();
        break;
      case 4:
        errors = validateStep4();
        break;
      default:
        break;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Initialize Mapbox map
  useEffect(() => {
    if (showLocationModal && mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [77.2090, 28.6139], // Default to Delhi
        zoom: 10
      });

      // Add geocoder
      geocoder.current = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: true,
        placeholder: 'Search for a location'
      });

      map.current.addControl(geocoder.current);

      // Handle location selection
      geocoder.current.on('result', (e) => {
        const { place_name, center } = e.result;
        setFormData(prev => ({
          ...prev,
          location: {
            address: place_name,
            lng: center[0],
            lat: center[1]
          }
        }));
      });

      // Handle map click
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        
        // Reverse geocoding to get address
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`)
          .then(response => response.json())
          .then(data => {
            const address = data.features[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setFormData(prev => ({
              ...prev,
              location: {
                address,
                lng,
                lat
              }
            }));
          });
      });
    }
  }, [showLocationModal]);

  const openLocationModal = () => {
    setShowLocationModal(true);
  };

  const closeLocationModal = () => {
    setShowLocationModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, {
          file,
          preview: event.target.result,
          isPrimary: prev.length === 0
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const nextStep = () => {
    console.log('Validating step', currentStep);
    const isValid = validateCurrentStep();
    console.log('Validation result:', isValid);
    console.log('Form errors:', formErrors);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      console.log('Validation failed, not proceeding to next step');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setFormErrors({}); // Clear errors when going back
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only submit on step 4 and after validation
    if (currentStep !== 4) {
      return;
    }
    
    // Final validation
    if (!validateCurrentStep()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!formData.productTitle || !formData.productCategory || !formData.price) {
        throw new Error('Please fill in all required fields');
      }

      if (!formData.location.address) {
        throw new Error('Please provide a location address');
      }

      // Prepare form data for submission
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        yearOfManufacture: formData.yearOfManufacture ? parseInt(formData.yearOfManufacture) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        deliveryFee: parseFloat(formData.deliveryFee),
        images: images.map(img => img.file)
      };

      console.log('Submitting product:', submitData);
      
      // Submit to backend
      const response = await productService.createProduct(submitData);
      
      console.log('Product created successfully:', response);
      
      // Show success message
      alert('Product added successfully!');
      
      // Navigate back to listings
      navigate('/dashboard/listings');
    } catch (error) {
      console.error('Error submitting product:', error);
      alert(error.message || 'Failed to add product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
      
      {/* Product Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Title *
        </label>
        <input
          type="text"
          name="productTitle"
          value={formData.productTitle}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent ${
            formErrors.productTitle ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter product title"
          required
        />
        {formErrors.productTitle && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            {formErrors.productTitle}
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          name="productCategory"
          value={formData.productCategory}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent ${
            formErrors.productCategory ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        {formErrors.productCategory && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            {formErrors.productCategory}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="productDescription"
          value={formData.productDescription}
          onChange={handleInputChange}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent"
          placeholder="Describe your product..."
        />
      </div>

      {/* Price and Quantity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (₹) *
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent ${
              formErrors.price ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
            min="0"
            required
          />
          {formErrors.price && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {formErrors.price}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent"
            placeholder="1"
            min="0"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Condition
        </label>
        <div className="grid grid-cols-3 gap-3">
          {conditions.map(condition => (
            <label key={condition} className="relative">
              <input
                type="radio"
                name="condition"
                value={condition}
                checked={formData.condition === condition}
                onChange={handleInputChange}
                className="sr-only"
              />
              <div className={`p-3 border-2 rounded-xl text-center cursor-pointer transition-all duration-200 ${
                formData.condition === condition
                  ? 'border-[#782355] bg-[#782355] text-white'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}>
                {condition}
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Details</h2>
      
      {/* Brand and Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand
          </label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent"
            placeholder="Enter brand name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model
          </label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent"
            placeholder="Enter model"
          />
        </div>
      </div>

      {/* Year of Manufacture */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Year of Manufacture
        </label>
        <input
          type="number"
          name="yearOfManufacture"
          value={formData.yearOfManufacture}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent"
          placeholder="2024"
          min="1900"
          max={new Date().getFullYear() + 1}
        />
      </div>

      {/* Dimensions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dimensions (cm)
        </label>
        <div className="grid grid-cols-3 gap-3">
          <input
            type="number"
            name="dimensions.length"
            value={formData.dimensions.length}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent"
            placeholder="Length"
            min="0"
          />
          <input
            type="number"
            name="dimensions.width"
            value={formData.dimensions.width}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent"
            placeholder="Width"
            min="0"
          />
          <input
            type="number"
            name="dimensions.height"
            value={formData.dimensions.height}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent"
            placeholder="Height"
            min="0"
          />
        </div>
      </div>

      {/* Weight, Material, Color */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg)
          </label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent"
            placeholder="0"
            min="0"
            step="0.1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Material
          </label>
          <input
            type="text"
            name="material"
            value={formData.material}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent"
            placeholder="e.g., Plastic, Metal"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent"
            placeholder="Enter color"
          />
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="originalPackaging"
            checked={formData.originalPackaging}
            onChange={handleInputChange}
            className="w-4 h-4 text-[#782355] border-gray-300 rounded focus:ring-[#782355]"
          />
          <label className="ml-2 text-sm text-gray-700">
            Original packaging available
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="manualIncluded"
            checked={formData.manualIncluded}
            onChange={handleInputChange}
            className="w-4 h-4 text-[#782355] border-gray-300 rounded focus:ring-[#782355]"
          />
          <label className="ml-2 text-sm text-gray-700">
            Manual/instructions included
          </label>
        </div>
      </div>

      {/* Working Condition Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Working Condition Description
        </label>
        <textarea
          name="workingConditionDescription"
          value={formData.workingConditionDescription}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent"
          placeholder="Describe the working condition..."
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Images & Location</h2>
      
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Images *
        </label>
        <div className={`border-2 border-dashed rounded-xl p-6 text-center ${
          formErrors.images ? 'border-red-500 bg-red-50' : 'border-gray-300'
        }`}>
          <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Upload up to 10 images</p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="bg-[#782355] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#8e2a63] transition-colors duration-200"
          >
            Choose Images
          </label>
        </div>
        
        {formErrors.images && (
          <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            {formErrors.images}
          </p>
        )}
        
        {/* Image Preview */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPrimaryImage(index)}
                  className={`absolute bottom-1 left-1 px-2 py-1 text-xs rounded ${
                    image.isPrimary 
                      ? 'bg-[#782355] text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {image.isPrimary ? 'Primary' : 'Set Primary'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location *
        </label>
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              name="location.address"
              value={formData.location.address}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 pl-10 border rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent ${
                formErrors.location ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your location"
              required
            />
            <MapPinIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          </div>
          
          <button
            type="button"
            onClick={openLocationModal}
            className="w-full bg-blue-50 text-blue-700 py-3 px-4 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <MapPinIcon className="h-5 w-5" />
            Select Location on Map
          </button>
          
          {formErrors.location && (
            <p className="text-red-500 text-sm flex items-center gap-2">
              <ExclamationTriangleIcon className="h-4 w-4" />
              {formErrors.location}
            </p>
          )}
          
          {formData.location.lat && formData.location.lng && (
            <p className="text-sm text-green-600">
              ✅ Location selected: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
            </p>
          )}
        </div>
      </div>

      {/* Delivery Options */}
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="deliveryAvailable"
            checked={formData.deliveryAvailable}
            onChange={handleInputChange}
            className="w-4 h-4 text-[#782355] border-gray-300 rounded focus:ring-[#782355]"
          />
          <label className="ml-2 text-sm text-gray-700">
            Delivery available
          </label>
        </div>
        {formData.deliveryAvailable && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Fee (₹)
            </label>
            <input
              type="number"
              name="deliveryFee"
              value={formData.deliveryFee}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#782355] focus:border-transparent"
              placeholder="0"
              min="0"
            />
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags (for better searchability)
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-[#782355] bg-opacity-10 text-[#782355] px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="text-[#782355] hover:text-red-500"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#782355] focus:border-transparent"
            placeholder="Add a tag"
          />
          <button
            onClick={addTag}
            className="bg-[#782355] text-white px-4 py-2 rounded-lg hover:bg-[#8e2a63] transition-colors duration-200"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Preferences</h2>
      
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Allow Messages</h3>
              <p className="text-sm text-gray-600">Buyers can send you messages about this item</p>
            </div>
            <input
              type="checkbox"
              name="contactPreferences.allowMessages"
              checked={formData.contactPreferences.allowMessages}
              onChange={handleInputChange}
              className="w-4 h-4 text-[#782355] border-gray-300 rounded focus:ring-[#782355]"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Allow Phone Calls</h3>
              <p className="text-sm text-gray-600">Buyers can call you about this item</p>
            </div>
            <input
              type="checkbox"
              name="contactPreferences.allowCalls"
              checked={formData.contactPreferences.allowCalls}
              onChange={handleInputChange}
              className="w-4 h-4 text-[#782355] border-gray-300 rounded focus:ring-[#782355]"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Show Phone Number</h3>
              <p className="text-sm text-gray-600">Display your phone number publicly</p>
            </div>
            <input
              type="checkbox"
              name="contactPreferences.showPhone"
              checked={formData.contactPreferences.showPhone}
              onChange={handleInputChange}
              className="w-4 h-4 text-[#782355] border-gray-300 rounded focus:ring-[#782355]"
            />
          </div>
        </div>
      </div>
      
      {/* Review Section */}
      <div className="bg-blue-50 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-2">Review Your Listing</h3>
            <p className="text-sm text-blue-700">
              Please review all the information before publishing your listing. You can edit it later from your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
  

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

          {/* Mobile: compact progress */}
          <div className="flex sm:hidden items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-[#782355] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-[#782355] whitespace-nowrap">
              Step {currentStep} of 4 &ndash;{' '}
              {currentStep === 1 && 'Basic Info'}
              {currentStep === 2 && 'Details'}
              {currentStep === 3 && 'Images & Location'}
              {currentStep === 4 && 'Contact & Review'}
            </span>
          </div>

          {/* Desktop: full step dots */}
          <div className="hidden sm:flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-[#782355] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                <span className={`ml-2 text-sm ${
                  step <= currentStep ? 'text-[#782355]' : 'text-gray-600'
                }`}>
                  {step === 1 && 'Basic Info'}
                  {step === 2 && 'Details'}
                  {step === 3 && 'Images & Location'}
                  {step === 4 && 'Contact & Review'}
                </span>
                {step < 4 && (
                  <div className={`w-16 h-px mx-4 ${
                    step < currentStep ? 'bg-[#782355]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-xl font-medium transition-colors duration-200 ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-[#782355] text-white rounded-xl font-medium hover:bg-[#8e2a63] transition-colors duration-200"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 rounded-xl font-medium transition-colors duration-200 ${
                    isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-[#782355] text-white hover:bg-[#8e2a63]'
                  }`}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Listing'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Select Location</h3>
              <button
                onClick={closeLocationModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div
                ref={mapContainer}
                className="w-full h-96 rounded-xl"
                style={{ minHeight: '400px' }}
              />
              
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Search for a location or click on the map to select
                </div>
                <button
                  onClick={closeLocationModal}
                  className="bg-[#782355] text-white px-6 py-2 rounded-lg hover:bg-[#8e2a63] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default AddItemPage;
