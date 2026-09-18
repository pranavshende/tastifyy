import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { TrendingUp, Package, DollarSign, Clock, Star, ChevronRight } from 'lucide-react';

interface EarningsData {
  today: { earnings: number; deliveries: number };
  week: { earnings: number; deliveries: number };
  month: { earnings: number; deliveries: number };
  allTime: { earnings: number; deliveries: number };
  chartData: { date: string; earnings: number; deliveries: number }[];
}

interface Assignment {
  id: string;
  earning_amount: number;
  payout_status: string;
  updated_at: string;
  order: {
    id: string;
    restaurant: { name: string; city: string };
    delivery_address: { address_line: string; city: string };
  };
}

function MiniBarChart({ data }: { data: { date: string; earnings: number }[] }) {
  const max = Math.max(...data.map(d => d.earnings), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-brand-primary/20 rounded-t-sm transition-all duration-500"
            style={{ height: `${Math.max(4, (d.earnings / max) * 100)}%`, background: d.earnings > 0 ? 'rgb(255,87,34)' : 'rgb(229,231,235)' }}
          />
        </div>
      ))}
    </div>
  );
}

export default function DeliveryEarnings() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [history, setHistory] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  useEffect(() => {
    api.get('/delivery/earnings').then(({ data }) => {
      if (data.success) setEarnings(data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setHistoryLoading(true);
    api.get(`/delivery/orders/history?page=${historyPage}`).then(({ data }) => {
      if (data.success) {
        setHistory(data.data);
        setHistoryTotal(data.total);
      }
    }).catch(console.error).finally(() => setHistoryLoading(false));
  }, [historyPage]);

  const payoutBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Earnings</h1>
        <p className="text-gray-500 font-medium mt-1">Track your income and delivery history</p>
      </div>

      {/* KPI Cards */}
      {earnings && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Today's Earnings", value: `₹${earnings.today.earnings.toFixed(0)}`, sub: `${earnings.today.deliveries} deliveries`, icon: <DollarSign className="w-5 h-5" />, color: 'bg-green-500' },
            { label: "This Week", value: `₹${earnings.week.earnings.toFixed(0)}`, sub: `${earnings.week.deliveries} deliveries`, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-blue-500' },
            { label: "This Month", value: `₹${earnings.month.earnings.toFixed(0)}`, sub: `${earnings.month.deliveries} deliveries`, icon: <Package className="w-5 h-5" />, color: 'bg-purple-500' },
            { label: "All Time", value: `₹${earnings.allTime.earnings.toFixed(0)}`, sub: `${earnings.allTime.deliveries} total`, icon: <Star className="w-5 h-5" />, color: 'bg-orange-500' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 ${kpi.color} text-white rounded-xl flex items-center justify-center mb-3`}>
                {kpi.icon}
              </div>
              <p className="text-2xl font-black text-gray-900">{kpi.value}</p>
              <p className="text-sm font-bold text-gray-400 mt-1">{kpi.label}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* 7-Day Chart */}
      {earnings && earnings.chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-black text-gray-900 mb-1">7-Day Earnings</h2>
          <p className="text-sm text-gray-400 font-medium mb-6">Your daily earnings this week</p>
          <MiniBarChart data={earnings.chartData} />
          <div className="flex justify-between mt-2">
            {earnings.chartData.map((d, i) => (
              <span key={i} className="text-xs text-gray-400 font-medium flex-1 text-center">
                {new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Delivery History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-black text-gray-900">Delivery History</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">{historyTotal} completed deliveries</p>
        </div>

        {historyLoading ? (
          <div className="p-6 space-y-4 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-400">No deliveries yet</p>
            <p className="text-sm text-gray-300 mt-1">Complete your first delivery to see history here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map(a => (
              <div key={a.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{a.order.restaurant.name}</p>
                  <p className="text-sm text-gray-500 font-medium truncate">{a.order.delivery_address.city}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(a.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-gray-900">₹{Number(a.earning_amount || 0).toFixed(0)}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${payoutBadge(a.payout_status || 'pending')}`}>
                    {a.payout_status || 'pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {historyTotal > 20 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm disabled:opacity-40">
              Previous
            </button>
            <span className="text-sm text-gray-500 font-medium">Page {historyPage}</span>
            <button onClick={() => setHistoryPage(p => p + 1)} disabled={history.length < 20}
              className="px-4 py-2 bg-brand-primary text-white rounded-xl font-bold text-sm flex items-center gap-1 disabled:opacity-40">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
