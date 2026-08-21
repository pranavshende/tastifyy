import { Link } from 'react-router-dom';
import { ChefHat, Bike, Search, CheckCircle, Clock } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark selection:bg-brand-primary selection:text-white flex flex-col">
      {/* 1. Navbar */}
      <nav className="fixed w-full z-50 top-0 transition-all duration-300 backdrop-blur-md bg-white/80 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <span className="text-white font-black text-lg">T</span>
            </div>
            <span className="text-2xl font-black tracking-tight text-brand-dark">Tastifyy</span>
          </div>
          <div className="hidden md:flex gap-8 items-center font-medium text-gray-600">
            <a href="#how-it-works" className="hover:text-brand-primary transition-colors">How it works</a>
            <Link to="/customer/login" className="px-5 py-2 rounded-full bg-brand-dark text-white hover:bg-black transition-transform hover:-translate-y-0.5 shadow-md font-bold">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 mt-20">
        {/* 2. Hero Section */}
        <section className="relative pt-20 pb-28 flex flex-col items-center text-center px-6 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-100 rounded-full blur-3xl -z-10 opacity-60"></div>
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-rose-50 rounded-full blur-3xl -z-10 opacity-60"></div>

          <div className="animate-fade-in-up max-w-4xl mx-auto z-10">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6 text-gray-900">
              Discover. Order. <span className="text-brand-primary">Enjoy.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
              Discover great food from restaurants around you and get it delivered to your doorstep in minutes.
            </p>

            <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-8">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Navigation (Dev Mode)</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Customer */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                  <h3 className="font-black text-gray-900 mb-3">Customer</h3>
                  <div className="flex gap-2 w-full">
                    <Link to="/customer/login" className="flex-1 text-center py-2 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-brand-secondary transition-colors">Login</Link>
                  </div>
                </div>

                {/* Restaurant */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                  <h3 className="font-black text-gray-900 mb-3 flex items-center gap-1"><ChefHat className="w-4 h-4" /> Partner</h3>
                  <div className="flex gap-2 w-full">
                    <Link to="/restaurant/login" className="flex-1 text-center py-2 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-colors">Login</Link>
                    <Link to="/restaurant" className="flex-1 text-center py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors">Signup</Link>
                  </div>
                </div>

                {/* Delivery */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                  <h3 className="font-black text-gray-900 mb-3 flex items-center gap-1"><Bike className="w-4 h-4" /> Rider</h3>
                  <div className="flex gap-2 w-full">
                    <Link to="/delivery/login" className="flex-1 text-center py-2 bg-orange-100 text-orange-700 text-sm font-bold rounded-xl hover:bg-orange-200 transition-colors">Login / Join</Link>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Link to="/admin" className="text-sm font-bold text-gray-500 hover:text-brand-primary transition-colors underline decoration-dotted">
                  Go to Admin Console
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How It Works */}
        <section id="how-it-works" className="py-24 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">How Tastifyy Works</h2>
              <p className="text-gray-500 text-lg">Your favorite food is just three steps away.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
              
              {[
                { step: '01', title: 'Discover', desc: 'Find restaurants and dishes around your location.', icon: <Search className="w-8 h-8 text-brand-primary" /> },
                { step: '02', title: 'Order', desc: 'Customize your food and securely checkout.', icon: <CheckCircle className="w-8 h-8 text-brand-primary" /> },
                { step: '03', title: 'Enjoy', desc: 'Track your order in real-time until delivery.', icon: <Clock className="w-8 h-8 text-brand-primary" /> }
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-24 h-24 bg-white rounded-3xl shadow-card border border-gray-100 flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <div className="text-brand-primary font-black text-sm tracking-widest mb-2">STEP {item.step}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Popular Categories */}
        <section className="py-24 bg-brand-light">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 text-center">Popular Categories</h2>
            
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {['Biryani', 'Pizza', 'Burgers', 'Chinese', 'South Indian', 'Desserts', 'Drinks'].map((cat, i) => (
                <Link key={i} to="/customer/restaurants" className="bg-white px-8 py-4 rounded-2xl shadow-sm border border-gray-100 font-bold text-gray-700 hover:text-brand-primary hover:border-brand-primary hover:shadow-md transition-all flex items-center gap-3">
                  <span>🍽️</span> {cat}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 5. CTA Sections (Restaurant + Delivery) */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Restaurant CTA */}
            <div className="bg-gray-900 rounded-3xl p-10 md:p-14 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <ChefHat className="w-12 h-12 text-brand-primary mb-6" />
                <h3 className="text-3xl font-black mb-4">Grow your restaurant with Tastifyy.</h3>
                <p className="text-gray-400 mb-8 text-lg">Reach more customers, increase your sales, and manage orders effortlessly with our partner tools.</p>
                <Link to="/restaurant" className="inline-flex px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white font-bold transition-colors">
                  Become a Restaurant Partner
                </Link>
              </div>
            </div>

            {/* Delivery CTA */}
            <div className="bg-orange-50 rounded-3xl p-10 md:p-14 text-gray-900 border border-orange-100 relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-200/50 rounded-full blur-3xl transition-transform group-hover:scale-110"></div>
              <div className="relative z-10">
                <Bike className="w-12 h-12 text-brand-primary mb-6" />
                <h3 className="text-3xl font-black mb-4">Want to earn with Tastifyy?</h3>
                <p className="text-gray-600 mb-8 text-lg">Enjoy flexible timings, earn per delivery, and become a part of your city's fastest delivery fleet.</p>
                <Link to="/onboarding/delivery" className="inline-flex px-6 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold transition-colors">
                  Become a Delivery Partner
                </Link>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-brand-dark flex items-center justify-center">
                <span className="text-white font-black text-lg">T</span>
              </div>
              <span className="text-xl font-black tracking-tight text-gray-900">Tastifyy</span>
            </div>
            <p className="text-gray-500 text-sm">Discover. Order. Enjoy.</p>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="#" className="hover:text-brand-primary transition-colors">About Us</Link></li>
              <li><Link to="#" className="hover:text-brand-primary transition-colors">Contact</Link></li>
              <li><Link to="#" className="hover:text-brand-primary transition-colors">Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="#" className="hover:text-brand-primary transition-colors">Terms & Conditions</Link></li>
              <li><Link to="#" className="hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Partner</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/restaurant" className="hover:text-brand-primary transition-colors">Restaurant Partner</Link></li>
              <li><Link to="/onboarding/delivery" className="hover:text-brand-primary transition-colors">Delivery Partner</Link></li>
              <li><Link to="/admin" className="text-gray-300 hover:text-brand-primary transition-colors mt-4 block">Admin Login</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Tastifyy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
