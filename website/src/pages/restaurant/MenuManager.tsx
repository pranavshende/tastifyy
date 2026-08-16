import React, { useState } from 'react';
import api from '../../api/axios';

export default function MenuManager() {
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  
  const restaurantId = '00000000-0000-0000-0000-000000000000'; // Placeholder UUID
  const categoryId = '00000000-0000-0000-0000-000000000000'; // Placeholder UUID

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/menu/items', {
        restaurant_id: restaurantId,
        category_id: categoryId,
        name: itemName,
        price: parseFloat(itemPrice),
        is_veg: isVeg
      });
      alert('Item added successfully!');
    } catch (err) {
      alert('Failed to add item (Note: needs valid UUIDs to succeed)');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Manage Menu</h2>
      <form onSubmit={handleAddItem} className="space-y-4 max-w-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">Item Name</label>
          <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={itemName} onChange={e => setItemName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
          <input type="number" className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={itemPrice} onChange={e => setItemPrice(e.target.value)} required />
        </div>
        <div className="flex items-center">
          <input type="checkbox" className="mr-2" checked={isVeg} onChange={e => setIsVeg(e.target.checked)} />
          <label className="text-sm font-medium text-gray-700">Is Veg?</label>
        </div>
        <button type="submit" className="w-full bg-[#E86A22] text-white py-2 rounded-md hover:bg-[#d55e1a]">Add Item</button>
      </form>
    </div>
  );
}
