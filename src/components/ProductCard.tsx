import React from 'react';
import { Product } from '../types';
import { Heart, Scale, ArchiveX } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
  onSelectWeight: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavorite,
  onToggleFavorite,
  onSelectWeight
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between text-center relative group">
      
      {/* Top Icons: Wishlist Heart & Badges */}
      <div className="flex items-center justify-between w-full mb-1">
        {/* Wishlist toggle */}
        <button
          type="button"
          onClick={() => onToggleFavorite(product)}
          className={`p-1.5 rounded-full transition cursor-pointer ${
            isFavorite
              ? 'text-red-600 bg-red-50'
              : 'text-gray-400 hover:text-red-600 hover:bg-gray-50'
          }`}
          title="إضافة للمفضلة"
          aria-label="إضافة للمفضلة"
        >
          <Heart className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isFavorite ? 'fill-red-600' : ''}`} />
        </button>

        {/* New Badge */}
        {product.isNew && (
          <span className="bg-[#008080] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            جديد
          </span>
        )}

        {/* Offer Badge */}
        {product.isOffer && (
          <span className="bg-[#c8102e] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
            عرض
          </span>
        )}
      </div>

      {/* Product Image on Yellow Tray / Red Bag */}
      <div className="relative aspect-square w-full max-w-[200px] mx-auto flex items-center justify-center my-2">
        <img
          src={product.img}
          alt={product.name}
          className={`max-w-full max-h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-300 ${
            !product.isAvailable ? 'opacity-65 filter grayscale-[20%]' : ''
          }`}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/products/whole-chicken.png';
          }}
        />

        {/* Out of stock overlay badge on the image */}
        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-[#333d47]/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md">
              نفد المخزون
            </span>
          </div>
        )}
      </div>

      {/* Info: Name, Base Weight, Price */}
      <div className="mt-1 mb-3 space-y-1">
        <h3 className="font-extrabold text-gray-900 text-sm sm:text-base leading-snug group-hover:text-[#c8102e] transition">
          {product.name}
        </h3>
        
        <p className="text-xs text-gray-400 font-medium">
          {product.baseWeight}
        </p>

        <div className="text-base sm:text-lg font-black text-[#c8102e] pt-0.5">
          من {product.priceFormatted} <span className="text-xs font-bold text-gray-600">د.ب</span>
        </div>
      </div>

      {/* Bottom Action Button (Select Weight or Out of Stock) */}
      <div>
        {product.isAvailable ? (
          <button
            type="button"
            onClick={() => onSelectWeight(product)}
            className="w-full py-2.5 px-3 bg-[#c8102e] hover:bg-[#a60b24] text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-md"
          >
            <Scale className="w-4 h-4" />
            <span>اختر الوزن</span>
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full py-2.5 px-3 bg-[#e5e7eb] text-gray-500 rounded-xl font-bold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <ArchiveX className="w-4 h-4" />
            <span>نفد المخزون</span>
          </button>
        )}
      </div>

    </div>
  );
};
