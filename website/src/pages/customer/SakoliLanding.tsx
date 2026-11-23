import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import api from '../../api/axios';
import Header from '../../components/customer/Header';
import SeoMetadata from '../../components/SeoMetadata';
import { restaurantSeoPath } from '../../lib/seo';

interface RestaurantSummary {
  id: string;
  name: string;
  city: string;
  cuisine_tags?: string[];
  is_open?: boolean;
  cover_image_url?: string | null;
}

interface RestaurantsResponse {
  success: boolean;
  data: RestaurantSummary[];
}

const faqs = [
  {
    question: 'How can I explore restaurants in Sakoli on Tastifyy?',
    answer: 'Browse the live restaurant listings on this page and open a restaurant to see its available menu.',
  },
  {
    question: 'Can I check a restaurant menu before placing an order?',
    answer: 'Yes. Restaurant pages show menu items currently available from that restaurant.',
  },
  {
    question: 'Is delivery available at every address in Sakoli?',
    answer: 'Delivery availability depends on the restaurant service area. Tastifyy checks your delivery address during checkout.',
  },
  {
    question: 'How do I know if a restaurant is accepting orders?',
    answer: 'The listing shows the restaurant status returned by Tastifyy. Availability may change, so check the listing and menu before ordering.',
  },
];

export default function SakoliLanding() {
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadRestaurants = async () => {
      try {
        const { data } = await api.get<RestaurantsResponse>('/customer/restaurants');
        const sakoliRestaurants = Array.isArray(data.data)
          ? data.data.filter((restaurant) => /^sakoli(?:\s*,|$)/i.test(restaurant.city?.trim() || ''))
          : [];
        if (active) setRestaurants(sakoliRestaurants);
      } catch (requestError) {
        console.error('Failed to load Sakoli restaurant listings', requestError);
        if (active) setError('Live restaurant listings are temporarily unavailable. Please try again shortly.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadRestaurants();
    return () => {
      active = false;
    };
  }, []);

  const cuisines = Array.from(new Set(restaurants.flatMap((restaurant) => restaurant.cuisine_tags || [])))
    .filter((cuisine) => cuisine.trim().length > 0);

  const faqSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://tastifyy.in/' },
          { '@type': 'ListItem', position: 2, name: 'Food in Sakoli', item: 'https://tastifyy.in/food-delivery-in-sakoli' },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-gray-900 flex flex-col">
      <SeoMetadata
        title="Food Delivery in Sakoli | Restaurants & Menus | Tastifyy"
        description="Discover restaurants in Sakoli, Maharashtra, explore their available menus, and check delivery options for your address with Tastifyy."
        canonicalPath="/food-delivery-in-sakoli"
        noindex={loading || Boolean(error) || restaurants.length === 0}
        structuredData={faqSchema}
      />
      <Header showSearch={false} />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-5">
          <Link to="/" className="hover:text-brand-primary">Home</Link>
          <span className="mx-2">/</span>
          <span aria-current="page">Food in Sakoli</span>
        </nav>

        <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6 sm:p-10 mb-10">
          <p className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary mb-4">
            <MapPin className="w-4 h-4" /> Sakoli, Maharashtra
          </p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 mb-5">
            Discover local food in Sakoli
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl leading-relaxed mb-7">
            Tastifyy helps you find local restaurants, explore the menus they make available, and check ordering options for your delivery address. Browse current Sakoli listings below and open a restaurant for its live menu.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#restaurants" className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 font-bold text-white hover:bg-brand-secondary transition-colors">
              Explore restaurants <ArrowRight className="w-4 h-4" />
            </a>
            <Link to="/customer/home" className="inline-flex items-center rounded-xl border border-gray-200 px-5 py-3 font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              Browse Tastifyy
            </Link>
          </div>
        </section>

        <section id="restaurants" className="scroll-mt-24 mb-12">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black">Restaurants in Sakoli</h2>
              <p className="text-gray-600 mt-1">Listings and menu details are loaded from Tastifyy.</p>
            </div>
            {!loading && restaurants.length > 0 && (
              <span className="text-sm font-bold text-gray-500">{restaurants.length} listed</span>
            )}
          </div>

          {loading ? (
            <p className="rounded-2xl bg-white border border-gray-100 p-6 text-gray-600">Loading current restaurant listings…</p>
          ) : error ? (
            <p role="status" className="rounded-2xl bg-white border border-amber-200 p-6 text-gray-700">{error}</p>
          ) : restaurants.length === 0 ? (
            <p className="rounded-2xl bg-white border border-gray-100 p-6 text-gray-600">
              There are no Sakoli restaurant listings available right now. Please check back later.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  to={restaurantSeoPath(restaurant.name, restaurant.id)}
                  className="group overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  {restaurant.cover_image_url ? (
                    <img
                      src={restaurant.cover_image_url}
                      alt={`${restaurant.name} restaurant`}
                      width="640"
                      height="360"
                      loading="lazy"
                      className="w-full aspect-[16/9] object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-full aspect-[16/9] flex items-center justify-center bg-orange-50 text-4xl" aria-hidden="true">🍽️</div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-black group-hover:text-brand-primary transition-colors">{restaurant.name}</h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${restaurant.is_open ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {restaurant.is_open ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{restaurant.city}</p>
                    {restaurant.cuisine_tags && restaurant.cuisine_tags.length > 0 && (
                      <p className="text-sm text-gray-600 mt-3">{restaurant.cuisine_tags.join(', ')}</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-primary mt-4">
                      View menu <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {cuisines.length > 0 && (
          <section className="rounded-2xl bg-white border border-gray-100 p-6 sm:p-8 mb-10">
            <h2 className="text-xl sm:text-2xl font-black mb-3">Cuisines listed on Tastifyy</h2>
            <p className="text-gray-600 leading-relaxed">
              Current Sakoli restaurant listings include: {cuisines.join(', ')}.
            </p>
          </section>
        )}

        <section className="rounded-2xl bg-white border border-gray-100 p-6 sm:p-8">
          <h2 className="text-2xl font-black mb-5">Frequently asked questions</h2>
          <div className="divide-y divide-gray-100">
            {faqs.map(({ question, answer }) => (
              <details key={question} className="py-4 first:pt-0 last:pb-0">
                <summary className="cursor-pointer font-bold text-gray-900">{question}</summary>
                <p className="text-gray-600 leading-relaxed mt-3">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
