
import Header from '../../components/customer/Header';
import { Logo } from '../../components/ui/Logo';
import CompanyAttribution from '../../components/ui/CompanyAttribution';

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
          <p className="text-xl text-brand-primary font-bold mb-8">Local Food. Real Flavours.</p>
          
          <div className="space-y-6 text-gray-600 font-medium text-lg leading-relaxed text-left">
            <p>
              Tastifyy is a food discovery, ordering, and delivery platform that connects customers with local restaurants.
            </p>
            <CompanyAttribution className="text-sm font-semibold text-gray-600" />
          </div>
        </div>
      </main>
    </div>
  );
}
