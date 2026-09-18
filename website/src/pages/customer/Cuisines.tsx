
import Header from '../../components/customer/Header';

export default function Cuisines() {
  const cuisines = [
    { name: 'North Indian', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=300&auto=format&fit=crop' },
    { name: 'Chinese', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=300&auto=format&fit=crop' },
    { name: 'Pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=300&auto=format&fit=crop' },
    { name: 'Biryani', image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=300&auto=format&fit=crop' },
    { name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300&auto=format&fit=crop' },
    { name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=300&auto=format&fit=crop' },
    { name: 'Snacks', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=300&auto=format&fit=crop' },
    { name: 'Healthy', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=300&auto=format&fit=crop' },
    { name: 'Beverages', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=300&auto=format&fit=crop' },
    { name: 'Seafood', image: 'https://images.unsplash.com/photo-1615141982883-c7da0e698cb0?q=80&w=300&auto=format&fit=crop' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col pb-24">
      <Header />
      
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">Explore Cuisines</h1>
        <p className="text-gray-500 mb-8 font-medium">Discover top-rated dishes from your favorite cuisines</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {cuisines.map((cat, idx) => (
            <a 
              key={idx} 
              href={`/customer/restaurants?category=${cat.name}`}
              className="group flex flex-col items-center bg-white p-4 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-brand-primary/20"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-4 shadow-sm group-hover:shadow-lg transition-shadow duration-300">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <span className="font-bold text-gray-800 group-hover:text-brand-primary transition-colors text-lg text-center">{cat.name}</span>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
