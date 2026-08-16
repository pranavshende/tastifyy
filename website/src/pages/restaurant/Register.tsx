import React, { useState } from 'react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

export default function RestaurantRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', type: 'restaurant', owner_name: '', phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/restaurants', formData);
      alert('Restaurant Registered! (Awaiting Admin Approval)');
      navigate('/restaurant/dashboard');
    } catch (err) {
      alert('Failed to register restaurant');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#E86A22]">Partner with Tastifyy</h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
              <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E86A22] focus:border-[#E86A22]" onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Owner Name</label>
              <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E86A22] focus:border-[#E86A22]" onChange={(e) => setFormData({...formData, owner_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E86A22] focus:border-[#E86A22]" onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#E86A22] hover:bg-[#d55e1a] focus:outline-none">
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
