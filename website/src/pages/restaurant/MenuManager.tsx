import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { getStorageUrl } from '../../lib/supabase';
import { Plus, Trash2, Search, ChevronDown, ChevronUp, MoreVertical, Camera, Loader2, X, AlertCircle, Edit2 } from 'lucide-react';

// ─── Image Placeholder ────────────────────────────────────────────────────────

function DishImagePlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="text-2xl mb-1">🍽️</div>
      </div>
    </div>
  );
}

// ─── Add/Edit Item Modal ──────────────────────────────────────────────────────

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  restaurantId?: string;
  categories: any[];
  existingItem?: any;
  defaultCategoryId?: string;
}

function ItemModal({ isOpen, onClose, onSave, categories, existingItem, defaultCategoryId }: ItemModalProps) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: defaultCategoryId || '',
    is_veg: true,
    is_available: true,
    preparation_time_mins: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteExistingImage, setDeleteExistingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing item data when editing
  useEffect(() => {
    if (existingItem) {
      setForm({
        name: existingItem.name || '',
        description: existingItem.description || '',
        price: existingItem.price?.toString() || '',
        category_id: existingItem.category_id || defaultCategoryId || '',
        is_veg: existingItem.is_veg ?? true,
        is_available: existingItem.is_available ?? true,
        preparation_time_mins: existingItem.preparation_time_mins?.toString() || '',
      });
      setImagePreview(getStorageUrl(existingItem.image_url) || null);
      setDeleteExistingImage(false);
      setImageFile(null);
    } else {
      setForm({
        name: '',
        description: '',
        price: '',
        category_id: defaultCategoryId || '',
        is_veg: true,
        is_available: true,
        preparation_time_mins: '',
      });
      setImagePreview(null);
      setDeleteExistingImage(false);
      setImageFile(null);
    }
    setError('');
  }, [existingItem, defaultCategoryId, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Invalid file type. Only JPG, PNG, WEBP allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max 5MB.');
      return;
    }
    setError('');
    setImageFile(file);
    setDeleteExistingImage(false);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (existingItem?.image_url) setDeleteExistingImage(true);
  };

  const validate = () => {
    if (!form.name.trim()) return 'Dish name is required';
    if (!form.price || parseFloat(form.price) <= 0) return 'Valid price is required';
    if (!form.category_id) return 'Category is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('description', form.description.trim());
      formData.append('price', form.price);
      formData.append('category_id', form.category_id);
      formData.append('is_veg', String(form.is_veg));
      formData.append('is_available', String(form.is_available));
      if (form.preparation_time_mins) formData.append('preparation_time_mins', form.preparation_time_mins);
      if (imageFile) formData.append('image', imageFile);

      if (existingItem) {
        await api.put(`/menu/items/${existingItem.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        // Handle image delete if requested
        if (deleteExistingImage && !imageFile) {
          await api.delete(`/menu/items/${existingItem.id}/image`);
        }
      } else {
        await api.post('/menu/items', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg relative z-10 shadow-xl max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900">{existingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {typeof error === 'object' ? (error as any).message || JSON.stringify(error) : String(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Dish Image <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-brand-primary transition-colors"
                   onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Camera className="w-7 h-7 text-gray-400 mx-auto mb-1" />
                    <span className="text-[9px] text-gray-400 font-bold">UPLOAD</span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                       className="hidden" onChange={handleFileChange} />
              </div>
              <div className="text-xs text-gray-500 font-medium">
                <p className="font-bold text-gray-700 mb-1">Upload dish photo</p>
                <p>JPG, PNG or WEBP</p>
                <p>Max 5MB</p>
                {imagePreview && (
                  <button type="button" onClick={handleRemoveImage}
                          className="mt-2 text-red-500 hover:text-red-700 font-bold flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Remove image
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Dish Name <span className="text-red-500">*</span></label>
            <input type="text" required placeholder="e.g. Paneer Butter Masala"
                   value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:border-brand-primary" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea rows={2} placeholder="What makes this dish special?"
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:border-brand-primary resize-none" />
          </div>

          {/* Price + Prep Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Price (₹) <span className="text-red-500">*</span></label>
              <input type="number" required min="0" step="0.01" placeholder="0.00"
                     value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                     className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:border-brand-primary" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Prep Time (mins)</label>
              <input type="number" min="0" placeholder="e.g. 20"
                     value={form.preparation_time_mins} onChange={e => setForm(f => ({ ...f, preparation_time_mins: e.target.value }))}
                     className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:border-brand-primary" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
            <select required value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:border-brand-primary">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Food Type */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Food Type <span className="text-red-500">*</span></label>
            <div className="flex bg-gray-50 border border-gray-200 rounded-xl p-1 relative">
              <button type="button" onClick={() => setForm(f => ({ ...f, is_veg: true }))}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors z-10 ${form.is_veg ? 'text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>
                🟢 Vegetarian
              </button>
              <button type="button" onClick={() => setForm(f => ({ ...f, is_veg: false }))}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors z-10 ${!form.is_veg ? 'text-red-700' : 'text-gray-500 hover:text-gray-700'}`}>
                🔴 Non-Veg
              </button>
              <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 shadow-sm ${form.is_veg ? 'bg-white border border-green-200 left-1' : 'bg-white border border-red-200 left-[calc(50%+2px)]'}`}></div>
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-3">
            <input type="checkbox" id="item-available" checked={form.is_available}
                   onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))}
                   className="w-4 h-4 rounded accent-brand-primary" />
            <label htmlFor="item-available" className="text-sm font-bold text-gray-700">Available / In Stock</label>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
                    className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary transition-colors disabled:opacity-60 flex items-center justify-center">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MenuManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showCatModal, setShowCatModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [newCatName, setNewCatName] = useState('');

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await api.get('/menu/categories');
      setCategories(res.data.data);
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

  useEffect(() => { fetchMenu(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCat = (id: string) => setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.post('/menu/categories', { name: newCatName, display_order: categories.length });
      setNewCatName('');
      setShowCatModal(false);
      fetchMenu();
    } catch {
      alert('Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: string, itemCount: number) => {
    if (itemCount > 0) { alert('Cannot delete category with items.'); return; }
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/menu/categories/${id}`);
      fetchMenu();
    } catch {
      alert('Failed to delete category');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/menu/items/${id}`);
      fetchMenu();
    } catch {
      alert('Failed to delete item');
    }
  };

  const toggleItemAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/menu/items/${id}/status`, { is_available: !currentStatus });
      fetchMenu();
    } catch {
      alert('Failed to update status');
    }
  };

  const openAddItem = (catId: string) => {
    setActiveCatId(catId);
    setEditingItem(null);
    setShowItemModal(true);
  };

  const openEditItem = (item: any) => {
    setEditingItem(item);
    setActiveCatId(item.category_id);
    setShowItemModal(true);
  };

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
          <p className="text-gray-500 font-medium text-sm mt-0.5">Manage your menu items, categories and pricing.</p>
        </div>
        <button
          onClick={() => setShowCatModal(true)}
          className="bg-brand-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center hover:bg-brand-secondary transition-colors shadow-sm self-start sm:self-auto"
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
          <div className="flex-1 flex justify-center items-center h-full">
            <div className="bg-red-50 text-red-600 p-6 rounded-2xl font-bold">{typeof error === 'object' ? (error as any).message || JSON.stringify(error) : String(error)}</div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm mt-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500 font-medium max-w-md mx-auto">
              {searchQuery ? `No results for "${searchQuery}".` : 'Your menu is empty. Add a category to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map(cat => (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                
                {/* Category Header */}
                <div
                  onClick={() => toggleCat(cat.id)}
                  className="bg-white px-5 py-4 flex items-center justify-between cursor-pointer select-none hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    {expandedCats[cat.id] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider ml-1">{cat.name}</h2>
                    <span className="bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full text-xs ml-2">
                      {cat.menu_items?.length || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => openAddItem(cat.id)}
                      className="text-brand-primary font-bold text-sm hover:text-brand-secondary transition-colors"
                    >
                      + Add Item
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.menu_items?.length || 0)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Category Items */}
                {expandedCats[cat.id] && (
                  <div className="divide-y divide-gray-100 bg-white">
                    {cat.menu_items?.length === 0 ? (
                      <div className="px-6 py-8 text-center text-gray-400 font-medium text-sm">
                        No items yet. <button onClick={() => openAddItem(cat.id)} className="text-brand-primary font-bold hover:underline">Add one</button>
                      </div>
                    ) : (
                      cat.menu_items?.map((item: any) => {
                        const imageUrl = getStorageUrl(item.image_url);
                        return (
                          <div key={item.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group">
                            
                            {/* Dish Image */}
                            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                              {imageUrl ? (
                                <img src={imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <DishImagePlaceholder className="w-full h-full" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <div className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                </div>
                                <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-500 font-medium truncate">{item.description}</p>
                              )}
                              <p className="text-sm font-black text-gray-900 mt-1">₹{parseFloat(item.price).toFixed(2)}</p>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase hidden sm:block ${item.is_available ? 'text-green-500' : 'text-gray-400'}`}>
                                  {item.is_available ? 'IN STOCK' : 'OUT'}
                                </span>
                                <div
                                  className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center cursor-pointer ${item.is_available ? 'bg-green-500' : 'bg-gray-300'}`}
                                  onClick={() => toggleItemAvailability(item.id, item.is_available)}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${item.is_available ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                              </div>
                              <button
                                onClick={() => openEditItem(item)}
                                className="p-2 text-gray-400 hover:text-brand-primary transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
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
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md relative z-10">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Add New Category</h2>
            <form onSubmit={handleAddCategory}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Category Name</label>
                <input
                  type="text" required autoFocus
                  placeholder="e.g. Starters, Main Course, Beverages"
                  value={newCatName} onChange={e => setNewCatName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCatModal(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit"
                        className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      <ItemModal
        isOpen={showItemModal}
        onClose={() => { setShowItemModal(false); setEditingItem(null); }}
        onSave={fetchMenu}
        categories={categories}
        existingItem={editingItem}
        defaultCategoryId={activeCatId || undefined}
      />
    </div>
  );
}
