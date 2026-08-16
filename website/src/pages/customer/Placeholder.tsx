import { Link } from 'react-router-dom';

export default function CustomerPlaceholder() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-lg w-full text-center border-t-4 border-blue-600">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome, Customer!</h1>
        <p className="text-gray-600 mb-6 text-lg">
          The full Customer Web Portal (including restaurants, cart, and checkout) is currently under development.
        </p>
        <p className="text-gray-500 mb-8">
          For the complete Tastifyy experience right now, please use our Mobile App!
        </p>
        
        <Link to="/" className="inline-block bg-blue-600 text-white font-semibold py-3 px-8 rounded-md hover:bg-blue-700 transition">
          Back to Portal
        </Link>
      </div>
    </div>
  );
}
