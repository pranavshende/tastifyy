import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Edit2, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';

export default function MenuManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI State
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCatModal, setShowCatModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [activeCatId, setActiveCatId] = useState<string | null>(null);

  // Form State
  const [newCatName, setNewCatName] = useState('');
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', is_veg: true });

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await api.get('/menu/categories');
      setCategories(res.data.data);
      // Auto-expand all categories by default
      if (Object.keys(expandedCats).length === 0 && res.data.data.length > 0) {
        const initialExpand: Record<string, boolean> = {};
        res.data.data.forEach((c: any) => initialExpand[c.id] = true);
        setExpandedCats(initialExpand);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCat = (id: string) => {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.post('/menu/categories', { name: newCatName, display_order: categories.length });
      setNewCatName('');
      setShowCatModal(false);
      fetchMenu();
    } catch (err) {
      alert('Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: string, itemCount: number) => {
    if (itemCount > 0) {
      alert('Cannot delete category with items. Please remove or move items first.');
      return;
    }
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/menu/categories/${id}`);
      fetchMenu();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCatId) return;
    try {
      await api.post('/menu/items', {
        category_id: activeCatId,
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        is_veg: newItem.is_veg,
      });
      setNewItem({ name: '', description: '', price: '', is_veg: true });
      setShowItemModal(false);
      fetchMenu();
    } catch (err) {
      alert('Failed to add item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
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

  // Filter Logic
  const filteredCategories = categories.map(cat => ({
    ...cat,
    menu_items: cat.menu_items?.filter((item: any) => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.menu_items?.length > 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 shrink-0 gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Menu Manager</h1>
            <p className="text-gray-500 font-medium text-sm mt-0.5">Manage categories, items, and pricing.</p>
          </div>
          <button 
            onClick={() => setShowCatModal(true)}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center hover:bg-black transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Category
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6 shrink-0 max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search items or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 pl-11 pr-4 py-3 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-sm"
          />
        </div>

        {/* Menu List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-6 rounded-2xl font-bold">{error}</div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm mt-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500 font-medium max-w-md mx-auto">
                {searchQuery ? `We couldn't find anything matching "${searchQuery}".` : 'Your menu is currently empty. Start by adding a category.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map(cat => (
                <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  
                  {/* Category Header */}
                  <div 
                    onClick={() => toggleCat(cat.id)}
                    className="bg-gray-50/50 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-gray-100 transition-colors border-b border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      {expandedCats[cat.id] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      <h2 className="text-lg font-black text-gray-900 uppercase tracking-wider">{cat.name}</h2>
                      <span className="bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-full text-xs">
                        {cat.menu_items?.length || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => { setActiveCatId(cat.id); setShowItemModal(true); }}
                        className="bg-brand-primary/10 text-brand-primary font-bold px-4 py-2 rounded-lg text-sm hover:bg-brand-primary/20 transition-colors"
                      >
                        + Add Item
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id, cat.menu_items?.length || 0)}
                        className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Category Items */}
                  {expandedCats[cat.id] && (
                    <div className="divide-y divide-gray-50">
                      {cat.menu_items?.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-400 font-medium">
                          No items in this category yet.
                        </div>
                      ) : (
                        cat.menu_items?.map((item: any) => (
                          <div key={item.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors group">
                            
                            <div className="flex items-start gap-4 flex-1">
                              {/* Veg/Non-Veg Indicator */}
                              <div className={`mt-1 w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                                <div className={`w-2 h-2 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                              </div>
                              
                              <div>
                                <h3 className="font-bold text-gray-900 text-lg mb-1">{item.name}</h3>
                                <p className="text-brand-primary font-black mb-1">₹{parseFloat(item.price).toFixed(2)}</p>
                                {item.description && (
                                  <p className="text-sm text-gray-500 font-medium line-clamp-2 max-w-lg">{item.description}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6 self-start sm:self-auto ml-8 sm:ml-0">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <span className={`text-xs font-bold uppercase ${item.is_available ? 'text-green-600' : 'text-gray-400'}`}>
                                  {item.is_available ? 'In Stock' : 'Out of Stock'}
                                </span>
                                <div 
                                  className={`w-12 h-7 rounded-full p-1 transition-colors flex items-center ${item.is_available ? 'bg-green-500' : 'bg-gray-300'}`}
                                  onClick={() => toggleItemAvailability(item.id, item.is_available)}
                                >
                                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${item.is_available ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                              </label>

                              <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-gray-400 hover:text-brand-primary transition-colors bg-white rounded-lg border border-gray-200">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-lg border border-gray-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCatModal(false)}></div>
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md relative z-10 animate-fade-in-up">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Add New Category</h2>
            <form onSubmit={handleAddCategory}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Category Name</label>
                <input 
                  type="text" 
                  required
                  autoFocus
                  placeholder="e.g. Starters, Main Course, Beverages"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCatModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowItemModal(false)}></div>
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg relative z-10 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">Add Menu Item</h2>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-bold truncate max-w-[150px]">
                {categories.find(c => c.id === activeCatId)?.name}
              </span>
            </div>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Item Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Paneer Butter Masala"
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newItem.price}
                    onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Food Type</label>
                  <div className="flex bg-gray-50 border border-gray-200 rounded-xl p-1 relative">
                    <button 
                      type="button"
                      onClick={() => setNewItem({ ...newItem, is_veg: true })}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors z-10 ${newItem.is_veg ? 'text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Veg
                    </button>
                    <button 
                      type="button"
                      onClick={() => setNewItem({ ...newItem, is_veg: false })}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors z-10 ${!newItem.is_veg ? 'text-red-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Non-Veg
                    </button>
                    {/* Sliding indicator */}
                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 shadow-sm ${newItem.is_veg ? 'bg-white border border-green-200 left-1' : 'bg-white border border-red-200 left-[calc(50%+2px)]'}`}></div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Description (Optional)</label>
                <textarea 
                  rows={3}
                  placeholder="What makes this dish special?"
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3.5 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary">
                  Save Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
