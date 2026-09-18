import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface CustomizationOption {
  id: string;
  label: string;
  additional_price: number;
}

interface CustomizationGroup {
  id: string;
  group_name: string;
  is_required: boolean;
  is_multi_select: boolean;
  options: CustomizationOption[];
}

interface FoodItem {
  id: string;
  name: string;
  price: number;
  is_veg: boolean;
}

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FoodItem;
  customizationGroups: CustomizationGroup[];
  onAddToCart: (itemId: string, selectedOptions: Record<string, string[]>, finalPrice: number) => void;
}

export default function CustomizationModal({ isOpen, onClose, item, customizationGroups, onAddToCart }: CustomizationModalProps) {
  // Map of groupId -> array of selected optionIds
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string>('');

  // Reset state when opened with a new item
  useEffect(() => {
    if (isOpen) {
      setSelectedOptions({});
      setError('');
    }
  }, [isOpen, item.id]);

  if (!isOpen) return null;

  const handleOptionToggle = (groupId: string, optionId: string, isMulti: boolean) => {
    setError('');
    setSelectedOptions(prev => {
      const currentSelection = prev[groupId] || [];
      
      if (isMulti) {
        // Toggle selection
        if (currentSelection.includes(optionId)) {
          return { ...prev, [groupId]: currentSelection.filter(id => id !== optionId) };
        } else {
          return { ...prev, [groupId]: [...currentSelection, optionId] };
        }
      } else {
        // Single select - replace selection
        return { ...prev, [groupId]: [optionId] };
      }
    });
  };

  const calculateTotal = () => {
    let total = Number(item.price);
    customizationGroups.forEach(group => {
      const selectedIds = selectedOptions[group.id] || [];
      selectedIds.forEach(optionId => {
        const option = group.options.find(o => o.id === optionId);
        if (option) {
          total += Number(option.additional_price);
        }
      });
    });
    return total;
  };

  const handleAdd = () => {
    // Validate required groups
    for (const group of customizationGroups) {
      if (group.is_required) {
        const selectedIds = selectedOptions[group.id] || [];
        if (selectedIds.length === 0) {
          setError(`Please select an option for ${group.group_name}`);
          return;
        }
      }
    }

    onAddToCart(item.id, selectedOptions, calculateTotal());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
              </div>
              <h3 className="text-xl font-black text-gray-900">{item.name}</h3>
            </div>
            <p className="text-brand-dark font-bold">Base Price: ₹{item.price}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customizations Scroll Area */}
        <div className="overflow-y-auto p-6 space-y-8 flex-1">
          {customizationGroups.map((group) => {
            const isSelected = (optionId: string) => (selectedOptions[group.id] || []).includes(optionId);

            return (
              <div key={group.id}>
                <div className="flex justify-between items-baseline mb-4">
                  <h4 className="font-bold text-gray-900 text-lg">{group.group_name}</h4>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${group.is_required ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                    {group.is_required ? 'Required' : 'Optional'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {group.options.map((option) => (
                    <label 
                      key={option.id} 
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected(option.id) ? 'border-brand-primary bg-orange-50' : 'border-gray-100 hover:border-brand-primary/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${group.is_multi_select ? 'rounded' : 'rounded-full'} ${isSelected(option.id) ? 'bg-brand-primary border-brand-primary text-white' : 'border-gray-300'}`}>
                          {isSelected(option.id) && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="font-medium text-gray-800">{option.label}</span>
                      </div>
                      <span className="font-bold text-gray-600">
                        {Number(option.additional_price) > 0 ? `+₹${option.additional_price}` : 'Free'}
                      </span>
                      
                      {/* Hidden input just for accessibility if needed, though the label wrapper handles clicks */}
                      <input 
                        type={group.is_multi_select ? "checkbox" : "radio"} 
                        name={group.id}
                        className="hidden"
                        checked={isSelected(option.id)}
                        onChange={() => handleOptionToggle(group.id, option.id, group.is_multi_select)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
          {error && <p className="text-red-500 font-medium text-sm mb-3 text-center">{error}</p>}
          <button 
            onClick={handleAdd}
            className="w-full bg-brand-primary text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-brand-primary/30 hover:bg-brand-secondary transition-all active:scale-[0.98] flex justify-between px-6"
          >
            <span>Add Item</span>
            <span>₹{calculateTotal()}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
