import { Link } from 'react-router-dom';
import { Star, Heart, Clock, Bike } from 'lucide-react';

interface RestaurantCardProps {
  id: string;
  name: string;
  coverImage?: string;
  logo?: string;
  cuisineTags: string[];
  rating?: number;
  prepTime?: number;
  isOpen: boolean;
  isPureVeg: boolean;
  city: string;
  distance?: string;
  reviewsCount?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

export default function RestaurantCard({
  id, name, coverImage, cuisineTags, rating, prepTime, isOpen, isPureVeg, distance, reviewsCount, isFavorite = false, onToggleFavorite
}: RestaurantCardProps) {
  return (
    <Link to={`/customer/restaurants/${id}`} className="group bg-white rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 border border-gray-100/80 flex flex-col cursor-pointer block relative">
      
      {/* Cover Image Area */}
      <div className="relative h-44 w-full overflow-hidden bg-gray-100">
        {coverImage ? (
          <img
            src={coverImage}
            alt={name}
            loading="lazy"
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${!isOpen ? 'grayscale opacity-70' : ''}`}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group-hover:from-orange-50 group-hover:to-orange-100 transition-all ${!isOpen ? 'grayscale opacity-70' : ''}`}>
            <div className="text-center">
              <div className="text-4xl mb-1">🍽️</div>
              <span className="text-xs text-gray-400 font-medium">No photo</span>
            </div>
          </div>
        )}

        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 pointer-events-none"></div>

        {/* Closed Overlay */}
        {!isOpen && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="bg-gray-900/90 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">Currently Closed</span>
          </div>
        )}

        {/* Top Badges & Icons */}
        <div className="absolute top-3 w-full px-3 flex items-start justify-between z-10">
          <div className="flex flex-col gap-2">
            {isPureVeg && (
              <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded border border-green-500/50 flex items-center gap-1.5 shadow-sm">
                <div className="w-2.5 h-2.5 rounded-sm border-2 border-green-600 flex items-center justify-center">
                  <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                </div>
                <span className="text-[9px] font-black text-green-700 uppercase tracking-widest leading-none">Pure Veg</span>
              </div>
            )}
          </div>
          <button 
            onClick={(e) => {
              if (onToggleFavorite) onToggleFavorite(e);
            }}
            className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 shadow-sm transition-all"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>

        {/* Bottom Image Content (Rating Pill) */}
        <div className="absolute bottom-3 left-3 z-10">
           <div className="bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10 shadow-sm">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              {typeof rating === 'number' && <span className="text-xs font-bold leading-none mt-0.5">{rating.toFixed(1)}</span>}
              {reviewsCount && <span className="text-[10px] text-gray-300 font-medium leading-none mt-0.5">({reviewsCount})</span>}
           </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col bg-white">
        <h3 className="text-[17px] font-black text-gray-900 group-hover:text-brand-primary transition-colors truncate mb-0.5 leading-tight">
          {name}
        </h3>
        
        <div className="text-[13px] text-gray-500 font-medium mb-3 truncate">
          {cuisineTags.length > 0 ? cuisineTags.slice(0, 3).join(' • ') : 'Various Cuisines'}
        </div>
        
        <div className="flex items-center gap-4 text-xs font-bold text-gray-600 mt-auto pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{prepTime ? `${prepTime}-${prepTime + 10} min` : '30-40 min'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bike className="w-4 h-4 text-gray-400" />
            <span>{distance || 'Distance unavailable'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
