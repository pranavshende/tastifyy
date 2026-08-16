import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

export default function StatusScreen() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('loading');
  const [reason] = useState<string>('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const endpoint = user?.role === 'restaurant_partner' 
          ? '/onboarding/restaurant/status' 
          : '/onboarding/delivery/status'; // To be implemented on backend

        const res = await api.get(endpoint);
        if (res.data.data) {
          setStatus(res.data.data.status);
          if (res.data.data.status === 'active') {
            // If approved, redirect to dashboard
            navigate(`/${user?.role === 'restaurant_partner' ? 'restaurant' : 'delivery'}/dashboard`);
          }
        }
      } catch (err) {
        setStatus('error');
      }
    };

    fetchStatus();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="animate-pulse text-brand-primary font-bold">Checking application status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
        
        {status === 'pending' && (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⏳</span>
            </div>
            <h1 className="text-2xl font-black text-brand-dark mb-4">Application Under Review</h1>
            <p className="text-gray-500 mb-8">
              Your application has been submitted successfully and is currently being reviewed by our team. We will notify you once it is approved.
            </p>
          </>
        )}

        {status === 'rejected' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h1 className="text-2xl font-black text-brand-dark mb-4">Application Rejected</h1>
            <p className="text-gray-500 mb-4">
              Unfortunately, your application was not approved.
            </p>
            {reason && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-8 text-left">
                <strong>Reason:</strong> {reason}
              </div>
            )}
          </>
        )}

        {status === 'suspended' && (
          <>
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-black text-brand-dark mb-4">Account Suspended</h1>
            <p className="text-gray-500 mb-8">
              Your partner account is currently suspended. Please contact support for more details.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-2xl font-black text-brand-dark mb-4">Oops!</h1>
            <p className="text-gray-500 mb-8">We couldn't load your application status. Please try again later.</p>
          </>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
