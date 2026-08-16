import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function MenuManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category State
  const [newCatName, setNewCatName] = useState('');

  // New Item State
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [newItemData, setNewItemData] = useState({
    name: '',
    description: '',
    price: '',
    is_veg: true,
  });

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await api.get('/menu/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error('Failed to fetch menu', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.post('/menu/categories', { name: newCatName, display_order: categories.length });
      setNewCatName('');
      fetchMenu();
    } catch (err) {
      alert('Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category? It must be empty.')) return;
    try {
      await api.delete(`/menu/categories/${id}`);
      fetchMenu();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete category');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategoryId) return;
    try {
      await api.post('/menu/items', {
        category_id: activeCategoryId,
        name: newItemData.name,
        description: newItemData.description,
        price: parseFloat(newItemData.price),
        is_veg: newItemData.is_veg,
      });
      setNewItemData({ name: '', description: '', price: '', is_veg: true });
      setActiveCategoryId(null);
      fetchMenu();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to add item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/menu/items/${id}`);
      fetchMenu();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const toggleItemAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/menu/items/${id}/status`, { is_available: !currentStatus });
      fetchMenu();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Menu Manager</h1>
          <p className="text-gray-500 mt-1">Organize your categories and menu items</p>
        </div>
      </div>

      {/* Add Category */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex gap-4 items-center">
        <input
          type="text"
          placeholder="New Category Name (e.g., Starters, Main Course)"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary outline-none"
        />
        <button
          onClick={handleAddCategory}
          className="bg-brand-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-secondary transition-colors"
        >
          + Add Category
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 font-semibold animate-pulse">Loading menu...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-500 font-semibold text-lg">Your menu is empty.</p>
          <p className="text-gray-400">Add your first category above to get started.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">{cat.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveCategoryId(cat.id)}
                    className="text-sm font-bold text-brand-primary bg-brand-primary/10 px-4 py-2 rounded-lg hover:bg-brand-primary/20"
                  >
                    + Add Item
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-sm font-bold text-red-500 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Add Item Form (Visible if activeCategoryId matches) */}
              {activeCategoryId === cat.id && (
                <form onSubmit={handleAddItem} className="p-6 bg-brand-light border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <h3 className="font-bold text-gray-800 mb-2">Adding new item to {cat.name}</h3>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Item Name"
                      required
                      value={newItemData.name}
                      onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-primary outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      required
                      min="0"
                      step="0.01"
                      value={newItemData.price}
                      onChange={(e) => setNewItemData({ ...newItemData, price: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-brand-primary outline-none"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700">
                      <input
                        type="checkbox"
                        checked={newItemData.is_veg}
                        onChange={(e) => setNewItemData({ ...newItemData, is_veg: e.target.checked })}
                        className="w-5 h-5 text-green-500 rounded focus:ring-green-500 accent-green-500"
                      />
                      Pure Veg Item 🌿
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setActiveCategoryId(null)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary">Save Item</button>
                    </div>
                  </div>
                </form>
              )}

              {/* Items List */}
              <div className="divide-y divide-gray-100">
                {cat.menu_items?.length === 0 ? (
                  <p className="px-6 py-4 text-gray-400 text-sm">No items in this category.</p>
                ) : (
                  cat.menu_items?.map((item: any) => (
                    <div key={item.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-brand-primary font-bold text-sm">₹{parseFloat(item.price).toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className={`text-xs font-bold uppercase ${item.is_available ? 'text-green-600' : 'text-gray-400'}`}>
                            {item.is_available ? 'In Stock' : 'Out of Stock'}
                          </span>
                          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${item.is_available ? 'bg-green-500' : 'bg-gray-300'}`}
                               onClick={() => toggleItemAvailability(item.id, item.is_available)}>
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.is_available ? 'translate-x-4' : 'translate-x-0'}`}></div>
                          </div>
                        </label>
                        
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2"
                          title="Delete Item"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
