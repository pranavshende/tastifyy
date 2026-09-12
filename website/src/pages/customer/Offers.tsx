
import Header from '../../components/customer/Header';
import { ArrowRight, Tag, Percent, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Offers() {
  const offers = [
    { 
      id: 1, 
      title: '50% OFF up to ₹200', 
      subtitle: 'Valid on your first order. Use code TASTY50.', 
      code: 'TASTY50',
      gradient: 'from-[#FF4112] to-[#FF7B33]',
      icon: <Percent className="w-8 h-8 text-white/90" />
    },
    { 
      id: 2, 
      title: 'FREE DELIVERY', 
      subtitle: 'On orders above ₹199. Auto-applied at checkout.', 
      code: null,
      gradient: 'from-[#171717] to-[#2D2D2D]',
      icon: <Clock className="w-8 h-8 text-white/90" />
    },
    { 
      id: 3, 
      title: 'Flat 20% OFF', 
      subtitle: 'On select restaurants. Up to ₹100.', 
      code: 'FLAT20',
      gradient: 'from-[#23C16B] to-[#148F4D]',
      icon: <Tag className="w-8 h-8 text-white/90" />
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col pb-24">
      <Header />
      
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">Exclusive Offers</h1>
        <p className="text-gray-500 mb-8 font-medium">Save big on your favorite meals with these deals</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div key={offer.id} className={`bg-gradient-to-br ${offer.gradient} rounded-3xl p-6 sm:p-8 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group`}>
              {/* Decoration */}
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="mb-4">
                  {offer.icon}
                </div>
                <h3 className="text-3xl font-black mb-2 tracking-tight">{offer.title}</h3>
                <p className="text-white/80 font-medium mb-6 leading-relaxed">
                  {offer.subtitle}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  {offer.code ? (
                    <div className="bg-white/20 px-4 py-2 rounded-xl border border-white/30 backdrop-blur-sm">
                      <span className="font-mono font-bold tracking-widest text-white">{offer.code}</span>
                    </div>
                  ) : (
                    <div className="bg-white/10 px-4 py-2 rounded-xl">
                      <span className="font-bold text-white/90">Auto Applied</span>
                    </div>
                  )}
                  <Link to="/customer/restaurants" className="bg-white text-gray-900 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                    Order Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
