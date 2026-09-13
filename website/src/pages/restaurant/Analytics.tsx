import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { TrendingUp, Package, DollarSign, Calendar, Award } from 'lucide-react';

interface AnalyticsData {
  kpis: {
    today_revenue: number;
    today_orders: number;
    week_orders: number;
    month_revenue: number;
  };
  chartData: { date: string; revenue: number; orders: number }[];
  topItems: { name: string; sold: number }[];
}

function SvgLineChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (!data || data.length === 0) return <div className="h-40 flex items-center justify-center text-gray-300 text-sm font-medium">No data yet</div>;

  const max = Math.max(...data.map(d => d.revenue), 1);
  const width = 100;
  const height = 60;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.revenue / max) * (height - 4);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(255,87,34)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(255,87,34)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="rgb(255,87,34)" strokeWidth="1.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
        <polygon fill="url(#revGrad)" points={`0,${height} ${points} ${width},${height}`} />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * width;
          const y = height - (d.revenue / max) * (height - 4);
          return <circle key={i} cx={x} cy={y} r="1.5" fill="rgb(255,87,34)" />;
        })}
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <span key={i} className="text-xs text-gray-400 font-medium flex-1 text-center">
            {new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RestaurantAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/restaurant').then(({ data: res }) => {
      if (res.success) setData(res.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-200 rounded-2xl" />)}
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <p className="font-medium">Failed to load analytics. Please refresh.</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-gray-500 font-medium mt-1">Your restaurant's performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Revenue", value: `₹${data.kpis.today_revenue.toFixed(0)}`, sub: `${data.kpis.today_orders} orders`, icon: <DollarSign className="w-5 h-5" />, color: 'bg-green-500' },
          { label: "This Week", value: `${data.kpis.week_orders}`, sub: 'orders delivered', icon: <Package className="w-5 h-5" />, color: 'bg-blue-500' },
          { label: "Month Revenue", value: `₹${data.kpis.month_revenue.toFixed(0)}`, sub: 'last 30 days', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-purple-500' },
          { label: "Today's Orders", value: `${data.kpis.today_orders}`, sub: 'delivered today', icon: <Calendar className="w-5 h-5" />, color: 'bg-orange-500' },
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

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-black text-gray-900 mb-1">Revenue This Week</h2>
        <p className="text-sm text-gray-400 font-medium mb-6">Daily revenue from delivered orders</p>
        <SvgLineChart data={data.chartData} />
      </div>

      {/* Top Items */}
      {data.topItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <Award className="w-5 h-5 text-brand-primary" />
            <div>
              <h2 className="font-black text-gray-900">Top Selling Items</h2>
              <p className="text-sm text-gray-400 font-medium">Last 30 days</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {data.topItems.map((item, i) => {
              const maxSold = data.topItems[0]?.sold || 1;
              return (
                <div key={i} className="p-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary font-black flex items-center justify-center text-sm shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{item.name}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-brand-primary rounded-full transition-all duration-700"
                        style={{ width: `${(item.sold / maxSold) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-black text-gray-900 shrink-0">{item.sold} sold</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
