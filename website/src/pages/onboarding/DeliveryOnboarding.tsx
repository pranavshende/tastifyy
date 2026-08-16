import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function DeliveryOnboarding() {

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    vehicle_type: 'bike',
    vehicle_number: '',
    vehicle_model: '',
    license_number: '',
    bank_account_number: '',
    ifsc_code: '',
    upi_id: '',
    availability_type: 'full_time',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/onboarding/delivery', { ...formData, onboarding_step: step + 1 });
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
      await api.post('/onboarding/delivery', { ...formData, onboarding_step: 'complete' });
      await api.post('/onboarding/delivery/submit');
      navigate('/onboarding/status');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12">
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-black text-brand-dark mb-2">Delivery Partner Onboarding</h1>
            <p className="text-gray-500">Step {step} of 2</p>
          </div>
          <div className="w-16 h-16 bg-brand-secondary/10 rounded-full flex items-center justify-center">
            <span className="text-2xl">🛵</span>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Vehicle & License Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type</label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all bg-white"
                >
                  <option value="bike">Bike / Motorcycle</option>
                  <option value="scooter">Scooter</option>
                  <option value="bicycle">Bicycle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Model</label>
                <input
                  type="text"
                  name="vehicle_model"
                  required
                  value={formData.vehicle_model}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
                  placeholder="e.g., Honda Activa"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Number</label>
                <input
                  type="text"
                  name="vehicle_number"
                  required
                  value={formData.vehicle_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all uppercase"
                  placeholder="e.g., MH 12 AB 1234"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Driving License No.</label>
                <input
                  type="text"
                  name="license_number"
                  required
                  value={formData.license_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all uppercase"
                  placeholder="Enter DL Number"
                />
              </div>
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
            <h3 className="text-xl font-bold text-gray-800">Payout & Work Preferences</h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Work Type</label>
              <select
                name="availability_type"
                value={formData.availability_type}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all bg-white"
              >
                <option value="full_time">Full-Time (Flexible Hours)</option>
                <option value="part_time">Part-Time (Specific Shifts)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Account Number</label>
                <input
                  type="text"
                  name="bank_account_number"
                  required
                  value={formData.bank_account_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">IFSC Code</label>
                <input
                  type="text"
                  name="ifsc_code"
                  required
                  value={formData.ifsc_code}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">UPI ID (Optional)</label>
              <input
                type="text"
                name="upi_id"
                value={formData.upi_id}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none transition-all"
                placeholder="yourname@bank"
              />
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
