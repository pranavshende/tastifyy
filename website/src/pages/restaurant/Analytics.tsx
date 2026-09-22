import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
  TrendingUp, Package, DollarSign, Calendar, Award,
  ChevronDown, ChevronUp, ArrowUpDown
} from 'lucide-react';

type Period = 'today' | 'yesterday' | '7d' | '30d' | 'custom';

interface MenuItem {
  menu_item_id: string;
  name: string;
  units_sold: number;
  gross_revenue: number;
  discount_share: number;
  net_revenue: number;
  contribution_pct: number;
}

interface AnalyticsData {
  period: { from: string; to: string };
  kpis: {
    range_revenue: number;
    range_orders: number;
    range_net_revenue: number;
    range_discounts: number;
    range_commission: number;
    range_aov: number;
    range_items_sold: number;
    today_revenue: number;
    today_orders: number;
    week_orders: number;
    month_revenue: number;
    month_orders: number;
    total_sales: number;
    total_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    pending_orders: number;
  };
  chartData: { date: string; revenue: number; net_revenue: number; orders: number }[];
  menuItemEarnings: MenuItem[];
}

type SortKey = 'name' | 'units_sold' | 'gross_revenue' | 'net_revenue' | 'contribution_pct';

// ─── Chart ────────────────────────────────────────────────────────────────────
function AreaChart({ data }: { data: { date: string; revenue: number; net_revenue: number }[] }) {
  if (!data || data.length === 0)
    return <div className="h-52 flex items-center justify-center text-gray-300 text-sm font-medium">No data for this period</div>;

  const max = Math.max(...data.map(d => d.revenue), 1);
  const W = 100, H = 60;

  const toPath = (vals: number[]) =>
    vals.map((v, i) => `${(i / Math.max(vals.length - 1, 1)) * W},${H - (v / max) * (H - 4)}`).join(' ');

  const revenues = data.map(d => d.revenue);
  const nets = data.map(d => d.net_revenue);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52" preserveAspectRatio="none">
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(249,115,22)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(249,115,22)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(34,197,94)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="rgb(34,197,94)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Net revenue area */}
        <polygon fill="url(#netGrad)" points={`0,${H} ${toPath(nets)} ${W},${H}`} />
        <polyline fill="none" stroke="rgb(34,197,94)" strokeWidth="1.2" points={toPath(nets)} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2,2" />
        {/* Gross revenue area */}
        <polygon fill="url(#revGrad)" points={`0,${H} ${toPath(revenues)} ${W},${H}`} />
        <polyline fill="none" stroke="rgb(249,115,22)" strokeWidth="1.5" points={toPath(revenues)} strokeLinecap="round" strokeLinejoin="round" />
        {revenues.map((v, i) => {
          const x = (i / Math.max(revenues.length - 1, 1)) * W;
          const y = H - (v / max) * (H - 4);
          return <circle key={i} cx={x} cy={y} r="1.5" fill="rgb(249,115,22)" />;
        })}
      </svg>
      {/* X-axis labels */}
      <div className="flex justify-between mt-1 overflow-hidden">
        {data
          .filter((_, i) => i % Math.max(1, Math.floor(data.length / 7)) === 0)
          .map((d, i) => (
            <span key={i} className="text-[10px] text-gray-400 font-medium">
              {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </span>
          ))}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-orange-500 rounded" />
          <span className="text-xs text-gray-500">Gross Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-green-500 rounded border-dashed border-b" />
          <span className="text-xs text-gray-500">Net to You</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function RestaurantAnalytics() {
  const [period, setPeriod] = useState<Period>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('gross_revenue');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { period };
      if (period === 'custom' && customFrom && customTo) {
        params.from = customFrom;
        params.to = customTo;
      }
      const { data: res } = await api.get('/analytics/restaurant', { params });
      if (res.success) setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sortedItems = data?.menuItemEarnings
    ? [...data.menuItemEarnings].sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
        return sortAsc ? cmp : -cmp;
      })
    : [];

  const periodLabels: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analytics</h1>
          <p className="text-gray-500 font-medium mt-1">Real-time earnings from your menu</p>
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {periodLabels.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                period === key
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-primary hover:text-brand-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-gray-600">From</label>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-brand-primary" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-gray-600">To</label>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-brand-primary" />
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={!customFrom || !customTo}
            className="px-4 py-1.5 bg-brand-primary text-white rounded-lg text-sm font-bold disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
        </div>
      ) : !data ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p className="font-medium">Failed to load analytics. Please refresh.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards — Period stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Gross Revenue',
                value: `₹${data.kpis.range_revenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                sub: `${data.kpis.range_orders} orders`,
                icon: <DollarSign className="w-5 h-5" />,
                color: 'bg-orange-500'
              },
              {
                label: 'Net to You',
                value: `₹${data.kpis.range_net_revenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                sub: `after ₹${data.kpis.range_commission.toFixed(0)} commission`,
                icon: <TrendingUp className="w-5 h-5" />,
                color: 'bg-green-500'
              },
              {
                label: 'Avg Order Value',
                value: `₹${data.kpis.range_aov.toFixed(0)}`,
                sub: `${data.kpis.range_items_sold} items sold`,
                icon: <Package className="w-5 h-5" />,
                color: 'bg-blue-500'
              },
              {
                label: 'Discounts Given',
                value: `₹${data.kpis.range_discounts.toFixed(0)}`,
                sub: 'restaurant discount share',
                icon: <Calendar className="w-5 h-5" />,
                color: 'bg-purple-500'
              },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 ${kpi.color} text-white rounded-xl flex items-center justify-center mb-3`}>
                  {kpi.icon}
                </div>
                <p className="text-2xl font-black text-gray-900">{kpi.value}</p>
                <p className="text-sm font-bold text-gray-500 mt-1">{kpi.label}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Always-on stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Today's Revenue", value: `₹${data.kpis.today_revenue.toFixed(0)}`, sub: `${data.kpis.today_orders} orders` },
              { label: 'This Week Orders', value: `${data.kpis.week_orders}`, sub: 'delivered orders' },
              { label: 'This Month', value: `₹${data.kpis.month_revenue.toFixed(0)}`, sub: `${data.kpis.month_orders} orders` },
              { label: 'All-time Sales', value: `₹${Number(data.kpis.total_sales).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, sub: `${data.kpis.completed_orders} completed` },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-lg font-black text-gray-900">{stat.value}</p>
                <p className="text-xs font-bold text-gray-500 mt-0.5">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-gray-900">Revenue Chart</h2>
                <p className="text-sm text-gray-400 font-medium mt-0.5">
                  {data.period.from
                    ? `${new Date(data.period.from).toLocaleDateString('en-IN')} – ${new Date(data.period.to).toLocaleDateString('en-IN')}`
                    : ''}
                </p>
              </div>
            </div>
            <AreaChart data={data.chartData} />
          </div>

          {/* Menu Item Earnings Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <Award className="w-5 h-5 text-brand-primary" />
              <div>
                <h2 className="font-black text-gray-900">Earnings by Menu Item</h2>
                <p className="text-sm text-gray-400 font-medium">
                  {sortedItems.length} items · Click column header to sort
                </p>
              </div>
            </div>

            {sortedItems.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No completed orders in this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-black text-gray-500 uppercase tracking-wider">
                      <th className="text-left px-6 py-3">#</th>
                      {([
                        { key: 'name', label: 'Item' },
                        { key: 'units_sold', label: 'Units Sold' },
                        { key: 'gross_revenue', label: 'Gross (₹)' },
                        { key: 'discount_share', label: 'Discount (₹)' },
                        { key: 'net_revenue', label: 'Net (₹)' },
                        { key: 'contribution_pct', label: 'Contribution' },
                      ] as { key: SortKey; label: string }[]).map(col => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className="text-left px-4 py-3 cursor-pointer select-none hover:text-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            <ArrowUpDown className={`w-3 h-3 ${sortKey === col.key ? 'text-brand-primary' : 'opacity-40'}`} />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sortedItems.map((item, i) => (
                      <>
                        <tr
                          key={item.menu_item_id}
                          onClick={() => setExpandedItem(expandedItem === item.menu_item_id ? null : item.menu_item_id)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary font-black flex items-center justify-center text-xs">
                              {i + 1}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{item.name}</span>
                              {expandedItem === item.menu_item_id
                                ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                                : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                            </div>
                            {/* Contribution bar */}
                            <div className="w-32 h-1 bg-gray-100 rounded-full mt-2">
                              <div
                                className="h-full bg-brand-primary rounded-full transition-all duration-700"
                                style={{ width: `${item.contribution_pct}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4 font-bold text-gray-900">{item.units_sold}</td>
                          <td className="px-4 py-4 font-bold text-gray-900">₹{item.gross_revenue.toFixed(2)}</td>
                          <td className="px-4 py-4 font-bold text-red-500">
                            {item.discount_share > 0 ? `-₹${item.discount_share.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-4 py-4 font-black text-green-700">₹{item.net_revenue.toFixed(2)}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black ${
                              item.contribution_pct >= 20 ? 'bg-orange-50 text-orange-700' :
                              item.contribution_pct >= 10 ? 'bg-blue-50 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {item.contribution_pct.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                        {expandedItem === item.menu_item_id && (
                          <tr key={`${item.menu_item_id}-detail`} className="bg-orange-50/50">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-400 font-medium">Units × Avg Price</p>
                                  <p className="font-black text-gray-900 mt-0.5">
                                    {item.units_sold} × ₹{item.units_sold > 0 ? (item.gross_revenue / item.units_sold).toFixed(2) : '0'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-400 font-medium">Gross Revenue</p>
                                  <p className="font-black text-gray-900 mt-0.5">₹{item.gross_revenue.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 font-medium">Discount Share</p>
                                  <p className="font-black text-red-500 mt-0.5">−₹{item.discount_share.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400 font-medium">Net Earning</p>
                                  <p className="font-black text-green-700 mt-0.5">₹{item.net_revenue.toFixed(2)}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-black text-gray-900 text-sm border-t-2 border-gray-100">
                      <td className="px-6 py-4" colSpan={2}>Total</td>
                      <td className="px-4 py-4">{sortedItems.reduce((s, i) => s + i.units_sold, 0)}</td>
                      <td className="px-4 py-4">₹{sortedItems.reduce((s, i) => s + i.gross_revenue, 0).toFixed(2)}</td>
                      <td className="px-4 py-4 text-red-500">
                        −₹{sortedItems.reduce((s, i) => s + i.discount_share, 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-green-700">₹{sortedItems.reduce((s, i) => s + i.net_revenue, 0).toFixed(2)}</td>
                      <td className="px-4 py-4">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
