
import Header from '../../components/customer/Header';
import { Logo } from '../../components/ui/Logo';

export default function About() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col pb-24">
      <Header />
      
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          <div className="flex justify-center mb-8">
            <Logo size="xl" showText={false} />
          </div>
          
          <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">About Tastifyy</h1>
          <p className="text-xl text-brand-primary font-bold mb-8">Good Food • Happier You</p>
          
          <div className="space-y-6 text-gray-600 font-medium text-lg leading-relaxed text-left">
            <p>
              Tastifyy is Sakoli's premier food delivery platform, connecting hungry customers with the best local restaurants. We believe that good food brings people together and makes everyday life a little bit happier.
            </p>
            <p>
              Our mission is to provide a seamless, lightning-fast delivery experience while supporting local businesses and delivery partners in our community. We exclusively serve the Sakoli region, ensuring our operations are fine-tuned to your neighborhood's needs.
            </p>
            <p>
              Whether you're craving a late-night biryani, a quick burger, or a wholesome thali, Tastifyy is here to deliver happiness right to your doorstep.
            </p>
          </div>
          
          <hr className="my-10 border-gray-100" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
             <div>
               <h4 className="font-black text-gray-900 text-2xl mb-1">100+</h4>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Restaurants</p>
             </div>
             <div>
               <h4 className="font-black text-gray-900 text-2xl mb-1">Sakoli</h4>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Exclusively</p>
             </div>
             <div>
               <h4 className="font-black text-gray-900 text-2xl mb-1">&lt;30m</h4>
               <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Fast Delivery</p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
