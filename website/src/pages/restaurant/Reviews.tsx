import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Star, User, MessageSquare } from 'lucide-react';

interface Rating {
  id: string;
  food_rating: number;
  restaurant_rating: number;
  delivery_rating: number | null;
  review_text: string | null;
  created_at: string;
  customer: { name: string; profile_photo_url: string | null };
}

interface ReviewsData {
  ratings: Rating[];
  avg: { food: number; restaurant: number; delivery: number | null } | null;
  total: number;
}

function StarRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-gray-500 w-24 shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(s => (
          <Star key={s} className={`w-4 h-4 ${s <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
        ))}
      </div>
      <span className="font-black text-gray-900">{value.toFixed(1)}</span>
    </div>
  );
}

export default function RestaurantReviews() {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/menu/info').then(({ data: infoRes }) => {
      if (infoRes.success) {
        const id = infoRes.data.restaurant_id;
        return api.get(`/reviews/restaurant/${id}`);
      }
    }).then((res: any) => {
      if (res?.data.success) setData(res.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-gray-200 rounded-2xl" />
      {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Customer Reviews</h1>
        <p className="text-gray-500 font-medium mt-1">{data?.total || 0} reviews from your customers</p>
      </div>

      {/* Average Ratings */}
      {data?.avg && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-black text-gray-900 mb-5">Average Ratings</h2>
          <div className="space-y-3">
            <StarRow label="Food Quality" value={data.avg.food} />
            <StarRow label="Restaurant" value={data.avg.restaurant} />
            {data.avg.delivery !== null && <StarRow label="Delivery" value={data.avg.delivery} />}
          </div>
        </div>
      )}

      {/* Individual Reviews */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-brand-primary" />
          <h2 className="font-black text-gray-900">All Reviews</h2>
        </div>

        {!data || data.ratings.length === 0 ? (
          <div className="p-12 text-center">
            <Star className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-400">No reviews yet</p>
            <p className="text-sm text-gray-300 mt-1">Reviews appear here after customers rate their delivered orders</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.ratings.map(r => (
              <div key={r.id} className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black shrink-0">
                    {r.customer.profile_photo_url ? (
                      <img src={r.customer.profile_photo_url} alt={r.customer.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-bold text-gray-900">{r.customer.name}</h4>
                      <span className="text-xs text-gray-400 font-medium">
                        {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {/* Star ratings compact */}
                    <div className="flex gap-3 mt-2 flex-wrap">
                      <span className="text-xs bg-yellow-50 text-yellow-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400" /> {r.food_rating} Food
                      </span>
                      <span className="text-xs bg-orange-50 text-orange-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-orange-400" /> {r.restaurant_rating} Restaurant
                      </span>
                      {r.delivery_rating && (
                        <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-blue-400" /> {r.delivery_rating} Delivery
                        </span>
                      )}
                    </div>
                    {r.review_text && (
                      <p className="mt-3 text-sm text-gray-600 font-medium leading-relaxed bg-gray-50 p-3 rounded-xl">
                        "{r.review_text}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
