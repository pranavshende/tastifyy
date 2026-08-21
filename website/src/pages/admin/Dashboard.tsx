import { useState, useEffect } from 'react';
import api from '../../api/axios';
import socketService from '../../api/socket';
import Sidebar from '../../components/dashboard/Sidebar';
import { 
  Users, Store, ShoppingBag, Bike, ShieldAlert, 
  TrendingUp, AlertCircle, RefreshCw
} from 'lucide-react';

type Tab = 'overview' | 'restaurants' | 'orders' | 'delivery' | 'users' | 'support';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-brand-light flex font-sans text-brand-dark">
      <Sidebar role="admin" activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)} />

      <main className="flex-1 lg:ml-64 p-6 lg:p-8 h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'restaurants' && <RestaurantsTab />}
          {activeTab === 'delivery' && <DeliveryTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'support' && <SupportTab />}
        </div>
      </main>
    </div>
  );
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────
function OverviewTab() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/analytics/admin')
    ]).then(([resMetrics, resAnalytics]) => {
      setMetrics(resMetrics.data.data);
      setAnalytics(resAnalytics.data.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const cards = [
    { title: 'Total Users', value: metrics?.totalUsers || 0, icon: <Users />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { title: 'Active Restaurants', value: metrics?.activeRestaurants || 0, icon: <Store />, color: 'bg-green-50 text-green-600 border-green-100' },
    { title: 'Pending Partners', value: metrics?.pendingRestaurants || 0, icon: <AlertCircle />, color: 'bg-orange-50 text-orange-600 border-orange-100' },
    { title: 'Delivery Fleet', value: metrics?.totalDeliveryPartners || 0, icon: <Bike />, color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { title: 'Total Orders', value: metrics?.totalOrders || 0, icon: <ShoppingBag />, color: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' },
  ];

  const maxRevenue = Math.max(...analytics.map(a => a.revenue), 1);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Platform Overview</h1>
        <p className="text-gray-500 font-medium mt-1">Real-time marketplace analytics and health</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className={`p-6 rounded-3xl border shadow-sm flex flex-col ${c.color}`}>
            <div className="w-12 h-12 rounded-2xl bg-white/60 flex items-center justify-center mb-4 shadow-sm">
              {c.icon}
            </div>
            <p className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">{c.title}</p>
            <p className="text-3xl font-black">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-gray-900 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-brand-primary" />
              Revenue Trend (30 Days)
            </h3>
            <p className="text-sm text-gray-500 font-medium mt-1">Platform fee generation over time</p>
          </div>
        </div>
        
        {analytics.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 h-64 flex items-center justify-center">
            <div className="text-gray-400 font-bold text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
              No revenue data available yet.
            </div>
          </div>
        ) : (
          <div className="flex items-end h-64 gap-2 px-2">
            {analytics.map((day, idx) => {
              const heightPct = (day.revenue / maxRevenue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full pt-10">
                  <div className="opacity-0 group-hover:opacity-100 absolute top-0 bg-gray-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg pointer-events-none whitespace-nowrap transition-opacity z-10 shadow-xl">
                    {day.date}: ₹{day.revenue.toFixed(0)}
                  </div>
                  <div 
                    className="w-full bg-brand-primary/20 rounded-t-lg transition-all group-hover:bg-brand-primary" 
                    style={{ height: `${heightPct}%`, minHeight: '8px' }} 
                  ></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── RESTAURANTS TAB ─────────────────────────────────────────────────────────
function RestaurantsTab() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchRestaurants = () => {
    api.get(`/admin/restaurants?status=${statusFilter === 'all' ? '' : statusFilter}`).then((res) => {
      setRestaurants(res.data.data);
    });
  };

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line
  }, [statusFilter]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'suspend') => {
    if (window.confirm(`Are you sure you want to ${action} this restaurant?`)) {
      const payload = action === 'reject' ? { reason: 'Admin rejected' } : {};
      await api.patch(`/admin/restaurants/${id}/${action}`, payload);
      fetchRestaurants();
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Restaurants</h2>
          <p className="text-gray-500 font-medium mt-1">Manage restaurant partners and approvals</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-1 inline-flex shadow-sm">
          {['pending', 'active', 'rejected', 'suspended', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
                statusFilter === status 
                  ? 'bg-brand-dark text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-gray-500 text-xs font-black uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {restaurants.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-900 text-base">{r.name}</p>
                    <p className="text-sm font-medium text-gray-500 mt-0.5">{r.type} {r.is_pure_veg && <span className="text-green-600 ml-1">🌿 Pure Veg</span>}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {r.city}, {r.state}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      r.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                      r.status === 'pending' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(r.id, 'approve')} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-700 shadow-sm shadow-green-600/20">Approve</button>
                          <button onClick={() => handleAction(r.id, 'reject')} className="bg-white border-2 border-red-100 text-red-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-50">Reject</button>
                        </>
                      )}
                      {r.status === 'active' && (
                        <button onClick={() => handleAction(r.id, 'suspend')} className="bg-white border-2 border-orange-100 text-orange-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-50">Suspend</button>
                      )}
                      {r.status === 'suspended' && (
                        <button onClick={() => handleAction(r.id, 'approve')} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-700 shadow-sm shadow-green-600/20">Reactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {restaurants.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold text-lg">No restaurants found in this category.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── DELIVERY TAB ────────────────────────────────────────────────────────────
function DeliveryTab() {
  const [partners, setPartners] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchPartners = () => {
    api.get(`/admin/delivery-partners?status=${statusFilter === 'all' ? '' : statusFilter}`).then((res) => {
      setPartners(res.data.data);
    });
  };

  useEffect(() => {
    fetchPartners();
    // eslint-disable-next-line
  }, [statusFilter]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (window.confirm(`Are you sure you want to ${action} this partner?`)) {
      const payload = action === 'reject' ? { reason: 'Admin rejected' } : {};
      await api.patch(`/admin/delivery-partners/${id}/${action}`, payload);
      fetchPartners();
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Delivery Fleet</h2>
          <p className="text-gray-500 font-medium mt-1">Manage delivery partner applications</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-1 inline-flex shadow-sm">
          {['pending', 'active', 'rejected', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
                statusFilter === status 
                  ? 'bg-brand-dark text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-gray-500 text-xs font-black uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Partner</th>
                <th className="px-6 py-4">Vehicle Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {partners.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-900 text-base">{p.name || 'Unnamed Partner'}</p>
                    <p className="text-sm font-medium text-gray-500 mt-0.5">{p.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    <p className="font-bold text-gray-900 uppercase">{p.vehicle_number}</p>
                    <p className="text-sm font-medium text-gray-500 capitalize">{p.vehicle_type}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      p.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                      p.status === 'pending' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.status === 'pending' && (
                        <>
                          <button onClick={() => handleAction(p.id, 'approve')} className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-700 shadow-sm shadow-green-600/20">Approve</button>
                          <button onClick={() => handleAction(p.id, 'reject')} className="bg-white border-2 border-red-100 text-red-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-red-50">Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {partners.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold text-lg">No delivery partners found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── USERS TAB ───────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchUsers = () => {
    api.get(`/admin/users?search=${search}`).then((res) => setUsers(res.data.data));
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [search]);

  const handleBlock = async (id: string, currentlyBlocked: boolean) => {
    if (window.confirm(`Are you sure you want to ${currentlyBlocked ? 'unblock' : 'block'} this user?`)) {
      await api.patch(`/admin/users/${id}/block`, { block: !currentlyBlocked });
      fetchUsers();
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Platform Users</h2>
          <p className="text-gray-500 font-medium mt-1">Manage all user accounts globally</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-white border border-gray-200 rounded-xl pl-4 pr-4 py-3 font-medium text-gray-700 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-gray-500 text-xs font-black uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-900 text-base">{u.name}</p>
                    <p className="text-sm font-medium text-gray-500">{u.email || u.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">{u.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    {u.is_active ? (
                      <span className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-lg">Active</span>
                    ) : (
                      <span className="text-red-600 font-bold text-sm bg-red-50 px-3 py-1.5 rounded-lg">Blocked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleBlock(u.id, !u.is_active)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
                          u.is_active 
                            ? 'bg-white border-2 border-red-100 text-red-600 hover:bg-red-50' 
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-sm shadow-green-600/20'
                        }`}
                      >
                        {u.is_active ? 'Block Access' : 'Unblock Access'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold text-lg">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── SUPPORT TAB ─────────────────────────────────────────────────────────────
function SupportTab() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('open');

  const fetchTickets = () => {
    api.get(`/admin/support?status=${statusFilter === 'all' ? '' : statusFilter}`).then((res) => setTickets(res.data.data));
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line
  }, [statusFilter]);

  const handleResolve = async (id: string, orderId: string) => {
    const notes = window.prompt("Enter resolution notes:");
    if (notes === null) return;
    
    let issue_refund = false;
    if (orderId) {
      issue_refund = window.confirm("Do you want to issue a refund for this order?");
    }

    try {
      await api.patch(`/admin/support/${id}/resolve`, { resolution_notes: notes, issue_refund });
      fetchTickets();
    } catch (err) {
      alert("Failed to resolve ticket");
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Support Center</h2>
          <p className="text-gray-500 font-medium mt-1">Resolve customer issues and manage refunds</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-1 inline-flex shadow-sm">
          {['open', 'resolved', 'all'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
                statusFilter === status 
                  ? 'bg-brand-dark text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-gray-500 text-xs font-black uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Ticket details</th>
                <th className="px-6 py-4">Customer Info</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 max-w-sm">
                    <p className="font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-brand-primary" />
                      {t.category.replace('_', ' ')}
                    </p>
                    <p className="text-sm font-medium text-gray-600 mt-2 line-clamp-2">{t.description}</p>
                    {t.order_id && <p className="text-xs font-bold text-gray-400 mt-2 bg-gray-100 inline-block px-2 py-0.5 rounded">Order: {t.order_id.split('-')[0].toUpperCase()}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{t.customer?.name}</p>
                    <p className="text-sm font-medium text-gray-500">{t.customer?.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      t.status === 'resolved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {t.status === 'open' ? (
                      <button
                        onClick={() => handleResolve(t.id, t.order_id)}
                        className="bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-secondary shadow-sm shadow-brand-primary/20"
                      >
                        Resolve Ticket
                      </button>
                    ) : (
                      <div className="text-sm font-medium text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 max-w-[200px] ml-auto text-left">
                        <span className="font-bold text-gray-900 block mb-1">Resolution:</span>
                        {t.resolution_notes}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold text-lg">No support tickets found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── ORDERS TAB ──────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = () => {
    api.get(`/admin/orders?status=${statusFilter === 'all' ? '' : statusFilter}`).then((res) => {
      setOrders(res.data.data || []);
    }).catch(err => console.error(err));
  };

  useEffect(() => {
    fetchOrders();

    socketService.setReconnectCallback(fetchOrders);

    const socket = socketService.getSocket();
    if (socket) {
      const handleNewOrder = (payload: any) => {
        setOrders(prev => {
          if (prev.find(o => o.id === payload.orderId)) return prev;
          const newOrder = {
            id: payload.orderId,
            status: payload.status,
            created_at: payload.created_at,
            total_amount: payload.totalAmount,
            customer: payload.customer,
            restaurant: payload.restaurant,
          };
          return [newOrder, ...prev];
        });
      };

      const handleStatusUpdate = (payload: any) => {
        setOrders(prev => prev.map(o => o.id === payload.orderId ? { ...o, status: payload.status } : o));
      };

      socket.on('order:created', handleNewOrder);
      const events = ['order:accepted', 'order:rejected', 'order:preparing', 'order:ready_for_pickup', 'order:delivered', 'order:cancelled'];
      events.forEach(event => socket.on(event, handleStatusUpdate));

      return () => {
        socket.off('order:created', handleNewOrder);
        events.forEach(event => socket.off(event, handleStatusUpdate));
        socketService.setReconnectCallback(null as any);
      };
    }
    // eslint-disable-next-line
  }, [statusFilter]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      accepted: 'bg-blue-50 text-blue-700 border-blue-200',
      preparing: 'bg-purple-50 text-purple-700 border-purple-200',
      ready_for_pickup: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      delivered: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 flex items-center">
            Platform Orders 
            <RefreshCw className="w-5 h-5 ml-3 text-brand-primary animate-spin-slow" />
          </h2>
          <p className="text-gray-500 font-medium mt-1">Live monitoring of all marketplace orders</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none focus:border-brand-primary shadow-sm"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="ready_for_pickup">Ready for Pickup</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-gray-500 text-xs font-black uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Order ID & Time</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Live Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-900">#{o.id?.split('-')[0].toUpperCase()}</p>
                    <p className="text-sm font-medium text-gray-500 mt-0.5">{new Date(o.created_at).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{o.customer?.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{o.restaurant?.name}</p>
                  </td>
                  <td className="px-6 py-4 font-black text-gray-900 text-lg">
                    ₹{o.total_amount}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusColor(o.status)}`}>
                      {o.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold text-lg">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
