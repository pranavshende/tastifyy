import { Plus, Minus } from 'lucide-react';
import ImageWithFallback from '../ui/ImageWithFallback';

interface FoodCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  isBestseller?: boolean;
  isAvailable?: boolean;
  quantity?: number;
  onAdd?: (id: string) => void;
  onIncrement?: (id: string) => void;
  onDecrement?: (id: string) => void;
}

export default function FoodCard({
  id, name, description, price, imageUrl, isVeg, isBestseller, isAvailable = true,
  quantity = 0, onAdd, onIncrement, onDecrement
}: FoodCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-4 flex gap-4 border border-gray-100 shadow-sm transition-all hover:shadow-card ${!isAvailable ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {/* Veg/Non-veg indicator */}
            <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
            </div>
            
            {isBestseller && (
              <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-sm tracking-wider uppercase">
                Bestseller
              </span>
            )}
          </div>
          
          <h4 className="font-bold text-gray-900 text-base leading-tight mb-1">{name}</h4>
          <div className="font-bold text-brand-dark mb-2">₹{price}</div>
          
          {description && (
            <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Image & Controls */}
      <div className="relative flex flex-col items-center">
        {imageUrl ? (
          <div className="w-32 h-32 rounded-xl overflow-hidden shadow-sm bg-gray-100 flex-shrink-0">
            <ImageWithFallback src={imageUrl} alt={name} fallbackType="food" />
          </div>
        ) : (
          <div className="w-32 h-32 rounded-xl overflow-hidden shadow-sm bg-gray-50 flex items-center justify-center border border-gray-100 flex-shrink-0">
            <span className="text-3xl opacity-20">🍽️</span>
          </div>
        )}

        {/* Add/Qty Button overlapping the image */}
        <div className="absolute -bottom-3 w-24">
          {!isAvailable ? (
            <div className="bg-white border border-gray-200 text-gray-400 font-bold text-xs py-1.5 rounded-lg text-center shadow-sm w-full">
              Out of stock
            </div>
          ) : quantity > 0 ? (
            <div className="flex items-center justify-between bg-white border border-brand-primary text-brand-primary rounded-lg shadow-sm w-full overflow-hidden">
              <button 
                onClick={() => onDecrement?.(id)}
                className="w-1/3 py-1.5 flex justify-center hover:bg-orange-50 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-1/3 text-center font-bold text-sm">{quantity}</span>
              <button 
                onClick={() => onIncrement?.(id)}
                className="w-1/3 py-1.5 flex justify-center hover:bg-orange-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onAdd?.(id)}
              className="w-full bg-white text-brand-primary border border-brand-primary hover:bg-orange-50 font-black text-sm py-1.5 rounded-lg shadow-sm transition-colors"
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
