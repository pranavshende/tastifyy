import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import api from '../../api/axios';
import Header from '../../components/customer/Header';
import FoodCard from '../../components/customer/FoodCard';
import CustomizationModal from '../../components/customer/CustomizationModal';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import ImageWithFallback from '../../components/ui/ImageWithFallback';
import { Clock, Star } from 'lucide-react';

interface CustomizationOption {
  id: string;
  label: string;
  additional_price: number;
}

interface CustomizationGroup {
  id: string;
  group_name: string;
  is_required: boolean;
  is_multi_select: boolean;
  options: CustomizationOption[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_veg: boolean;
  is_available: boolean;
  is_bestseller?: boolean;
  customizations?: CustomizationGroup[];
}

interface MenuCategory {
  id: string;
  name: string;
  menu_items: MenuItem[];
}

interface Restaurant {
  id: string;
  name: string;
  city: string;
  is_pure_veg: boolean;
  cuisine_tags: string[];
  avg_preparation_time_mins: number;
  cover_image_url?: string;
  logo_url?: string;
  is_open?: boolean; // Defaults to true if missing in some API responses
}

export default function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cart = useCartStore();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Customization State
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data } = await api.get(`/customer/restaurants/${id}/menu`);
        if (data.success) {
          setRestaurant(data.data.restaurant);
          setMenu(data.data.menu);
        } else {
          setError('Failed to fetch menu');
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchMenu();
  }, [id]);

  const handleAddToCart = (item: MenuItem) => {
    if (cart.restaurantId && cart.restaurantId !== id) {
      const confirm = window.confirm("Your cart contains items from another restaurant. Do you want to clear it and add this item?");
      if (!confirm) return;
    }
    
    // Open modal if customizations exist
    if (item.customizations && item.customizations.length > 0) {
      setSelectedItem(item);
      return;
    }
    
    // Add directly if no customizations
    cart.addItem({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image_url: item.image_url
    }, id!);
  };

  const handleCustomizedAddToCart = (itemId: string, selectedOptions: Record<string, string[]>, finalPrice: number) => {
    if (!selectedItem) return;
    
    cart.addItem({
      menu_item_id: itemId,
      name: selectedItem.name,
      price: finalPrice,
      quantity: 1,
      image_url: selectedItem.image_url,
      customizations: selectedOptions // Pass the selected options
    }, id!);
    
    setSelectedItem(null);
  };

  const getCartQuantity = (menuItemId: string) => {
    // If an item has customizations, the cart logic in this MVP is simplified 
    // to just sum up all instances of that item ID.
    const items = cart.items.filter(i => i.menu_item_id === menuItemId);
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col">
        <Header location="Mumbai" showSearch={false} />
        <main className="max-w-3xl mx-auto w-full p-4 sm:p-6">
          <LoadingSkeleton type="restaurant" count={1} className="mb-8" />
          <LoadingSkeleton type="text" count={1} className="w-48 mb-6 h-8" />
          <LoadingSkeleton type="food" count={3} />
        </main>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col">
        <Header location="Mumbai" showSearch={false} />
        <main className="max-w-3xl mx-auto w-full p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
          <EmptyState 
            title="Restaurant not found" 
            description={error || "We couldn't load the details for this restaurant."}
            action={
              <Link to="/customer/restaurants" className="text-brand-primary font-bold hover:underline">
                View other restaurants
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  const totals = cart.getTotals();
  const isOpen = restaurant.is_open !== false; // Default true if missing

  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark flex flex-col pb-32">
      <Header location={restaurant.city} showSearch={false} />
      
      {/* Back nav */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center py-2.5">
          <Link to="/customer/restaurants" className="flex items-center text-sm font-bold text-gray-500 hover:text-brand-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m15 18-6-6 6-6"/></svg>
            Back to Restaurants
          </Link>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 w-full py-4">
        
        {/* Restaurant Hero Card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-10 relative">
          {!isOpen && (
            <div className="absolute top-0 right-0 left-0 bg-gray-900 text-white text-center py-2 font-bold z-10 text-sm">
              Currently Closed. We are not accepting orders right now.
            </div>
          )}
          
          <div className="h-48 sm:h-72 relative bg-gray-100 overflow-hidden">
            <ImageWithFallback 
              src={restaurant.cover_image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&q=80'} 
              alt={restaurant.name}
              fallbackType="restaurant"
              className={!isOpen ? 'grayscale opacity-80' : ''}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
            
            {restaurant.logo_url && (
              <div className="absolute -bottom-6 left-6 w-24 h-24 bg-white rounded-2xl p-1.5 shadow-xl border border-gray-100 z-10 hidden sm:block">
                <ImageWithFallback src={restaurant.logo_url} alt="Logo" className="w-full h-full rounded-xl object-cover" />
              </div>
            )}
          </div>
          
          <div className="pt-4 sm:pt-6 pb-6 px-4 sm:px-6 sm:pl-36">
            <h1 className="text-2xl font-black text-gray-900 mb-1">{restaurant.name}</h1>
            <p className="text-sm text-gray-500 font-medium mb-3">{restaurant.cuisine_tags?.join(', ')}</p>
            
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
              <div className="flex items-center text-gray-900 font-bold">
                <Star className="w-3.5 h-3.5 text-brand-primary fill-brand-primary mr-1.5" />
                4.5 <span className="text-gray-400 font-medium ml-1">(500+ ratings)</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center text-gray-700 font-bold">
                <Clock className="w-3.5 h-3.5 text-brand-primary mr-1.5" />
                {restaurant.avg_preparation_time_mins || 30} mins
              </div>
              
              {restaurant.is_pure_veg && (
                <>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center text-green-700 font-bold bg-green-50 px-2 py-1 rounded-md border border-green-200">
                    <div className="w-2.5 h-2.5 rounded-sm border-2 border-green-600 flex items-center justify-center mr-1">
                      <div className="w-1 h-1 bg-green-600 rounded-full"></div>
                    </div>
                    PURE VEG
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        {menu.length === 0 ? (
          <EmptyState title="Menu not available" description="This restaurant hasn't added any menu items yet." />
        ) : (
          <div className="space-y-10">
            {/* Sticky Category Nav */}
            <div className="sticky top-[110px] z-30 bg-brand-light/95 backdrop-blur-md py-4 -mt-4 mb-4 border-b border-gray-200">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x">
                {menu.map(cat => (
                  <a 
                    key={`nav-${cat.id}`}
                    href={`#category-${cat.id}`} 
                    className="snap-start px-5 py-2.5 bg-white rounded-full font-black text-sm text-gray-700 shadow-sm border border-gray-100 whitespace-nowrap hover:border-brand-primary hover:text-brand-primary transition-colors"
                  >
                    {cat.name}
                  </a>
                ))}
              </div>
            </div>

            {menu.map((category) => (
              <div key={category.id} id={`category-${category.id}`} className="scroll-mt-44">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  {category.name}
                  <span className="text-sm font-bold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                    {category.menu_items.length}
                  </span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.menu_items.map((item) => (
                    <FoodCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      description={item.description}
                      price={Number(item.price)}
                      imageUrl={item.image_url}
                      isVeg={item.is_veg}
                      isBestseller={item.is_bestseller}
                      isAvailable={item.is_available && isOpen}
                      quantity={getCartQuantity(item.id)}
                      onAdd={() => handleAddToCart(item)}
                      onIncrement={() => cart.updateQuantity(item.id, getCartQuantity(item.id) + 1)}
                      onDecrement={() => cart.updateQuantity(item.id, getCartQuantity(item.id) - 1)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals & Overlays */}
      {selectedItem && selectedItem.customizations && (
        <CustomizationModal
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          item={{ id: selectedItem.id, name: selectedItem.name, price: Number(selectedItem.price), is_veg: selectedItem.is_veg }}
          customizationGroups={selectedItem.customizations}
          onAddToCart={handleCustomizedAddToCart}
        />
      )}

      {/* Floating Cart Summary */}
      {cart.items.length > 0 && cart.restaurantId === id && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-100 z-50">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-brand-primary relative">
                <span className="text-lg">🛍️</span>
                <span className="absolute -top-1 -right-1 bg-brand-dark text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {cart.items.reduce((a,c) => a+c.quantity, 0)}
                </span>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Your Cart</p>
                <p className="text-gray-900 font-black text-lg leading-none mt-0.5">₹{totals.itemSubtotal}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/customer/checkout')}
              className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2.5 px-5 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              Checkout <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
