import { useState } from 'react';
import api from '../../services/api';

interface LineItem {
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fromAddress?: string;
  toAddress?: string;
  moveDate?: string;
  bedrooms?: number;
}

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  lead: Lead;
}

const CATEGORIES = [
  { value: 'labor', label: 'Labour' },
  { value: 'packing', label: 'Packing Materials' },
  { value: 'storage', label: 'Storage' },
  { value: 'other', label: 'Other' },
];

const PRESET_ITEMS = [
  { description: 'Removal Service (Men & Van)', category: 'labor', unitPrice: 0 },
  { description: 'Packing Service', category: 'labor', unitPrice: 150 },
  { description: 'Box Pack (20 boxes)', category: 'packing', unitPrice: 45 },
  { description: 'Wardrobe Boxes (5)', category: 'packing', unitPrice: 35 },
  { description: 'Bubble Wrap Roll', category: 'packing', unitPrice: 15 },
  { description: 'Tape (5 rolls)', category: 'packing', unitPrice: 10 },
  { description: 'Storage per Week', category: 'storage', unitPrice: 50 },
  { description: 'Piano Moving', category: 'other', unitPrice: 150 },
  { description: 'Dismantling/Assembly', category: 'other', unitPrice: 75 },
];

export const CreateQuoteModal = ({ isOpen, onClose, onCreated, lead }: CreateQuoteModalProps) => {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: 'Removal Service (Men & Van)', category: 'labor', quantity: 1, unitPrice: 0 },
  ]);
  const [deposit, setDeposit] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState(14);
  const [saving, setSaving] = useState(false);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', category: 'labor', quantity: 1, unitPrice: 0 }]);
  };

  const addPresetItem = (preset: typeof PRESET_ITEMS[0]) => {
    setLineItems([...lineItems, { ...preset, quantity: 1 }]);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vatAmount = subtotal * 0.2;
  const total = subtotal + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0 || lineItems.some(item => !item.description || item.unitPrice <= 0)) {
      alert('Please add at least one line item with a valid price');
      return;
    }

    setSaving(true);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);

      await api.post('/quotes', {
        leadId: lead.id,
        lineItems: lineItems.map((item, index) => ({
          ...item,
          sortOrder: index,
        })),
        deposit: deposit > 0 ? deposit : undefined,
        notes: notes || undefined,
        validUntil: validUntil.toISOString(),
        fromAddress: lead.fromAddress,
        toAddress: lead.toAddress,
        moveDate: lead.moveDate,
        bedrooms: lead.bedrooms,
      });

      onCreated();
      onClose();
    } catch (error) {
      console.error('Failed to create quote', error);
      alert('Failed to create quote. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Create Quote</h2>
              <p className="text-sm text-slate-500">
                For {lead.firstName} {lead.lastName}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Move Details Summary */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Move Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">From:</span>
                    <span className="ml-2 font-medium">{lead.fromAddress || 'TBC'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">To:</span>
                    <span className="ml-2 font-medium">{lead.toAddress || 'TBC'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Date:</span>
                    <span className="ml-2 font-medium">
                      {lead.moveDate ? new Date(lead.moveDate).toLocaleDateString('en-GB') : 'TBC'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Bedrooms:</span>
                    <span className="ml-2 font-medium">{lead.bedrooms || 'TBC'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Add Presets */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Quick Add Items</h3>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ITEMS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => addPresetItem(preset)}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
                    >
                      + {preset.description}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-700">Line Items</h3>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Custom Item
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase w-32">Category</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-slate-500 uppercase w-20">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase w-28">Unit Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase w-28">Amount</th>
                        <th className="px-4 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {lineItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Description"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={item.category}
                              onChange={(e) => updateLineItem(index, 'category', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-center focus:ring-blue-500 focus:border-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full pl-6 pr-2 py-1 border border-slate-300 rounded text-right focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            £{(item.quantity * item.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium">£{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">VAT (20%)</span>
                    <span className="font-medium">£{vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total</span>
                    <span className="text-blue-600">£{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Deposit Required
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={deposit}
                      onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Suggested: £{(total * 0.5).toFixed(2)} (50%)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quote Valid For
                  </label>
                  <select
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special requirements or notes for the customer..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-700 hover:text-slate-900"
              >
                Cancel
              </button>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Quote'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateQuoteModal;
