import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Wallet, Clock, CheckCircle2, TrendingUp, AlertCircle, Receipt } from 'lucide-react';

export default function Transactions() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get('/orders/restaurant/transactions');
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError('Failed to fetch transactions');
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl font-bold border border-red-100 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" /> {error || 'Failed to load data'}
        </div>
      </div>
    );
  }

  const { total_earnings, pending_payout, total_completed_orders, transactions } = data;

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide pb-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Transactions & Payouts</h1>
          <p className="text-gray-500 font-medium text-sm mt-0.5">Track your earnings and payment status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 shrink-0">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center">
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center mr-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Earnings</p>
            <p className="text-2xl font-black text-gray-900 leading-none">₹{total_earnings.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center">
          <div className="w-12 h-12 bg-orange-50 text-brand-primary rounded-xl flex items-center justify-center mr-4">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Payout</p>
            <p className="text-2xl font-black text-gray-900 leading-none">₹{pending_payout.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex items-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mr-4">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Completed Orders</p>
            <p className="text-2xl font-black text-gray-900 leading-none">{total_completed_orders}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-bold text-gray-900 flex items-center text-sm">
            <Wallet className="w-4 h-4 mr-2 text-brand-primary" /> Transaction History
          </h2>
        </div>
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-64">
              <Receipt className="w-12 h-12 text-gray-300 mb-4" />
              <p className="font-bold text-gray-700">No transactions yet</p>
              <p className="text-sm mt-1">Completed orders will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4 text-right">Order Value</th>
                  <th className="px-6 py-4 text-right">Your Earnings</th>
                  <th className="px-6 py-4 text-center">Payout Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-600">
                      {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      #{tx.id.split('-')[0].toUpperCase()}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {tx.customer_name || 'Guest'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-600">
                      ₹{tx.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-brand-primary">
                      ₹{tx.earnings.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {tx.is_paid_to_restaurant ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
