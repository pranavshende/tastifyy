import { useState } from 'react';
import { Bot, Loader2, Plus, Send, ShoppingCart, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useCartStore } from '../../store/cartStore';
import { getStorageUrl } from '../../lib/supabase';

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
  const addItem = useCartStore((state) => state.addItem);

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
      setError(
        requestError.response?.data?.error?.message ||
          'Tastifyy AI Assistant is unavailable right now.'
      );
    } finally {
      setLoading(false);
    }
  };

  const addRecommendation = (item: Recommendation) => {
    addItem(
      {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image_url: item.image_url || undefined,
      },
      item.restaurant.id
    );
    setMessage(`Added ${item.name} to your cart.`);
  };

  return (
    <>
      {/* Floating AI Button: positioned safely above mobile bottom navigation bar */}
      <div className="fixed bottom-24 sm:bottom-28 md:bottom-8 right-4 sm:right-6 z-[80] group flex items-center gap-3">
        {/* Desktop Tooltip */}
        <div className="hidden md:block absolute right-16 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
          Ask FoodieBot AI
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
        </div>

        {/* Trigger Button with pulsing glow and badge */}
        <button
          type="button"
          aria-label="Open Tastifyy AI Assistant"
          onClick={() => setOpen((prev) => !prev)}
          className="relative flex h-14 w-14 sm:h-15 sm:w-15 items-center justify-center rounded-full bg-gradient-to-tr from-brand-primary to-orange-500 text-white shadow-[0_8px_25px_rgba(255,91,51,0.5)] hover:shadow-[0_10px_30px_rgba(255,91,51,0.65)] transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white"
        >
          {/* Subtle pulse animation */}
          <span className="absolute inset-0 rounded-full bg-brand-primary animate-ping opacity-30"></span>

          <Bot className="relative h-7 w-7" />

          {/* AI Sparkle Pill Badge */}
          <span className="absolute -top-1 -right-1 bg-gray-900 text-[10px] text-amber-300 font-black px-1.5 py-0.5 rounded-full border border-amber-300/40 shadow-sm flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            <span>AI</span>
          </span>
        </button>
      </div>

      {/* Chatbot Window */}
      {open && (
        <div className="fixed bottom-[110px] md:bottom-24 right-2 sm:right-6 z-[85] flex w-[min(400px,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-100 bg-white shadow-2xl animate-in slide-in-from-bottom-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between bg-gradient-to-r from-gray-950 to-gray-900 px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-primary to-orange-500 shadow-md">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-black text-sm tracking-tight">Tastifyy AI</p>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">EN / MR / HI Assistant</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close Tastifyy AI Assistant"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chat / Recommendation Body */}
          <div className="max-h-[50vh] sm:max-h-[55vh] space-y-3 overflow-y-auto p-3.5 sm:p-4">
            <p className="rounded-xl bg-orange-50/80 border border-orange-100 p-3 text-xs sm:text-sm font-medium text-gray-800">
              {message}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => ask(item)}
                  className="rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1 text-xs font-bold text-gray-700 hover:border-brand-primary hover:text-brand-primary hover:bg-white transition-all"
                >
                  {item}
                </button>
              ))}
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
                Finding live menu items...
              </div>
            )}

            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
                {error}
              </p>
            )}

            {recommendations.map((item) => {
              const imgUrl = getStorageUrl(item.image_url);
              return (
                <div
                  key={item.id}
                  className="flex gap-2.5 rounded-xl border border-gray-100 p-2.5 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all"
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={item.name}
                      className="h-14 w-14 rounded-lg object-cover bg-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xl">
                      🍽️
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-xs sm:text-sm text-gray-900 leading-tight">
                      {item.name}
                    </p>
                    <p className="truncate text-[11px] text-gray-500 mt-0.5">
                      {item.restaurant.name}
                    </p>
                    <p className="mt-1 text-xs font-black text-brand-primary">
                      ₹{item.price}{' '}
                      {item.restaurant.rating ? (
                        <span className="text-gray-400 font-normal">
                          • {item.restaurant.rating}★
                        </span>
                      ) : (
                        ''
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Add ${item.name}`}
                    onClick={() => addRecommendation(item)}
                    className="self-center rounded-lg bg-brand-primary p-1.5 text-white hover:bg-brand-secondary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {recommendations.length > 0 && (
              <Link
                to="/customer/checkout"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 text-xs font-bold text-white shadow-md hover:bg-black transition-colors"
              >
                <ShoppingCart className="h-4 w-4" /> View Cart & Checkout
              </Link>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask();
            }}
            className="flex gap-2 border-t border-gray-100 p-2.5 sm:p-3 bg-white"
          >
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask about food, cravings, budget..."
              className="min-w-0 flex-1 rounded-xl bg-gray-100 px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 text-gray-900 placeholder-gray-400"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={loading}
              className="rounded-xl bg-brand-primary px-3 text-white disabled:opacity-50 hover:bg-brand-secondary transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
