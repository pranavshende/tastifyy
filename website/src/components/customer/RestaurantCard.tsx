import { Link } from 'react-router-dom';

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
}

export default function RestaurantCard({
  id, name, coverImage, cuisineTags, rating, prepTime, isOpen, isPureVeg
}: RestaurantCardProps) {
  const defaultImage = `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80`;

  return (
    <Link to={`/customer/restaurants/${id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-card transition-all duration-300 border border-gray-100 flex flex-col cursor-pointer block relative">
      
      {/* Cover Image (16:9 ratio approximately) */}
      <div className="relative h-40 w-full overflow-hidden bg-gray-100">
        <img 
          src={coverImage || defaultImage} 
          alt={name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isOpen ? 'grayscale opacity-70' : ''}`}
        />

        {!isOpen && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">Currently Closed</span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isPureVeg && (
            <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-green-500 flex items-center gap-1.5 self-start">
              <div className="w-2.5 h-2.5 rounded-sm border-2 border-green-600 flex items-center justify-center">
                <div className="w-1 h-1 bg-green-600 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Pure Veg</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-1 gap-2">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-primary transition-colors truncate">
            {name}
          </h3>
          <div className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-[13px] font-bold shrink-0">
            {rating ? rating.toFixed(1) : '4.2'}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 font-medium mb-1 truncate">
          {cuisineTags.length > 0 ? cuisineTags.slice(0, 3).join(' • ') : 'Various Cuisines'}
        </div>
        
        <div className="text-xs text-gray-500 font-medium mt-1">
          {prepTime ? `${prepTime}-${prepTime + 10} mins` : '30-40 mins'} • ₹₹
        </div>
      </div>
    </Link>
  );
}

