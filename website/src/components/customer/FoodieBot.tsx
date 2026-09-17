import { useState } from 'react';
import { Bot, Loader2, Plus, Send, ShoppingCart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useCartStore } from '../../store/cartStore';

interface Recommendation {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  is_veg: boolean;
  restaurant: {
    id: string;
    name: string;
    city: string;
    rating: number | null;
    avg_preparation_time_mins?: number;
    logo_url?: string | null;
  };
}

const quickPrompts = ['Pure veg', 'Chicken and biryani', 'Food under ₹200', 'Fast delivery'];

export default function FoodieBot() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [message, setMessage] = useState('Ask me about live Sakoli menus, offers, or food under a budget.');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const addItem = useCartStore(state => state.addItem);

  const ask = async (value = prompt) => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError('');
    setPrompt(trimmed);
    try {
      const response = await api.post('/ai/recommend', { prompt: trimmed });
      setMessage(response.data.data.message);
      setRecommendations(response.data.data.results || []);
    } catch (requestError: any) {
      setRecommendations([]);
      setError(requestError.response?.data?.error?.message || 'Tastifyy AI Assistant is unavailable right now.');
    } finally {
      setLoading(false);
    }
  };

  const addRecommendation = (item: Recommendation) => {
    addItem({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image_url: item.image_url || undefined,
    }, item.restaurant.id);
    setMessage(`Added ${item.name} to your cart.`);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open Tastifyy AI Assistant"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-xl shadow-gray-900/20 transition-transform hover:scale-105"
      >
        <Bot className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gray-900 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary"><Bot className="h-5 w-5" /></div>
              <div>
                <p className="font-black">Tastifyy AI Assistant</p>
                <p className="text-[11px] text-gray-300">Online • EN / MR / HI</p>
              </div>
            </div>
            <button type="button" aria-label="Close Tastifyy AI Assistant" onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>

          <div className="max-h-[55vh] space-y-3 overflow-y-auto p-4">
            <p className="rounded-xl bg-orange-50 p-3 text-sm font-medium text-gray-700">{message}</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map(item => <button key={item} type="button" onClick={() => ask(item)} className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:border-brand-primary hover:text-brand-primary">{item}</button>)}
            </div>
            {loading && <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />Finding live menu items...</div>}
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{error}</p>}
            {recommendations.map(item => (
              <div key={item.id} className="flex gap-3 rounded-xl border border-gray-100 p-2.5">
                {item.image_url ? <img src={item.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-orange-50 text-xl">🍽️</div>}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-gray-900">{item.name}</p>
                  <p className="truncate text-xs text-gray-500">{item.restaurant.name} • {item.restaurant.city}</p>
                  <p className="mt-1 text-sm font-bold text-brand-primary">₹{item.price} {item.restaurant.rating ? `• ${item.restaurant.rating}★` : ''}</p>
                </div>
                <button type="button" aria-label={`Add ${item.name}`} onClick={() => addRecommendation(item)} className="self-center rounded-lg bg-brand-primary p-2 text-white hover:bg-brand-secondary"><Plus className="h-4 w-4" /></button>
              </div>
            ))}
            {recommendations.length > 0 && <Link to="/customer/checkout" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-bold text-white"><ShoppingCart className="h-4 w-4" /> View Cart & Checkout</Link>}
          </div>

          <form onSubmit={event => { event.preventDefault(); ask(); }} className="flex gap-2 border-t border-gray-100 p-3">
            <input value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="Ask about food..." className="min-w-0 flex-1 rounded-xl bg-gray-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30" />
            <button type="submit" aria-label="Send message" disabled={loading} className="rounded-xl bg-brand-primary px-3 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      )}
    </>
  );
}
