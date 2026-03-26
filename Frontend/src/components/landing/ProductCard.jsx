import React, { useState, useEffect, useMemo } from "react";
import {
  EyeIcon,
  TagIcon,
  MapPinIcon,
  CalendarIcon,
  HeartIcon as HeartOutline,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import PlaceholderImage from "../common/PlaceholderImage";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

/**
 * ProductCard — Vite-safe + normalized image handling
 */

// Vite: use import.meta.env.VITE_API_BASE_URL, fallback to localhost for dev
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
  "http://localhost:5001";

const ProductCard = ({ product, onViewDetails }) => {
  const [imgSrc, setImgSrc] = useState(null);

  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  // destructure safely
  const {
    id,
    _id,
    title,
    productTitle,
    description,
    price,
    productCategory,
    condition,
    location,
    yearOfManufacture,
    brand,
    imageDetails,
    imageUrls,
    imageUrl,
    image,
    photo,
    soldCount,
    viewCount,
    likesCount: initialLikesCount,
  } = product || {};

  const [localLikesCount, setLocalLikesCount] = useState(initialLikesCount || 0);

  const productId = _id || id;
  const isWishlisted = isInWishlist(productId);

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please login to add to wishlist");
      return;
    }

    const res = await toggleWishlist(productId);
    if (res.success) {
      setLocalLikesCount(prev => res.isWishlisted ? prev + 1 : Math.max(0, prev - 1));
      toast.success(res.isWishlisted ? "Added to wishlist" : "Removed from wishlist");
    } else {
      toast.error(res.message);
    }
  };

  // 1. Define fallbacks and normalization logic first
  const fallbackPlaceholder = useMemo(() => {
    const seed = (productCategory || "product")
      .replace(/\s+/g, "_")
      .toLowerCase();
    return `https://picsum.photos/seed/${seed}_fallback/800/600`;
  }, [productCategory]);

  // Normalize a single candidate (string or object) to a usable URL or null
  const normalizeSingle = (candidate) => {
    if (!candidate) return null;

    // string candidate
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (!trimmed) return null;
      // full url or data url -> return as-is
      if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed))
        return trimmed;
      // relative path (strip leading slashes and prepend base)
      const rel = trimmed.replace(/^\/+/, "");
      return `${API_BASE_URL}/${rel}`;
    }

    // object candidate: try common fields
    if (typeof candidate === "object") {
      const url =
        candidate.url || candidate.src || candidate.path || candidate.filename;
      if (typeof url === "string" && url.trim()) return normalizeSingle(url);
      // nested structures (CMS)
      if (candidate?.fields?.file?.url)
        return normalizeSingle(candidate.fields.file.url);
    }

    return null;
  };

  // Choose best image from all known shapes
  const normalizeImageSrc = () => {
    // 1. imageDetails array (preferred primary)
    if (Array.isArray(imageDetails) && imageDetails.length) {
      const primary = imageDetails.find(
        (i) => i?.isPrimary && (i?.url || i?.path || i?.src),
      );
      if (primary) {
        const s = normalizeSingle(
          primary.url ?? primary.path ?? primary.src ?? primary,
        );
        if (s) return s;
      }
      for (const it of imageDetails) {
        const s = normalizeSingle(it?.url ?? it?.path ?? it?.src ?? it);
        if (s) return s;
      }
    }

    // 2. imageUrls array
    if (Array.isArray(imageUrls) && imageUrls.length) {
      for (const it of imageUrls) {
        const s = normalizeSingle(it);
        if (s) return s;
      }
    }

    // 3. imageUrl (string/object)
    if (imageUrl) {
      const s = normalizeSingle(imageUrl);
      if (s) return s;
    }

    // 4. direct 'image' field (string)
    if (image) {
      const s = normalizeSingle(image);
      if (s) return s;
    }

    // 5. generic images array (common) - safe access
    const productImages = product?.images || [];
    if (Array.isArray(productImages) && productImages.length) {
      for (const it of productImages) {
        const s = normalizeSingle(it);
        if (s) return s;
      }
    }

    // 6. other fallbacks
    if (photo) {
      const s = normalizeSingle(photo);
      if (s) return s;
    }

    return null;
  };

  const primaryImage = useMemo(
    () => normalizeImageSrc(),
    [
      imageDetails,
      imageUrls,
      imageUrl,
      image,
      product?.images,
      photo,
      product?.id,
      product?._id,
    ],
  );

  // 2. Preload and set imgSrc accordingly
  useEffect(() => {
    const srcToTest = primaryImage || fallbackPlaceholder;

    if (!srcToTest) {
      setImgSrc(fallbackPlaceholder);
      return;
    }

    let mounted = true;
    const img = new Image();
    try {
      img.crossOrigin = "anonymous";
    } catch (err) { }

    img.onload = () => {
      if (!mounted) return;
      setImgSrc(srcToTest);
    };

    img.onerror = () => {
      if (!mounted) return;
      setImgSrc(fallbackPlaceholder);
    };

    img.src = srcToTest;

    return () => {
      mounted = false;
      img.onload = null;
      img.onerror = null;
    };
  }, [primaryImage, fallbackPlaceholder, product?.id, product?._id]);


  const titleText =
    productTitle || title || product?.name || "Untitled product";

  // Normalize location (many possible shapes)
  let locationText = "Unknown location";
  if (product?.location) {
    if (typeof product.location === "string") locationText = product.location;
    else
      locationText =
        product.location.address ??
        product.locationAddr ??
        product.location.addressLine ??
        locationText;
  }
  locationText =
    locationText || product?.address || product?.loc || "Unknown location";

  // Normalize seller name
  const sellerName =
    product?.sellerName ??
    product?.seller ??
    product?.userName ??
    (product?.userId && typeof product.userId === "object"
      ? (product.userId.name ?? product.userId.username ?? product.userId.$oid)
      : null) ??
    (typeof product.userId === "string" ? product.userId : null) ??
    "Unknown seller";

  const conditionClasses =
    condition === "New"
      ? "bg-green-100 text-green-800"
      : condition === "Used"
        ? "bg-yellow-100 text-yellow-800"
        : condition === "Refurbished"
          ? "bg-blue-100 text-blue-800"
          : "bg-gray-100 text-gray-800";

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100 relative">
      {/* IMAGE AREA */}
      <div className="relative overflow-hidden bg-gray-50 border-b border-gray-100">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={titleText}
            decoding="async"
            loading="lazy"
            crossOrigin="anonymous"
            className="w-full h-52 md:h-60 object-contain transition-transform duration-500 group-hover:scale-105 min-h-[160px] bg-white mix-blend-multiply"
            style={{ display: "block" }}
            onError={(e) => {
              console.warn("IMG element onError for", e?.target?.src);
              e.currentTarget.onerror = null;
              setImgSrc(fallbackPlaceholder);
              setImageStatus("failed");
            }}
          />
        ) : (
          <div className="w-full h-48 md:h-56 bg-gray-100 flex items-center justify-center">
            {PlaceholderImage ? (
              <PlaceholderImage
                className="w-full h-full object-cover"
                category={productCategory}
              />
            ) : (
              <img
                src={fallbackPlaceholder}
                alt="placeholder"
                className="w-full h-52 md:h-60 object-cover"
                decoding="async"
                loading="lazy"
              />
            )}
          </div>
        )}


        {/* ACTIONS (TOP RIGHT) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 transform hover:scale-110 active:scale-95 ${isWishlisted
              ? 'bg-red-50 text-red-500 shadow-md'
              : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white'
              }`}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isWishlisted ? (
              <HeartSolid className="h-5 w-5 animate-pulse" />
            ) : (
              <HeartOutline className="h-5 w-5" />
            )}
          </button>

          {/* Quick View Button */}
          <button
            onClick={() => onViewDetails?.(product)}
            className="bg-white/90 backdrop-blur-sm text-[#782355] p-2 rounded-full hover:bg-white transition-colors duration-200 shadow-sm"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Condition Badge */}
        {condition && (
          <div className="absolute bottom-3 left-3 z-20">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${conditionClasses}`}
            >
              {condition}
            </span>
          </div>
        )}

      </div>

      {/* CONTENT */}
      <div className="p-4 md:p-5">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <div className="flex items-center">
            <TagIcon className="h-3 w-3 mr-1" />
            {productCategory}
          </div>
          <div className="flex items-center max-w-[50%] truncate">
            <MapPinIcon className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 text-sm md:text-base mb-2 line-clamp-2 group-hover:text-[#782355] transition-colors duration-200">
          {titleText}
        </h3>

        {(brand || yearOfManufacture) && (
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            {brand && <span>{brand}</span>}
            {yearOfManufacture && (
              <span className="flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {yearOfManufacture}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-xl font-bold text-[#782355]">
              ₹{Number(price || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {(soldCount !== undefined || viewCount !== undefined || localLikesCount !== undefined) && (
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-3">
            <div className="flex gap-3">
              <span>{viewCount ?? 0} views</span>
              <span className="flex items-center gap-1">
                <HeartSolid className={`h-3 w-3 ${localLikesCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                {localLikesCount ?? 0}
              </span>
            </div>
            <span>{soldCount ?? 0} sold</span>
          </div>
        )}

        <div className="text-xs text-gray-500 mb-3">
          Sold by: <span className="font-medium">{sellerName}</span>
        </div>

        <button
          onClick={() => onViewDetails?.(product)}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 md:py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg transform active:scale-[0.98]"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
