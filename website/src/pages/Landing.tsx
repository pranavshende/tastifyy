import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-brand-light font-sans selection:bg-brand-primary selection:text-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 top-0 transition-all duration-300 backdrop-blur-md bg-white/70 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-2xl font-black tracking-tight text-brand-dark">Tastifyy</span>
          </div>
          <div className="hidden md:flex gap-8 items-center font-medium text-gray-600">
            <a href="#features" className="hover:text-brand-primary transition-colors">Features</a>
            <Link to="/customer/login" className="px-5 py-2 rounded-full bg-brand-dark text-white hover:bg-black transition-transform hover:scale-105 active:scale-95 shadow-md">
              Order Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col items-center text-center px-6">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-brand-primary/20 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-brand-secondary/15 rounded-full blur-3xl -z-10 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

        <div className="animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6 max-w-4xl mx-auto">
            Discover. Order. <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
              Enjoy.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Experience the future of food delivery. Whether you're craving your favorite local dish or managing a bustling restaurant, Tastifyy brings it all together seamlessly.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            <Link to="/customer/login" className="px-8 py-4 rounded-2xl bg-brand-primary text-white font-bold text-lg hover:bg-brand-secondary transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-primary/30 flex items-center justify-center gap-2">
              Start Ordering
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link to="/restaurant/login" className="px-8 py-4 rounded-2xl bg-white text-brand-dark font-bold text-lg border border-gray-200 hover:border-brand-primary hover:text-brand-primary transition-all hover:-translate-y-1 hover:shadow-lg flex items-center justify-center">
              Partner Login
            </Link>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full relative z-10 px-4">
          {[
            { title: 'Lightning Fast', desc: 'Real-time order tracking and optimized routing for hot, fresh food.', icon: '🚀' },
            { title: 'Restaurant Hub', desc: 'Powerful dashboard to manage menu, inventory, and analytics.', icon: '📊' },
            { title: 'Secure Payments', desc: 'Integrated Razorpay checkout for seamless and safe transactions.', icon: '🛡️' }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:-translate-y-2 transition-transform duration-300">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-brand-dark mb-2">{feature.title}</h3>
              <p className="text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Admin Footer Access */}
      <footer className="border-t border-gray-100 bg-white/50 backdrop-blur-md py-8 mt-12 text-center">
        <p className="text-gray-400 font-medium mb-4">© 2026 Tastifyy. All rights reserved.</p>
        <Link to="/admin" className="text-sm text-gray-400 hover:text-brand-dark transition-colors font-medium">
          System Administration
        </Link>
      </footer>
    </div>
  );
}
