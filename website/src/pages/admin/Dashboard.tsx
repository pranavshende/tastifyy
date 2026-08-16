import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';

type Tab = 'overview' | 'restaurants' | 'delivery' | 'users' | 'support';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-brand-dark text-white flex flex-col">
        <div className="p-6">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-xl font-black mb-4">
            T
          </div>
          <h2 className="text-xl font-bold">Admin Portal</h2>
          <p className="text-gray-400 text-sm">Welcome, {user?.name}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'overview' ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'restaurants' ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🏪 Restaurants
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'delivery' ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🛵 Delivery Partners
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'users' ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'support' ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🎫 Support
          </button>
        </nav>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-all"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'restaurants' && <RestaurantsTab />}
          {activeTab === 'delivery' && <DeliveryTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'support' && <SupportTab />}
        </div>
      </div>
    </div>
  );
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────
function OverviewTab() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any[]>([]);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => {
      setMetrics(res.data.data);
      setLoading(false);
    });
    api.get('/analytics/admin').then((res) => {
      setAnalytics(res.data.data);
    });
  }, []);

  if (loading) return <div className="text-gray-500 font-semibold animate-pulse">Loading metrics...</div>;

  const cards = [
    { title: 'Total Users', value: metrics.totalUsers, icon: '👥', color: 'bg-blue-100 text-blue-600' },
    { title: 'Active Restaurants', value: metrics.activeRestaurants, icon: '🏪', color: 'bg-green-100 text-green-600' },
    { title: 'Pending Restaurants', value: metrics.pendingRestaurants, icon: '⏳', color: 'bg-orange-100 text-orange-600' },
    { title: 'Delivery Partners', value: metrics.totalDeliveryPartners, icon: '🛵', color: 'bg-purple-100 text-purple-600' },
    { title: 'Pending Delivery', value: metrics.pendingDeliveryPartners, icon: '⏳', color: 'bg-orange-100 text-orange-600' },
    { title: 'Total Orders', value: metrics.totalOrders, icon: '📦', color: 'bg-indigo-100 text-indigo-600' },
  ];

  // For the simple bar chart
  const maxRevenue = Math.max(...analytics.map(a => a.revenue), 1); // prevent div by zero

  return (
    <div>
      <h2 className="text-3xl font-black text-gray-900 mb-8">Platform Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {cards.map((c, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${c.color} mr-4`}>
              {c.icon}
            </div>
            <div>
              <p className="text-gray-500 text-sm font-semibold">{c.title}</p>
              <p className="text-3xl font-black text-gray-900">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Revenue Trend (30 Days)</h3>
        {analytics.length === 0 ? (
          <div className="text-gray-400 font-semibold text-center py-10">No revenue data available yet.</div>
        ) : (
          <div className="flex items-end h-64 gap-2">
            {analytics.map((day, idx) => {
              const heightPct = (day.revenue / maxRevenue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-gray-900 text-white text-xs font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap transition-opacity">
                    {day.date}: ₹{day.revenue.toFixed(0)}
                  </div>
                  <div 
                    className="w-full bg-brand-primary rounded-t-sm transition-all group-hover:bg-brand-secondary" 
                    style={{ height: `${heightPct}%`, minHeight: '4px' }} 
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
  }, [statusFilter]);

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'suspend') => {
    if (window.confirm(`Are you sure you want to ${action} this restaurant?`)) {
      const payload = action === 'reject' ? { reason: 'Admin rejected' } : {};
      await api.patch(`/admin/restaurants/${id}/${action}`, payload);
      fetchRestaurants();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Restaurants</h2>
          <p className="text-gray-500 mt-1">Manage restaurant partners and approvals</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-semibold text-gray-700 outline-none focus:border-brand-primary"
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm font-semibold uppercase">
            <tr>
              <th className="px-6 py-4">Restaurant</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {restaurants.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">{r.name}</p>
                  <p className="text-sm text-gray-500">{r.type} {r.is_pure_veg && '• 🌿 Pure Veg'}</p>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {r.city}, {r.state}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    r.status === 'active' ? 'bg-green-100 text-green-700' :
                    r.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(r.id, 'approve')} className="text-green-600 bg-green-50 px-3 py-1 rounded-lg font-bold text-sm hover:bg-green-100">Approve</button>
                      <button onClick={() => handleAction(r.id, 'reject')} className="text-red-600 bg-red-50 px-3 py-1 rounded-lg font-bold text-sm hover:bg-red-100">Reject</button>
                    </>
                  )}
                  {r.status === 'active' && (
                    <button onClick={() => handleAction(r.id, 'suspend')} className="text-orange-600 bg-orange-50 px-3 py-1 rounded-lg font-bold text-sm hover:bg-orange-100">Suspend</button>
                  )}
                  {r.status === 'suspended' && (
                    <button onClick={() => handleAction(r.id, 'approve')} className="text-green-600 bg-green-50 px-3 py-1 rounded-lg font-bold text-sm hover:bg-green-100">Reactivate</button>
                  )}
                </td>
              </tr>
            ))}
            {restaurants.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-semibold">No restaurants found.</td></tr>
            )}
          </tbody>
        </table>
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
  }, [statusFilter]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (window.confirm(`Are you sure you want to ${action} this partner?`)) {
      const payload = action === 'reject' ? { reason: 'Admin rejected' } : {};
      await api.patch(`/admin/delivery-partners/${id}/${action}`, payload);
      fetchPartners();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Delivery Partners</h2>
          <p className="text-gray-500 mt-1">Manage delivery fleet approvals</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-semibold text-gray-700 outline-none focus:border-brand-primary"
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm font-semibold uppercase">
            <tr>
              <th className="px-6 py-4">Partner</th>
              <th className="px-6 py-4">Vehicle</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {partners.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">{p.name || 'No Name'}</p>
                  <p className="text-sm text-gray-500">{p.phone}</p>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  <p className="font-semibold uppercase">{p.vehicle_number}</p>
                  <p className="text-sm text-gray-500 capitalize">{p.vehicle_type}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    p.status === 'active' ? 'bg-green-100 text-green-700' :
                    p.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {p.status === 'pending' && (
                    <>
                      <button onClick={() => handleAction(p.id, 'approve')} className="text-green-600 bg-green-50 px-3 py-1 rounded-lg font-bold text-sm hover:bg-green-100">Approve</button>
                      <button onClick={() => handleAction(p.id, 'reject')} className="text-red-600 bg-red-50 px-3 py-1 rounded-lg font-bold text-sm hover:bg-red-100">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {partners.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-semibold">No delivery partners found.</td></tr>
            )}
          </tbody>
        </table>
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
  }, [search]);

  const handleBlock = async (id: string, currentlyBlocked: boolean) => {
    if (window.confirm(`Are you sure you want to ${currentlyBlocked ? 'unblock' : 'block'} this user?`)) {
      await api.patch(`/admin/users/${id}/block`, { block: !currentlyBlocked });
      fetchUsers();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Users</h2>
          <p className="text-gray-500 mt-1">Manage platform users</p>
        </div>
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-semibold text-gray-700 outline-none focus:border-brand-primary w-64"
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm font-semibold uppercase">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">{u.name}</p>
                  <p className="text-sm text-gray-500">{u.email || u.phone}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold uppercase">{u.role}</span>
                </td>
                <td className="px-6 py-4">
                  {u.is_active ? (
                    <span className="text-green-600 font-semibold text-sm">Active</span>
                  ) : (
                    <span className="text-red-600 font-semibold text-sm">Blocked</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleBlock(u.id, !u.is_active)}
                      className={`${u.is_active ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'} px-3 py-1 rounded-lg font-bold text-sm`}
                    >
                      {u.is_active ? 'Block' : 'Unblock'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-semibold">No users found.</td></tr>
            )}
          </tbody>
        </table>
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
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Support Tickets</h2>
          <p className="text-gray-500 mt-1">Manage customer issues and refunds</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2 font-semibold text-gray-700 outline-none focus:border-brand-primary"
        >
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-sm font-semibold uppercase">
            <tr>
              <th className="px-6 py-4">Ticket Info</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 uppercase">{t.category.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-500 truncate w-64">{t.description}</p>
                  {t.order_id && <p className="text-xs text-brand mt-1 font-bold">Order #{t.order_id.slice(-6).toUpperCase()}</p>}
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-800">{t.customer.name}</p>
                  <p className="text-sm text-gray-500">{t.customer.phone}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    t.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {t.status === 'open' ? (
                    <button
                      onClick={() => handleResolve(t.id, t.order_id)}
                      className="text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg font-bold text-sm"
                    >
                      Resolve
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm font-semibold truncate w-32 inline-block text-right">
                      {t.resolution_notes}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-semibold">No tickets found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
