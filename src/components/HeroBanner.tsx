import React from 'react';
import { ArrowLeft, Truck } from 'lucide-react';

interface HeroBannerProps {
  onShopClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopClick }) => {
  return (
    <div className="relative overflow-hidden select-none bg-[#b91921] text-white" dir="rtl">
      {/* Authentic Original Delmon Poultry Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16 min-h-[380px] sm:min-h-[420px] flex items-center justify-between">
        
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 z-10">
          
          {/* Right Column: Original Delmon Headlines & CTA (Matching image_8208254b.png) */}
          <div className="flex-1 text-right space-y-4 sm:space-y-6">
            
            {/* Pill Badge: 🍃 طازج */}
            <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-xs text-white text-xs sm:text-sm font-bold px-3.5 py-1 rounded-full border border-white/10 shadow-xs">
              <span className="text-emerald-300">🍃</span>
              <span>طازج</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
              دجاج المزرعة من دلمون
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-2xl font-bold text-white/95 leading-relaxed max-w-xl">
              يصل إلى بابك في البحرين
            </p>

            {/* Action Row: Delivery Text & Dark Shop Button */}
            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6">
              
              {/* Dark Charcoal/Slate CTA Button (Exact match: تسوق الآن ←) */}
              <button
                onClick={onShopClick}
                className="bg-[#2d3748] hover:bg-[#1a202c] active:scale-95 text-white px-7 py-3 sm:py-3.5 rounded-full font-black text-sm sm:text-base shadow-xl transition transform hover:scale-105 flex items-center gap-2.5 cursor-pointer"
              >
                <span>تسوق الآن</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Delivery info */}
              <div className="flex items-center gap-2 text-white/95 text-xs sm:text-sm font-bold">
                <span>توصيل لجميع مناطق البحرين</span>
                <Truck className="w-4 h-4 text-white" />
              </div>

            </div>

          </div>

          {/* Left Column: Authentic Delmon Whole Chicken Bag Image */}
          <div className="w-full md:w-auto flex justify-center items-center shrink-0">
            <div className="relative w-56 h-72 sm:w-80 sm:h-96 flex items-center justify-center">
              <img
                src="/assets/products/whole-chicken.png"
                alt="دجاج المزرعة من دلمون - دجاج طازج"
                className="w-full h-full object-contain drop-shadow-[0_25px_30px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/image_fbf04509.png';
                }}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
