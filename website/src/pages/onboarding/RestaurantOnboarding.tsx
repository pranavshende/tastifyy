import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

export default function RestaurantOnboarding() {

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    type: 'restaurant',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
    service_radius_km: 5,
    avg_preparation_time_mins: 30,
    is_pure_veg: false,
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Save progress
      await api.post('/onboarding/restaurant', { ...formData, onboarding_step: step + 1 });
      setStep(step + 1);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save progress');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Final save and submit
      await api.post('/onboarding/restaurant', { ...formData, onboarding_step: 'complete' });
      await api.post('/onboarding/restaurant/submit');
      navigate('/onboarding/status');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-black text-brand-dark mb-2">Restaurant Partner Onboarding</h1>
            <p className="text-gray-500">Step {step} of 2</p>
          </div>
          <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
            <span className="text-2xl">🏪</span>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
                  placeholder="e.g., The Spice Grill"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Establishment Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all bg-white"
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="cloud_kitchen">Cloud Kitchen</option>
                  <option value="home_kitchen">Home Kitchen</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all resize-none"
                placeholder="Tell us about your restaurant..."
              />
            </div>

            <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <input
                type="checkbox"
                name="is_pure_veg"
                id="is_pure_veg"
                checked={formData.is_pure_veg}
                onChange={handleChange}
                className="w-5 h-5 text-brand-primary rounded focus:ring-brand-primary"
              />
              <label htmlFor="is_pure_veg" className="text-sm font-semibold text-gray-700 cursor-pointer">
                This is a Pure Vegetarian establishment
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white font-bold py-4 rounded-xl shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Next Step →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Location & Operations</h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                name="address_line"
                required
                value={formData.address_line}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  required
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Radius (km)</label>
                <input
                  type="number"
                  name="service_radius_km"
                  min="1"
                  max="20"
                  value={formData.service_radius_km}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Avg. Prep Time (mins)</label>
                <input
                  type="number"
                  name="avg_preparation_time_mins"
                  min="5"
                  value={formData.avg_preparation_time_mins}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-brand-primary text-white font-bold py-4 rounded-xl shadow-lg hover:-translate-y-1 transition-all disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
